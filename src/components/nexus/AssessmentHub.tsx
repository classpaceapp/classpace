import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Copy, ExternalLink, Edit2, Save, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const MAX_TOPIC_LENGTH = 200;

const AssessmentHub: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [assessmentType, setAssessmentType] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [totalMarks, setTotalMarks] = useState(100);
  const [curriculum, setCurriculum] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Assessment state
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) fetchAssessments();
  }, [user?.id]);

  const fetchAssessments = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('nexus_assessments')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assessments:', error);
      return;
    }

    setAssessments(data || []);
  };

  const handleGenerate = async () => {
    if (!assessmentType || !subject || !topic || !curriculum || !yearLevel) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (topic.length > MAX_TOPIC_LENGTH) {
      toast({
        title: "Topic Too Long",
        description: `Topic must be ${MAX_TOPIC_LENGTH} characters or less`,
        variant: "destructive"
      });
      return;
    }

    if (numQuestions < 5 || numQuestions > 50) {
      toast({
        title: "Invalid Question Count",
        description: "Number of questions must be between 5 and 50",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('nexus-assessment-generator', {
        body: {
          assessmentType,
          subject,
          gradeLevel: yearLevel,
          topic,
          numQuestions,
          totalMarks,
          curriculum
        }
      });

      if (error) throw error;

      // Store the assessment in database
      const { data: newAssessment, error: insertError } = await supabase
        .from('nexus_assessments')
        .insert({
          teacher_id: user?.id,
          title: `${subject} - ${topic}`,
          assessment_type: assessmentType,
          subject,
          num_questions: numQuestions,
          total_marks: totalMarks,
          curriculum,
          year_level: yearLevel,
          questions: data.assessment
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: "Assessment Generated!",
        description: "Your assessment has been created and saved"
      });

      fetchAssessments();
      
      // Reset form
      setAssessmentType('');
      setSubject('');
      setTopic('');
      setNumQuestions(10);
      setTotalMarks(100);
      setCurriculum('');
      setYearLevel('');

    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate assessment",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPublicLink = (publicCode: string) => {
    const link = `${window.location.origin}/assessment/${publicCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied!",
      description: "Share this link with students to complete the assessment"
    });
  };

  const viewAssessment = async (assessment: any) => {
    setSelectedAssessment(assessment);
    setEditedContent(assessment.questions);
    setIsEditing(false);
    
    // Fetch responses
    const { data, error } = await supabase
      .from('assessment_responses')
      .select('*')
      .eq('assessment_id', assessment.id)
      .order('submitted_at', { ascending: false });

    if (!error) {
      setResponses(data || []);
    }

    setViewDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!selectedAssessment) return;

    const { error } = await supabase
      .from('nexus_assessments')
      .update({ questions: editedContent })
      .eq('id', selectedAssessment.id);

    if (error) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Assessment Updated",
      description: "Your changes have been saved"
    });

    setIsEditing(false);
    fetchAssessments();
    setSelectedAssessment({ ...selectedAssessment, questions: editedContent });
  };

  const deleteAssessment = async (id: string) => {
    const { error } = await supabase
      .from('nexus_assessments')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Assessment Deleted",
      description: "The assessment has been removed"
    });

    fetchAssessments();
    setViewDialogOpen(false);
  };

  const renderMathContent = (text: string) => {
    // Split by display math ($$...$$) and inline math ($...$)
    const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const math = part.slice(2, -2);
        return <BlockMath key={index} math={math} />;
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1);
        return <InlineMath key={index} math={math} />;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="space-y-6">
      {/* Generator Card */}
      <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6" />
            AI-Powered Assessment Generator
          </CardTitle>
          <CardDescription className="text-violet-100">
            Create comprehensive, curriculum-aligned assessments with advanced AI research
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Assessment Type *</Label>
              <Select value={assessmentType} onValueChange={setAssessmentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quiz">Quiz</SelectItem>
                  <SelectItem value="Test">Test</SelectItem>
                  <SelectItem value="Exam">Exam</SelectItem>
                  <SelectItem value="Essay">Essay</SelectItem>
                  <SelectItem value="Assignment">Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                placeholder="e.g., Mathematics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Curriculum *</Label>
              <Select value={curriculum} onValueChange={setCurriculum}>
                <SelectTrigger>
                  <SelectValue placeholder="Select curriculum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IB">International Baccalaureate (IB)</SelectItem>
                  <SelectItem value="IGCSE">IGCSE</SelectItem>
                  <SelectItem value="A-Level">A-Level</SelectItem>
                  <SelectItem value="AP">Advanced Placement (AP)</SelectItem>
                  <SelectItem value="Common Core">Common Core</SelectItem>
                  <SelectItem value="Australian">Australian Curriculum</SelectItem>
                  <SelectItem value="UK National">UK National Curriculum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year Level *</Label>
              <Select value={yearLevel} onValueChange={setYearLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {['7', '8', '9', '10', '11', '12'].map(year => (
                    <SelectItem key={year} value={year}>Year {year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Topic *
              <span className="text-xs text-muted-foreground ml-2">
                {topic.length}/{MAX_TOPIC_LENGTH}
              </span>
            </Label>
            <Textarea
              placeholder="e.g., Vectors in 3D space, Quadratic equations, Cellular respiration"
              value={topic}
              onChange={(e) => {
                if (e.target.value.length <= MAX_TOPIC_LENGTH) {
                  setTopic(e.target.value);
                }
              }}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Number of Questions (5-50)</Label>
              <Input
                type="number"
                min={5}
                max={50}
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value) || 10)}
              />
            </div>

            <div className="space-y-2">
              <Label>Total Marks</Label>
              <Input
                type="number"
                min={10}
                max={500}
                value={totalMarks}
                onChange={(e) => setTotalMarks(parseInt(e.target.value) || 100)}
              />
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {isGenerating ? (
              <>
                <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                Generating Assessment with AI Research...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate AI Assessment
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Assessments List */}
      {assessments.length > 0 && (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
            <CardTitle>Your Assessments</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {assessments.map((assessment) => (
                <Card key={assessment.id} className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{assessment.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {assessment.assessment_type} • {assessment.num_questions} questions • {assessment.total_marks} marks
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {assessment.curriculum} • Year {assessment.year_level}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewAssessment(assessment)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyPublicLink(assessment.public_link_code)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Assessment Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedAssessment?.title}</span>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={saveEdit}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyPublicLink(selectedAssessment?.public_link_code)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => deleteAssessment(selectedAssessment?.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={25}
              className="font-mono text-sm"
            />
          ) : (
            <div className="space-y-4">
              <div className="whitespace-pre-wrap font-serif leading-relaxed">
                {renderMathContent(selectedAssessment?.questions || '')}
              </div>

              {responses.length > 0 && (
                <Card className="mt-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                    <CardTitle>Student Responses ({responses.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {responses.map((response) => (
                      <div key={response.id} className="border-b pb-3 mb-3 last:border-0">
                        <p className="font-semibold">
                          {response.student_name || 'Anonymous Student'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Submitted: {new Date(response.submitted_at).toLocaleString()}
                        </p>
                        {response.score && (
                          <p className="text-sm font-medium text-green-600">
                            Score: {response.score}/{selectedAssessment?.total_marks}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssessmentHub;