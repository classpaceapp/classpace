import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, FileText, Loader2 } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { MathRenderer } from '@/components/quiz/MathRenderer';

const PublicAssessment: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');

  // State for structured answers (questionId -> answer)
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // State for legacy string answer
  const [legacyAnswer, setLegacyAnswer] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [grading, setGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<any>(null);

  useEffect(() => {
    if (code) fetchAssessment();
  }, [code]);

  const fetchAssessment = async () => {
    if (!code) return;

    const { data, error } = await supabase
      .from('nexus_assessments')
      .select('*')
      .eq('public_link_code', code)
      .single();

    if (error || !data) {
      toast({
        title: "Assessment Not Found",
        description: "This assessment link is invalid or has been deleted",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    setAssessment(data);
    setLoading(false);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    if (!user && !studentName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to submit",
        variant: "destructive"
      });
      return;
    }

    const isStructured = Array.isArray(assessment?.questions);
    const hasAnswers = isStructured
      ? Object.keys(answers).length > 0
      : legacyAnswer.trim().length > 0;

    if (!hasAnswers) {
      toast({
        title: "Answers Required",
        description: "Please provide your answers before submitting",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    // Prepare payload
    // If structured: save directly as the JSON object
    // If legacy: save as { response: string } to maintain backward compatibility with some views if needed,
    // or just the string? The Teacher View expects { response: ... } or just string?
    // Looking at AssessmentHub.tsx, it handles quite a few formats. 
    // Best to standardize on flexible JSONB. 
    // Let's send the raw answers object for structured, and { response: ... } for legacy.
    const answerPayload = isStructured ? answers : { response: legacyAnswer };

    try {
      const { error } = await supabase
        .from('assessment_responses')
        .insert({
          assessment_id: assessment.id,
          user_id: user?.id || null,
          student_name: studentName.trim() || 'Anonymous',
          answers: answerPayload
        })
        .select()
        .single();

      if (error) throw error;

      // Now get AI grading
      setGrading(true);
      const { data: gradingData, error: gradingError } = await supabase.functions.invoke('grade-assessment', {
        body: {
          questions: assessment.questions,
          answers: answerPayload,
          totalMarks: assessment.total_marks,
          assessmentType: assessment.assessment_type,
          curriculum: assessment.curriculum
        }
      });

      if (gradingError) {
        console.error('Grading error:', gradingError);
        toast({
          title: "Grading Issue",
          description: "Your answers were saved, but AI grading is temporarily unavailable.",
          variant: "default"
        });
      } else {
        setGradingResult(gradingData);
        // Save grading details to database
        if (data?.id) {
          await supabase.from('assessment_responses').update({
            score: gradingData.score,
            grading_details: gradingData
          }).eq('id', data.id);
        }
      }

      setSubmitted(true);
      setGrading(false);

      if (!gradingError) {
        toast({
          title: "Submitted Successfully!",
          description: "Your responses have been recorded and graded"
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your responses. Please try again.",
        variant: "destructive"
      });
      setGrading(false);
    } finally {
      setSubmitting(false);
    }
  };

  const renderMathContent = (text: string) => {
    return <MathRenderer text={text} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading assessment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-2 border-red-200">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Assessment Not Found</h2>
            <p className="text-muted-foreground">This assessment link is invalid or has been deleted</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Result View (Already graded)
  if (submitted && gradingResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4">
        <div className="container mx-auto max-w-4xl py-8">
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 shadow-2xl mb-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 via-emerald-400/10 to-teal-400/10"></div>
            <CardContent className="p-12 text-center relative z-10">
              <CheckCircle2 className="h-20 w-20 text-green-600 mx-auto mb-6 drop-shadow-lg" />
              <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
                Assessment Submitted!
              </h2>
              <p className="text-lg text-muted-foreground mb-2">Your responses have been recorded and graded by AI.</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-400/5 via-purple-400/5 to-fuchsia-400/5"></div>
            <CardHeader className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white relative z-10">
              <CardTitle className="text-3xl flex items-center gap-3">
                <span className="text-5xl">🎯</span>
                Your Results
              </CardTitle>
              <CardDescription className="text-violet-100 text-lg mt-2">
                AI-Generated Assessment Feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6 relative z-10">
              {/* Score Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Total Score</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {gradingResult.score}/{assessment.total_marks}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Percentage</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {gradingResult.percentage}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Grade</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {gradingResult.grade}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Overall Feedback */}
              <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-amber-900 flex items-center gap-2">
                    <span>💬</span> Overall Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {gradingResult.feedback}
                  </p>
                </CardContent>
              </Card>

              {/* Detailed Breakdown */}
              {gradingResult.breakdown && gradingResult.breakdown.length > 0 && (
                <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl text-indigo-900 flex items-center gap-2">
                      <span>📝</span> Detailed Question Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {gradingResult.breakdown.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 bg-white rounded-lg border border-indigo-200 shadow-sm">
                        <div className="mb-2 pb-2 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-600 mb-1">Question {idx + 1}</p>
                          <div className="text-base text-gray-800">
                            {Array.isArray(assessment.questions) && assessment.questions[idx]
                              ? renderMathContent(assessment.questions[idx].text)
                              : "Question Text Unavailable"}
                          </div>
                        </div>
                        <div className="flex items-start justify-between mb-2 mt-3">
                          <h4 className="font-semibold text-indigo-900">AI Feedback</h4>
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                            {item.marks_awarded}/{item.marks_available} Marks
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.feedback}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Strengths & Areas for Improvement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gradingResult.strengths && gradingResult.strengths.length > 0 && (
                  <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg text-green-900 flex items-center gap-2">
                        <span>✅</span> Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2">
                        {gradingResult.strengths.map((strength: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground">{strength}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {gradingResult.improvements && gradingResult.improvements.length > 0 && (
                  <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg text-orange-900 flex items-center gap-2">
                        <span>🎯</span> Areas for Improvement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2">
                        {gradingResult.improvements.map((improvement: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground">{improvement}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Submitted but grading...
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-12 text-center">
            <Loader2 className="animate-spin h-16 w-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">Grading Your Assessment...</h2>
            <p className="text-muted-foreground">Please wait while AI analyzes your responses.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active Assessment Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 py-12">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-block p-4 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 rounded-full mb-4 shadow-2xl">
            <FileText className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-3">
            Assessment Portal
          </h1>
          <p className="text-lg text-muted-foreground">Complete your assessment below</p>
        </div>

        <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 shadow-lg overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-400/5 via-purple-400/5 to-fuchsia-400/5"></div>
          <CardHeader className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-t-lg relative z-10">
            <CardTitle className="text-3xl">{assessment.title}</CardTitle>
            <CardDescription className="text-violet-100 text-lg">
              {assessment.assessment_type} • {assessment.questions && Array.isArray(assessment.questions) ? assessment.questions.length : assessment.num_questions} questions • {assessment.total_marks} marks
            </CardDescription>
            <p className="text-sm text-violet-100 mt-2 flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full">{assessment.curriculum}</span>
              <span className="px-3 py-1 bg-white/20 rounded-full">Year {assessment.year_level}</span>
            </p>
          </CardHeader>
          <CardContent className="p-8 space-y-8 relative z-10">

            {/* Student Name Input */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md">
              <CardContent className="p-6">
                <Label htmlFor="name" className="text-lg font-semibold text-blue-900 mb-3 block">
                  Your Full Name *
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="text-lg p-6 border-2 border-blue-300 focus:border-blue-500"
                />
              </CardContent>
            </Card>

            {/* Questions Section */}
            {Array.isArray(assessment.questions) ? (
              <div className="space-y-6">
                {assessment.questions.map((q: any, idx: number) => (
                  <Card key={idx} className="border-l-4 border-l-indigo-500 shadow-md hover:shadow-lg transition-shadow bg-white">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold text-gray-800">Question {idx + 1}</h3>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                          {q.marks} marks
                        </span>
                      </div>

                      <div className="text-lg text-gray-700 leading-relaxed py-2">
                        {renderMathContent(q.text)}
                      </div>

                      {q.options && q.options.length > 0 && (
                        <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                          {q.options.map((opt: string, optIdx: number) => (
                            <div key={optIdx} className="text-gray-600">{opt}</div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2">
                        <Label className="text-indigo-900 mb-2 block">Your Answer</Label>
                        <Textarea
                          placeholder={`Type your answer for Question ${idx + 1}...`}
                          value={answers[q.id || idx] || ''}
                          onChange={(e) => handleAnswerChange(q.id || idx.toString(), e.target.value)}
                          className="min-h-[120px] text-lg border-indigo-100 focus:border-indigo-400"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* Legacy String Format */
              <Card className="border-2 border-indigo-200 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-indigo-900 flex items-center gap-2">
                    <span>📋</span> Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="whitespace-pre-wrap leading-relaxed text-lg">
                    {renderMathContent(assessment.questions)}
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <Label htmlFor="legacy-answer" className="text-lg font-semibold text-purple-900 mb-3 block">
                      Your Answers *
                    </Label>
                    <Textarea
                      id="legacy-answer"
                      placeholder="Type your answers here. Please number your answers to match the questions."
                      value={legacyAnswer}
                      onChange={(e) => setLegacyAnswer(e.target.value)}
                      rows={15}
                      className="text-lg p-4 border-2 border-purple-300 focus:border-purple-500 leading-relaxed"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={submitting || grading}
              className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white font-bold py-8 text-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-[1.02] rounded-xl"
            >
              {submitting || grading ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="animate-spin h-6 w-6" />
                  {grading ? "Grading Assessment..." : "Submitting..."}
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6" />
                  Submit Assessment & Get AI Grading
                </span>
              )}
            </Button>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicAssessment;