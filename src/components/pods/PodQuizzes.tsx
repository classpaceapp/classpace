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
import { BookOpen, Plus, Sparkles, Crown, ArrowRight, CheckCircle2, XCircle, FileQuestion } from 'lucide-react';
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
      
      // Graceful error handling
      let errorTitle = "Generation Failed";
      let errorDescription = "Failed to generate quiz. Please try again.";
      
      if (error?.message?.includes('INPUT_TOO_LONG') || error?.message?.includes('too long')) {
        errorTitle = "Input Too Detailed";
        errorDescription = "Please simplify your topic/subtopic. Keep it under 100 words.";
      } else if (error?.message?.includes('RATE_LIMIT') || error?.message?.includes('429')) {
        errorTitle = "Please Wait";
        errorDescription = "Too many requests. Please wait before generating another quiz.";
      }
      
      toast({ 
        title: errorTitle, 
        description: errorDescription,
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
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-2xl">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gradient-to-r from-indigo-200 to-purple-200 dark:from-indigo-800 dark:to-purple-800 rounded-xl"></div>
            <div className="h-32 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 rounded-xl"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-emerald-500/30 shadow-2xl bg-gradient-to-br from-emerald-100/90 via-teal-100/90 to-cyan-100/90 dark:from-emerald-900/40 dark:via-teal-900/40 dark:to-cyan-900/40 backdrop-blur-sm">
      <CardHeader className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 border-b-2 border-emerald-400/50 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border-2 border-white/30">
              <FileQuestion className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">Quizzes</CardTitle>
              <p className="text-sm text-white/80 mt-1">AI-generated with web search</p>
            </div>
          </div>
          {isTeacher && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-2 border-white/30 shadow-lg">
                  <Sparkles className="h-4 w-4 mr-2" />
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
                      placeholder="e.g., IB, AP, A-Level, CBSE, ICSE"
                      value={formData.curriculum}
                      onChange={(e) => setFormData({ ...formData, curriculum: e.target.value })}
                      className="border-indigo-500/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearLevel">Year Level</Label>
                    <Input
                      id="yearLevel"
                      placeholder="e.g., Year 10, Grade 11, Undergraduate"
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
                className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 relative overflow-hidden"
              >
                {generating ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-400 animate-pulse" />
                    <div className="relative flex items-center gap-2">
                      <Sparkles className="h-4 w-4 animate-spin" />
                      <span className="animate-pulse">Generating with AI...</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Quiz
                  </>
                )}
              </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">

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
          <Card className="border-2 border-dashed border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/10 rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-4">
                <BookOpen className="h-10 w-10 text-emerald-500" />
              </div>
              <p className="text-lg font-semibold text-foreground mb-2">No quizzes yet</p>
              <p className="text-sm text-muted-foreground">
                {isTeacher ? 'Click "Generate Quiz" to create one with AI' : 'Your teacher will create quizzes here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          quizzes.map((quiz) => (
            <Card 
              key={quiz.id} 
              className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/10 dark:to-teal-950/10 hover:shadow-lg hover:border-emerald-500/50 transition-all duration-300 cursor-pointer overflow-hidden group rounded-2xl"
              onClick={() => window.open(`/quiz/${quiz.id}`, '_blank')}
            >
              <CardHeader className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold mb-2 group-hover:text-indigo-600 transition-colors">{quiz.title}</CardTitle>
                      <CardDescription className="text-sm space-y-1">
                        {quiz.curriculum && <div className="flex items-center gap-2"><span className="text-indigo-500">📚</span>{quiz.curriculum}</div>}
                        {quiz.subject && <div className="flex items-center gap-2"><span className="text-purple-500">📖</span>{quiz.subject}</div>}
                        {quiz.topic && <div className="flex items-center gap-2"><span className="text-pink-500">📝</span>{quiz.topic}</div>}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 text-xs font-bold rounded-full ${
                      quiz.quiz_type === 'mcq' 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    }`}>
                      {quiz.quiz_type === 'mcq' ? 'MCQ' : 'Essay'}
                    </span>
                    <ArrowRight className="h-6 w-6 text-indigo-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-indigo-600">{quiz.questions.length} questions</span>
                  <span className="text-muted-foreground">Created {new Date(quiz.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </CardContent>
    </Card>
  );
};

export default PodQuizzes;