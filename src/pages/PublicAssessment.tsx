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
import { CheckCircle2, FileText } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const PublicAssessment: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [answers, setAnswers] = useState('');
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

  const handleSubmit = async () => {
    if (!user && !studentName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to submit",
        variant: "destructive"
      });
      return;
    }

    if (!answers.trim()) {
      toast({
        title: "Answers Required",
        description: "Please provide your answers before submitting",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('assessment_responses')
        .insert({
          assessment_id: assessment.id,
          user_id: user?.id || null,
          student_name: studentName.trim() || 'Anonymous',
          answers: { response: answers }
        });

      if (error) throw error;

      // Now get AI grading
      setGrading(true);
      const { data: gradingData, error: gradingError } = await supabase.functions.invoke('grade-assessment', {
        body: {
          questions: assessment.questions,
          answers: answers,
          totalMarks: assessment.total_marks,
          assessmentType: assessment.assessment_type
        }
      });

      if (gradingError) {
        console.error('Grading error:', gradingError);
      } else {
        setGradingResult(gradingData);
      }

      setSubmitted(true);
      setGrading(false);
      toast({
        title: "Submitted Successfully!",
        description: "Your responses have been recorded and graded"
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your responses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderMathContent = (text: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
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
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-indigo-900">Question {idx + 1}</h4>
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                            {item.marks_awarded}/{item.marks_available}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.feedback}</p>
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-12 text-center">
            <div className="animate-spin h-16 w-16 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-2">Grading Your Assessment...</h2>
            <p className="text-muted-foreground">Please wait while AI analyzes your responses.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 py-12">
      <div className="container mx-auto max-w-4xl">
        {/* Beautiful Header */}
        <div className="mb-8 text-center">
          <div className="inline-block p-4 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 rounded-full mb-4 shadow-2xl">
            <FileText className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-3">
            Assessment Portal
          </h1>
          <p className="text-lg text-muted-foreground">Complete your assessment below</p>
        </div>

        <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-400/5 via-purple-400/5 to-fuchsia-400/5"></div>
          <CardHeader className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-t-lg relative z-10">
            <CardTitle className="text-3xl">{assessment.title}</CardTitle>
            <CardDescription className="text-violet-100 text-lg">
              {assessment.assessment_type} • {assessment.num_questions} questions • {assessment.total_marks} marks
            </CardDescription>
            <p className="text-sm text-violet-100 mt-2 flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full">{assessment.curriculum}</span>
              <span className="px-3 py-1 bg-white/20 rounded-full">Year {assessment.year_level}</span>
            </p>
          </CardHeader>
          <CardContent className="p-8 space-y-6 relative z-10">
            {/* Questions Section */}
            <Card className="border-2 border-indigo-200 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-indigo-900 flex items-center gap-2">
                  <span>📋</span> Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap leading-relaxed text-lg">
                  {renderMathContent(assessment.questions)}
                </div>
              </CardContent>
            </Card>

            {/* Student Name Input */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg">
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

            {/* Answers Section */}
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg">
              <CardContent className="p-6">
                <Label htmlFor="answers" className="text-lg font-semibold text-purple-900 mb-3 block">
                  Your Answers *
                </Label>
                <Textarea
                  id="answers"
                  placeholder="Type your answers here. Please number your answers to match the questions (e.g., 1. Answer one, 2. Answer two...)"
                  value={answers}
                  onChange={(e) => setAnswers(e.target.value)}
                  rows={15}
                  className="text-lg p-4 border-2 border-purple-300 focus:border-purple-500 leading-relaxed"
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || grading}
              className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white font-bold py-8 text-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-[1.02]"
            >
              {submitting || grading ? (
                <span className="flex items-center gap-3">
                  <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></div>
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