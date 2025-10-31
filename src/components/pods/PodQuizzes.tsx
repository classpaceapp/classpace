import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, Plus, Sparkles, Crown, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Quiz {
  id: string;
  pod_id: string;
  created_by: string;
  title: string;
  curriculum: string | null;
  year_level: string | null;
  subject: string | null;
  topic: string | null;
  subtopic: string | null;
  quiz_type: string;
  questions: any[];
  created_at: string;
}

export const PodQuizzes: React.FC<{ podId: string; isTeacher: boolean }> = ({ podId, isTeacher }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    curriculum: '',
    yearLevel: '',
    subject: '',
    topic: '',
    subtopic: '',
    quizType: 'mcq' as 'mcq' | 'essay',
  });

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pod_quizzes')
        .select('*')
        .eq('pod_id', podId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes((data || []).map(q => ({ ...q, questions: q.questions as any[] })));
    } catch (error: any) {
      toast({ title: 'Failed to load quizzes', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    if (!formData.title) {
      toast({ title: 'Please enter a quiz title', variant: 'destructive' });
      return;
    }

    try {
      setGenerating(true);
      
      // Call edge function to generate quiz with web search
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          curriculum: formData.curriculum,
          yearLevel: formData.yearLevel,
          subject: formData.subject,
          topic: formData.topic,
          subtopic: formData.subtopic,
          quizType: formData.quizType,
          podId,
        },
      });

      if (error) {
        if (error.message.includes('quiz_limit_reached')) {
          setDialogOpen(false);
          setUpgradeDialogOpen(true);
          return;
        }
        throw error;
      }

      // Save quiz to database
      const { error: insertError } = await supabase
        .from('pod_quizzes')
        .insert({
          pod_id: podId,
          created_by: user!.id,
          title: formData.title,
          curriculum: formData.curriculum || null,
          year_level: formData.yearLevel || null,
          subject: formData.subject || null,
          topic: formData.topic || null,
          subtopic: formData.subtopic || null,
          quiz_type: formData.quizType,
          questions: data.questions,
        });

      if (insertError) throw insertError;

      toast({ 
        title: 'Quiz generated successfully!', 
        description: `Created ${data.questions.length} questions using AI and web search` 
      });
      
      setFormData({
        title: '',
        curriculum: '',
        yearLevel: '',
        subject: '',
        topic: '',
        subtopic: '',
        quizType: 'mcq',
      });
      setDialogOpen(false);
      fetchQuizzes();
    } catch (error: any) {
      console.error('Quiz generation error:', error);
      toast({ 
        title: 'Failed to generate quiz', 
        description: error.message || 'Please try again',
        variant: 'destructive' 
      });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [podId]);

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-32 bg-muted rounded-lg"></div>
      <div className="h-32 bg-muted rounded-lg"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AI-Generated Quizzes
          </h2>
          <p className="text-muted-foreground">Create quizzes using AI with web search for authentic exam questions</p>
        </div>
        {isTeacher && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                <Sparkles className="h-4 w-4" />
                Generate Quiz
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-2 border-indigo-500/30 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-indigo-600" />
                  Generate AI Quiz with Web Search
                </DialogTitle>
                <DialogDescription>
                  Our AI will search the web for authentic past papers and examination questions tailored to your specifications
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Trigonometry Practice Quiz"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="border-indigo-500/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="curriculum">Curriculum</Label>
                    <Input
                      id="curriculum"
                      placeholder="e.g., IB, AP, A-Level"
                      value={formData.curriculum}
                      onChange={(e) => setFormData({ ...formData, curriculum: e.target.value })}
                      className="border-indigo-500/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearLevel">Year Level</Label>
                    <Input
                      id="yearLevel"
                      placeholder="e.g., Year 12, Grade 11"
                      value={formData.yearLevel}
                      onChange={(e) => setFormData({ ...formData, yearLevel: e.target.value })}
                      className="border-indigo-500/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Mathematics HL, Physics"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="border-indigo-500/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Input
                      id="topic"
                      placeholder="e.g., Trigonometry"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="border-indigo-500/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtopic">Subtopic</Label>
                    <Input
                      id="subtopic"
                      placeholder="e.g., Trig Identities"
                      value={formData.subtopic}
                      onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
                      className="border-indigo-500/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Quiz Type</Label>
                  <Select value={formData.quizType} onValueChange={(value: 'mcq' | 'essay') => setFormData({ ...formData, quizType: value })}>
                    <SelectTrigger className="border-indigo-500/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                      <SelectItem value="essay">Essay Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={generateQuiz} 
                  disabled={generating}
                  className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  <Sparkles className="h-4 w-4" />
                  {generating ? 'Generating with AI...' : 'Generate Quiz'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-amber-500/50">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
              <Crown className="h-6 w-6 text-amber-500" />
              Upgrade to Teach+
            </DialogTitle>
            <DialogDescription>
              You've reached the limit of 2 quizzes on the free plan
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <p className="text-center text-muted-foreground">
              Upgrade to <span className="font-bold text-amber-600">Teach+</span> to create unlimited AI-generated quizzes!
            </p>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-amber-500/30">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Unlimited AI Quizzes</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Unlimited Pods</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Priority Support</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
              Maybe Later
            </Button>
            <Button 
              onClick={() => navigate('/pricing')}
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              <Crown className="h-4 w-4" />
              Upgrade Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {quizzes.length === 0 ? (
          <Card className="border-2 border-dashed border-indigo-500/30 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/10 dark:to-purple-950/10">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-indigo-500 mb-4" />
              <p className="text-muted-foreground">No quizzes yet</p>
              <p className="text-sm text-muted-foreground">
                {isTeacher ? 'Click "Generate Quiz" to create one with AI' : 'Your teacher will create quizzes here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          quizzes.map((quiz) => (
            <Card 
              key={quiz.id} 
              className="border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/10 dark:to-purple-950/10 hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/quiz/${quiz.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-indigo-500">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <CardDescription className="text-sm space-y-1 mt-2">
                        {quiz.curriculum && <div>📚 {quiz.curriculum}</div>}
                        {quiz.subject && <div>📖 {quiz.subject}</div>}
                        {quiz.topic && <div>📝 {quiz.topic}</div>}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      quiz.quiz_type === 'mcq' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    }`}>
                      {quiz.quiz_type === 'mcq' ? 'MCQ' : 'Essay'}
                    </span>
                    <ArrowRight className="h-5 w-5 text-indigo-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{quiz.questions.length} questions</span>
                  <span>Created {new Date(quiz.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};