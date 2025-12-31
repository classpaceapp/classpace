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
import { Sparkles, Copy, ExternalLink, Edit2, Save, Trash2, Eye, ChevronDown, ArrowLeft } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import 'katex/dist/katex.min.css';
import { MathRenderer } from '@/components/quiz/MathRenderer';

const MAX_TOPIC_LENGTH = 200;

const AssessmentHub: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [assessmentType, setAssessmentType] = useState<string>('quiz');
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
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
  const [selectedResponse, setSelectedResponse] = useState<any | null>(null);

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
    if (!assessmentType || !subject || !title || !topic || !curriculum || !yearLevel) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including title",
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
          title,
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
          title: title,
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
        title: "Assessment Generated",
        description: "Your new assessment has been created successfully."
      });

      fetchAssessments();

      // Reset form fields mostly
      setTitle('');
      setTopic('');

    } catch (error: any) {
      console.error('Generation Error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleAssessment = async (assessment: any) => {
    if (expandedAssessment === assessment.id) {
      setExpandedAssessment(null);
      setIsEditing(false);
    } else {
      setExpandedAssessment(assessment.id);
      // Handle both legacy string and new JSON format for editing
      const content = typeof assessment.questions === 'string'
        ? assessment.questions
        : JSON.stringify(assessment.questions, null, 2);

      setEditedContent(content);
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

    let finalContent;
    try {
      // Try to parse as JSON first to keep structure if possible
      finalContent = JSON.parse(editedContent);
    } catch {
      // If parsing fails, store as string (legacy fallback)
      finalContent = editedContent;
    }

    const { error } = await supabase
      .from('nexus_assessments')
      .update({ questions: finalContent })
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

  const renderMathContent = (text: string) => {
    return <MathRenderer text={text} />;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Generator Form */}
      <Card className="border-indigo-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-indigo-900">AI Assessment Generator</CardTitle>
          </div>
          <CardDescription>Create custom assessments aligned with your curriculum</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Assessment Title</Label>
              <Input
                placeholder="e.g. End of Term Calculus Test"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="e.g. Mathematics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Topic / Content</Label>
              <Textarea
                placeholder="Describe the topics to cover..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={MAX_TOPIC_LENGTH}
              />
              <p className="text-xs text-muted-foreground text-right">{topic.length}/{MAX_TOPIC_LENGTH}</p>
            </div>
            <div className="space-y-2">
              <Label>Curriculum</Label>
              <Input
                placeholder="e.g. IB, CBSE, Common Core"
                value={curriculum}
                onChange={(e) => setCurriculum(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Year Level</Label>
              <Input
                placeholder="e.g. Year 10"
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={assessmentType} onValueChange={setAssessmentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="worksheet">Worksheet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Number of Questions</Label>
              <Input
                type="number"
                min={5}
                max={50}
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Marks</Label>
              <Input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(parseInt(e.target.value))}
              />
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Generate Assessment
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Assessments Lists */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Saved Assessments</h2>
        {assessments.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
            No assessments generated yet.
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                {assessments.map((assessment) => (
                  <AccordionItem key={assessment.id} value={assessment.id} className="border-b last:border-0">
                    <AccordionTrigger
                      onClick={() => toggleAssessment(assessment)}
                      className="px-6 py-4 hover:bg-slate-50"
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="font-semibold text-lg">{assessment.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {assessment.subject} • {assessment.year_level} • {new Date(assessment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2 bg-slate-50/50">
                      <div className="flex justify-end gap-2 mb-4">
                        <Button variant="outline" size="sm" onClick={() => {
                          const url = `${window.location.origin}/assessment/${assessment.public_link_code}`;
                          navigator.clipboard.writeText(url);
                          toast({ title: "Copied!", description: "Assessment URL copied to clipboard" });
                        }}>
                          <Copy className="h-4 w-4 mr-2" /> Copy Link
                        </Button>
                        {isEditing && expandedAssessment === assessment.id ? (
                          <Button size="sm" onClick={saveEdit}>
                            <Save className="h-4 w-4 mr-2" /> Save Changes
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit2 className="h-4 w-4 mr-2" /> Edit
                          </Button>
                        )}
                      </div>

                      {/* Content Display/Edit */}
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
                            {/* Handle New JSON Array Format */}
                            {Array.isArray(assessment.questions) ? (
                              <div className="space-y-6">
                                {assessment.questions.map((q: any, idx: number) => (
                                  <div key={idx} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="font-bold text-lg">Question {q.id || idx + 1}</span>
                                      <span className="text-sm px-2 py-1 bg-gray-100 rounded text-gray-600">
                                        {q.marks} marks ({q.type})
                                      </span>
                                    </div>
                                    <div className="mb-4 text-base">
                                      {renderMathContent(q.text)}
                                    </div>
                                    {q.options && q.options.length > 0 && (
                                      <ul className="list-disc pl-5 space-y-1">
                                        {q.options.map((opt: string, optIdx: number) => (
                                          <li key={optIdx} className="text-gray-700">{opt}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              /* Handle Legacy String Format */
                              <div className="whitespace-pre-wrap leading-relaxed">
                                {renderMathContent(assessment.questions || '')}
                              </div>
                            )}
                          </div>

                          {responses[assessment.id] && responses[assessment.id].length > 0 && (
                            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4">
                                <CardTitle className="text-lg">Student Responses ({responses[assessment.id].length})</CardTitle>
                              </CardHeader>
                              <CardContent className="p-4 space-y-3">

                                {selectedResponse && selectedResponse.assessment_id === assessment.id ? (
                                  <div className="space-y-6 animate-fade-in">
                                    <div className="flex items-center justify-between mb-4">
                                      <Button variant="outline" size="sm" onClick={() => setSelectedResponse(null)}>
                                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Students
                                      </Button>
                                      <div className="text-right">
                                        <h3 className="text-xl font-bold text-indigo-900">{selectedResponse.student_name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                          Score: <span className="font-bold text-green-600">{selectedResponse.score}</span> / {assessment.total_marks}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Detailed Exam Paper View */}
                                    {Array.isArray(assessment.questions) ? (
                                      assessment.questions.map((q: any, idx: number) => {
                                        // Find answer
                                        const answerKey = q.id || idx.toString();
                                        const studentAnswer = typeof selectedResponse.answers === 'object' && !selectedResponse.answers.response
                                          ? (selectedResponse.answers[answerKey] || selectedResponse.answers[idx])
                                          : selectedResponse.answers.response || JSON.stringify(selectedResponse.answers);

                                        // Find grading detail for this question
                                        // Typically grading breaks down by question_number (1-based index)
                                        const feedbackItem = selectedResponse.grading_details?.breakdown?.find(
                                          (b: any) => b.question_number === idx + 1
                                        );

                                        return (
                                          <Card key={idx} className="border border-indigo-100 shadow-sm">
                                            <CardContent className="p-6 space-y-4">
                                              {/* Question */}
                                              <div className="pb-3 border-b border-gray-100">
                                                <div className="flex justify-between mb-2">
                                                  <span className="font-bold text-gray-700">Question {idx + 1}</span>
                                                  <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600">{q.marks} Marks Available</span>
                                                </div>
                                                <div className="text-gray-800">{renderMathContent(q.text)}</div>
                                              </div>

                                              {/* Student Answer */}
                                              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Student Answer</p>
                                                <p className="text-sm whitespace-pre-wrap text-slate-700 font-medium">
                                                  {studentAnswer || <span className="text-red-400 italic">No answer provided</span>}
                                                </p>
                                              </div>

                                              {/* AI Feedback */}
                                              {feedbackItem && (
                                                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                                  <div className="flex justify-between items-center mb-2">
                                                    <p className="text-xs font-bold text-indigo-600 uppercase">AI Feedback</p>
                                                    <span className="text-sm font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                                                      {feedbackItem.marks_awarded} / {feedbackItem.marks_available} Marks
                                                    </span>
                                                  </div>
                                                  <p className="text-sm text-indigo-800 leading-relaxed">
                                                    {feedbackItem.feedback}
                                                  </p>
                                                </div>
                                              )}
                                            </CardContent>
                                          </Card>
                                        );
                                      })
                                    ) : (
                                      <div className="p-4 bg-white rounded border">
                                        <h4 className="font-bold text-gray-700 mb-2">Full Response (Legacy Format)</h4>
                                        <p className="whitespace-pre-wrap">{JSON.stringify(selectedResponse.answers, null, 2)}</p>
                                      </div>
                                    )}

                                  </div>
                                ) : (
                                  <div className="grid gap-3">
                                    {responses[assessment.id].map((response) => (
                                      <div key={response.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                        <div className="mb-2 sm:mb-0">
                                          <p className="font-bold text-lg text-gray-800">{response.student_name || 'Anonymous'}</p>
                                          <p className="text-xs text-muted-foreground">
                                            Submitted: {new Date(response.submitted_at).toLocaleString()}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <div className="text-right">
                                            <span className="block font-bold text-green-600 text-lg">
                                              {response.score !== null ? response.score : '-'} / {assessment.total_marks}
                                            </span>
                                            <span className="text-xs text-gray-500 uppercase font-semibold">Score</span>
                                          </div>
                                          <Button
                                            size="sm"
                                            className="bg-indigo-600 hover:bg-indigo-700"
                                            onClick={() => setSelectedResponse(response)}
                                          >
                                            View Paper
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )
                      }
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AssessmentHub;