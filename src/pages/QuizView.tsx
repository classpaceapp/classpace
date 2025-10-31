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
import { ArrowLeft, Send, RotateCcw, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

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
      const { data: quizData } = await supabase.from('pod_quizzes').select('*').eq('id', quizId).single();
      const { data: responseData } = await supabase.from('quiz_responses').select('*').eq('quiz_id', quizId).eq('user_id', user?.id).maybeSingle();
      
      setQuiz(quizData);
      setResponse(responseData);
      if (responseData) setAnswers(responseData.answers);
    };
    fetchQuiz();
  }, [quizId, user?.id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('quiz_responses').upsert({
        quiz_id: quizId,
        user_id: user!.id,
        answers,
        score: null,
      });
      if (error) throw error;
      toast({ title: 'Quiz submitted!' });
      navigate(-1);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!quiz) return <div>Loading...</div>;

  return (
    <DashboardLayout userRole="learner">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        
        <Card className="border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {quiz.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {quiz.questions.map((q: any, idx: number) => (
              <Card key={idx} className="border-2 border-indigo-500/20">
                <CardHeader>
                  <CardTitle className="text-lg">Question {idx + 1}</CardTitle>
                  <p className="text-foreground font-medium">{q.question}</p>
                </CardHeader>
                <CardContent>
                  {quiz.quiz_type === 'mcq' ? (
                    <RadioGroup value={answers[idx]} onValueChange={(v) => setAnswers({ ...answers, [idx]: v })}>
                      {q.options.map((opt: string, optIdx: number) => (
                        <div key={optIdx} className="flex items-center space-x-2">
                          <RadioGroupItem value={String(optIdx)} id={`q${idx}-${optIdx}`} />
                          <Label htmlFor={`q${idx}-${optIdx}`}>{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <Textarea
                      placeholder="Enter your answer..."
                      value={answers[idx] || ''}
                      onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                      rows={6}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
            
            <div className="flex gap-4">
              {response && (
                <Button variant="outline" onClick={() => setAnswers({})} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Re-attempt Quiz
                </Button>
              )}
              <Button onClick={handleSubmit} disabled={submitting} className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600">
                <Send className="h-4 w-4" /> {submitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
