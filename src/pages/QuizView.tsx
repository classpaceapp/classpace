import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, RotateCcw, CheckCircle2, Award } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MathRenderer } from '@/components/quiz/MathRenderer';

export default function QuizView() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<any>({});
  const [response, setResponse] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      const { data: quizData } = await supabase.from('pod_quizzes').select('*, pods(id)').eq('id', quizId).single();
      const { data: responseData } = await supabase.from('quiz_responses').select('*').eq('quiz_id', quizId).eq('user_id', user?.id).maybeSingle();
      
      setQuiz(quizData);
      setResponse(responseData);
      if (responseData) setAnswers(responseData.answers);
    };
    fetchQuiz();
  }, [quizId, user?.id]);

  const calculateScore = () => {
    if (quiz.quiz_type !== 'mcq') return null;
    let correct = 0;
    quiz.questions.forEach((q: any, idx: number) => {
      if (answers[idx] !== undefined && parseInt(answers[idx]) === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / quiz.questions.length) * 100);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const score = calculateScore();
      const { error } = await supabase.from('quiz_responses').upsert({
        quiz_id: quizId,
        user_id: user!.id,
        answers,
        score,
      });
      if (error) throw error;
      
      setResponse({ quiz_id: quizId, user_id: user!.id, answers, score });
      toast({ 
        title: 'Quiz submitted!',
        description: score !== null ? `Your score: ${score}%` : 'Your answers have been saved'
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToPod = () => {
    if (quiz?.pod_id) {
      navigate(`/pod/${quiz.pod_id}?tab=quizzes`);
    } else {
      navigate(-1);
    }
  };

  if (!quiz) return <div>Loading...</div>;

  return (
    <DashboardLayout userRole="learner">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="outline" onClick={handleBackToPod} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Pod
        </Button>
        
        <Card className="border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              <MathRenderer text={quiz.title} />
            </CardTitle>
            {response?.score !== null && response?.score !== undefined && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border-2 border-green-500/30">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">
                      Your Score: {response.score}%
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      {response.score >= 80 ? 'Excellent work!' : response.score >= 60 ? 'Good job!' : 'Keep practicing!'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {quiz.questions.map((q: any, idx: number) => (
              <Card key={idx} className="border-2 border-indigo-500/20">
                <CardHeader>
                  <CardTitle className="text-lg">Question {idx + 1}</CardTitle>
                  <div className="text-foreground font-medium">
                    <MathRenderer text={q.question} />
                  </div>
                </CardHeader>
                <CardContent>
                  {quiz.quiz_type === 'mcq' ? (
                    <RadioGroup 
                      value={answers[idx]} 
                      onValueChange={(v) => !response && setAnswers({ ...answers, [idx]: v })}
                      disabled={!!response}
                    >
                      {q.options.map((opt: string, optIdx: number) => {
                        const isCorrect = q.correctAnswer === optIdx;
                        const isSelected = answers[idx] === String(optIdx);
                        const showFeedback = response && isSelected;
                        
                        return (
                          <div 
                            key={optIdx} 
                            className={`flex items-center space-x-2 p-2 rounded ${
                              showFeedback 
                                ? isCorrect 
                                  ? 'bg-green-50 dark:bg-green-950/20 border border-green-500/30' 
                                  : 'bg-red-50 dark:bg-red-950/20 border border-red-500/30'
                                : ''
                            }`}
                          >
                            <RadioGroupItem value={String(optIdx)} id={`q${idx}-${optIdx}`} />
                            <Label htmlFor={`q${idx}-${optIdx}`} className="flex-1 cursor-pointer">
                              <MathRenderer text={opt} />
                            </Label>
                            {showFeedback && (
                              isCorrect ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <span className="text-red-600 text-sm font-semibold">Incorrect</span>
                              )
                            )}
                          </div>
                        );
                      })}
                    </RadioGroup>
                  ) : (
                    <Textarea
                      placeholder="Enter your answer..."
                      value={answers[idx] || ''}
                      onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                      rows={6}
                      disabled={!!response}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
            
            <div className="flex gap-4">
              {response ? (
                <Button variant="outline" onClick={() => { setAnswers({}); setResponse(null); }} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Re-attempt Quiz
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting} className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600">
                  <Send className="h-4 w-4" /> {submitting ? 'Submitting...' : 'Submit Quiz'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
