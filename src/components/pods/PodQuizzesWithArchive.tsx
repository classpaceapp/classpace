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
import { BookOpen, Plus, Sparkles, Crown, ArrowRight, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MathRenderer } from '@/components/quiz/MathRenderer';

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
  archived: boolean;
}

export const PodQuizzesWithArchive: React.FC<{ podId: string; isTeacher: boolean }> = ({ podId, isTeacher }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [quizLimitReached, setQuizLimitReached] = useState(false);
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
        .eq('archived', showArchived)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes((data || []).map(q => ({ ...q, questions: q.questions as any[] })));
    } catch (error: any) {
      toast({ title: 'Failed to load quizzes', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleArchive = async (quizId: string, currentArchived: boolean) => {
    try {
      const { error } = await supabase
        .from('pod_quizzes')
        .update({ archived: !currentArchived })
        .eq('id', quizId);

      if (error) throw error;
      toast({ 
        title: currentArchived ? 'Quiz restored' : 'Quiz archived',
        description: currentArchived ? 'Quiz moved to active quizzes' : 'Quiz moved to archive'
      });
      fetchQuizzes();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const generateQuiz = async () => {
    if (!formData.title) {
      toast({ title: 'Please enter a quiz title', variant: 'destructive' });
      return;
    }

    try {
      setGenerating(true);
      
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

      // Check for specific error responses in data
      if (data?.error === 'quiz_limit_reached' || data?.error === 'rate_limited' || data?.error === 'payment_required') {
        setShowGenerateForm(false);
        setQuizLimitReached(true);
        return;
      }

      if (error || !data?.questions) {
        throw new Error(data?.message || error?.message || 'Failed to generate quiz');
      }

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
          archived: false,
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
      setShowGenerateForm(false);
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
  }, [podId, showArchived]);

  const displayQuizzes = quizzes.filter(q => q.archived === showArchived);

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
            {showArchived ? 'Archived Quizzes' : 'AI-Generated Quizzes'}
          </h2>
          <p className="text-muted-foreground">
            {showArchived ? 'View your archived quizzes' : 'Create quizzes using AI with web search for authentic exam questions'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowArchived(!showArchived)}
            className="gap-2"
          >
            <Archive className="h-4 w-4" />
            {showArchived ? 'View Active' : 'View Archived'}
          </Button>
          {!showArchived && (
            <Button 
              onClick={() => {
                setShowGenerateForm(!showGenerateForm);
                setQuizLimitReached(false);
              }}
              className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              <Sparkles className="h-4 w-4" />
              {showGenerateForm ? 'Hide Form' : 'Generate Quiz'}
            </Button>
          )}
        </div>
      </div>

      {/* Quiz Limit Reached - Beautiful Inline Message */}
      {quizLimitReached && (
        <Card className="border-2 border-amber-500/50 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/20 dark:to-orange-950/20 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(251,191,36,0.1),transparent_50%)]" />
          <CardContent className="relative py-8">
            <div className="flex flex-col items-center text-center space-y-4 max-w-md mx-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 blur-xl opacity-50" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <Crown className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Quiz Limit Reached
                </h3>
                <p className="text-muted-foreground">
                  You've reached the limit of <span className="font-semibold text-amber-600">2 quizzes</span> (including archived quizzes) on the free plan
                </p>
              </div>
              <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm rounded-2xl p-6 space-y-3 w-full">
                <p className="text-sm text-muted-foreground">
                  Upgrade to <span className="font-bold text-amber-600">Teach+</span> to unlock:
                </p>
                <ul className="text-sm space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600" />
                    <span>Unlimited AI-generated quizzes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600" />
                    <span>Advanced quiz analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600" />
                    <span>Priority AI generation</span>
                  </li>
                </ul>
              </div>
              <div className="flex gap-3 w-full">
                <Button 
                  variant="outline" 
                  onClick={() => setQuizLimitReached(false)}
                  className="flex-1"
                >
                  Maybe Later
                </Button>
                <Button 
                  onClick={() => navigate('/my-plan')}
                  className="flex-1 gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inline Quiz Generation Form */}
      {!showArchived && showGenerateForm && !quizLimitReached && (
        <Card className="border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 dark:from-indigo-950/20 dark:to-purple-950/20 overflow-hidden relative z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.1),transparent_50%)]" />
          <CardHeader className="relative border-b border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
            <CardTitle className="text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-600" />
              Generate AI Quiz with Web Search
            </CardTitle>
            <CardDescription>
              Our AI will search the web for authentic past papers and examination questions tailored to your specifications
            </CardDescription>
          </CardHeader>
          <CardContent className="relative pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Trigonometry Practice Quiz"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="border-indigo-500/30 bg-white/50"
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
                  className="border-indigo-500/30 bg-white/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearLevel">Year Level</Label>
                <Input
                  id="yearLevel"
                  placeholder="e.g., Year 12, Grade 11"
                  value={formData.yearLevel}
                  onChange={(e) => setFormData({ ...formData, yearLevel: e.target.value })}
                  className="border-indigo-500/30 bg-white/50"
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
                className="border-indigo-500/30 bg-white/50"
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
                  className="border-indigo-500/30 bg-white/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtopic">Subtopic</Label>
                <Input
                  id="subtopic"
                  placeholder="e.g., Trig Identities"
                  value={formData.subtopic}
                  onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
                  className="border-indigo-500/30 bg-white/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Quiz Type</Label>
              <Select value={formData.quizType} onValueChange={(value: 'mcq' | 'essay') => setFormData({ ...formData, quizType: value })}>
                <SelectTrigger className="border-indigo-500/30 bg-white/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                  <SelectItem value="essay">Essay Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowGenerateForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={generateQuiz}
                disabled={generating}
                className="flex-1 gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 relative overflow-hidden shadow-lg"
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
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {displayQuizzes.length === 0 ? (
          <Card className="border-2 border-dashed border-indigo-500/30 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/10 dark:to-purple-950/10">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Archive className="h-12 w-12 text-indigo-500 mb-4" />
              <p className="text-muted-foreground">
                {showArchived ? 'No archived quizzes' : 'No active quizzes'}
              </p>
            </CardContent>
          </Card>
        ) : (
          displayQuizzes.map((quiz) => (
            <Card 
              key={quiz.id} 
              className="border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/10 dark:to-purple-950/10 hover:shadow-lg transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => window.open(`/quiz/${quiz.id}`, '_blank')}
                  >
                    <div className="p-2 rounded-lg bg-indigo-500">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        <MathRenderer text={quiz.title} />
                      </CardTitle>
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
                    {isTeacher && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleArchive(quiz.id, quiz.archived)}
                        className="gap-2"
                      >
                        {quiz.archived ? (
                          <><ArchiveRestore className="h-4 w-4" /> Restore</>
                        ) : (
                          <><Archive className="h-4 w-4" /> Archive</>
                        )}
                      </Button>
                    )}
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

export default PodQuizzesWithArchive;

