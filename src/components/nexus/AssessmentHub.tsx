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
import { Sparkles, Copy, ExternalLink, Edit2, Save, Trash2, Eye, ChevronDown } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [responses, setResponses] = useState<Record<string, any[]>>({});

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

    } catch (error: any) {
      console.error('Generation error:', error);
      
      // Graceful error handling with helpful messages
      let errorTitle = "Generation Failed";
      let errorDescription = "Failed to generate assessment. Please try again.";
      
      if (error?.message?.includes('INPUT_TOO_LONG') || error?.error === 'INPUT_TOO_LONG') {
        errorTitle = "Topic Too Detailed";
        errorDescription = "Please simplify your topic to under 100 words. Keep it focused and concise.";
      } else if (error?.message?.includes('RATE_LIMIT') || error?.error === 'RATE_LIMIT') {
        errorTitle = "Please Wait";
        errorDescription = "Too many requests. Please wait a moment before generating another assessment.";
      } else if (error?.details) {
        errorDescription = error.details;
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
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

  const toggleAssessment = async (assessment: any) => {
    if (expandedAssessment === assessment.id) {
      setExpandedAssessment(null);
      setIsEditing(false);
    } else {
      setExpandedAssessment(assessment.id);
      setEditedContent(assessment.questions);
      setIsEditing(false);
      
      // Fetch responses if not already fetched
      if (!responses[assessment.id]) {
        const { data, error } = await supabase
          .from('assessment_responses')
          .select('*')
          .eq('assessment_id', assessment.id)
          .order('submitted_at', { ascending: false });

        if (!error) {
          setResponses(prev => ({ ...prev, [assessment.id]: data || [] }));
        }
      }
    }
  };

  const saveEdit = async () => {
    if (!expandedAssessment) return;

    const { error } = await supabase
      .from('nexus_assessments')
      .update({ questions: editedContent })
      .eq('id', expandedAssessment);

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
    setExpandedAssessment(null);
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
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white rounded-t-lg p-8">
          <CardTitle className="flex items-center gap-3 text-3xl">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
              <Sparkles className="h-8 w-8" />
            </div>
            AI-Powered Assessment Generator
          </CardTitle>
          <CardDescription className="text-amber-100 text-base mt-2">
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
                  <SelectItem value="CBSE">CBSE</SelectItem>
                  <SelectItem value="ICSE">ICSE</SelectItem>
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
                  <SelectItem value="1">Year 1 (Primary)</SelectItem>
                  <SelectItem value="2">Year 2 (Primary)</SelectItem>
                  <SelectItem value="3">Year 3 (Primary)</SelectItem>
                  <SelectItem value="4">Year 4 (Primary)</SelectItem>
                  <SelectItem value="5">Year 5 (Primary)</SelectItem>
                  <SelectItem value="6">Year 6</SelectItem>
                  <SelectItem value="7">Year 7</SelectItem>
                  <SelectItem value="8">Year 8</SelectItem>
                  <SelectItem value="9">Year 9</SelectItem>
                  <SelectItem value="10">Year 10</SelectItem>
                  <SelectItem value="11">Year 11</SelectItem>
                  <SelectItem value="12">Year 12</SelectItem>
                  <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                  <SelectItem value="Graduate">Graduate/Master's</SelectItem>
                  <SelectItem value="PhD">PhD/Doctorate</SelectItem>
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
            className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-600 hover:via-orange-600 hover:to-red-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
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
        <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-t-lg p-6">
            <CardTitle className="text-2xl">Your Assessments</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="space-y-4" value={expandedAssessment || undefined} onValueChange={(value) => {
              const assessment = assessments.find(a => a.id === value);
              if (assessment) toggleAssessment(assessment);
            }}>
              {assessments.map((assessment) => (
                <AccordionItem 
                  key={assessment.id} 
                  value={assessment.id}
                  className="border-2 border-purple-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="text-left">
                        <h3 className="font-bold text-lg">{assessment.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {assessment.assessment_type} • {assessment.num_questions} questions • {assessment.total_marks} marks
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {assessment.curriculum} • Year {assessment.year_level}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="flex gap-2 mb-4">
                      {isEditing && expandedAssessment === assessment.id ? (
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
                            onClick={() => copyPublicLink(assessment.public_link_code)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteAssessment(assessment.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {isEditing && expandedAssessment === assessment.id ? (
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={25}
                        className="font-mono text-sm"
                      />
                    ) : (
                      <div className="space-y-4">
                        <div className="prose prose-sm max-w-none bg-slate-50 rounded-lg p-6">
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {renderMathContent(assessment.questions || '')}
                          </div>
                        </div>

                        {responses[assessment.id] && responses[assessment.id].length > 0 && (
                          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4">
                              <CardTitle className="text-lg">Student Responses ({responses[assessment.id].length})</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                              {responses[assessment.id].map((response) => (
                                <Card key={response.id} className="border-indigo-200 bg-white shadow-sm">
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <div>
                                        <p className="font-semibold text-lg">{response.student_name || 'Anonymous'}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Submitted: {new Date(response.submitted_at).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                      <p className="text-sm font-semibold text-slate-700 mb-2">Student's Answer:</p>
                                      <p className="text-sm whitespace-pre-wrap text-slate-600">
                                        {response.answers?.response || 'No response provided'}
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssessmentHub;