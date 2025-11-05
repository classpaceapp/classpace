import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, BookOpen, Copy, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const MAX_LEARNING_GOALS_LENGTH = 500;

const CurriculumArchitect: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [duration, setDuration] = useState('');
  const [learningGoals, setLearningGoals] = useState('');
  const [generatedCurriculum, setGeneratedCurriculum] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedCurriculums, setSavedCurriculums] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) fetchSavedCurriculums();
  }, [user?.id]);

  const fetchSavedCurriculums = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('saved_curriculums')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching curriculums:', error);
      return;
    }

    setSavedCurriculums(data || []);
  };

  const handleGenerate = async () => {
    if (!subject || !gradeLevel || !duration) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    if (learningGoals.length > MAX_LEARNING_GOALS_LENGTH) {
      toast({
        title: 'Learning Goals Too Long',
        description: `Please limit learning goals to ${MAX_LEARNING_GOALS_LENGTH} characters`,
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedCurriculum('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nexus-curriculum-generator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ subject, gradeLevel, duration, learningGoals }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate curriculum');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.content || '';
              if (content) {
                accumulatedContent += content;
                setGeneratedCurriculum(accumulatedContent);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Save to database
      if (accumulatedContent) {
        const { error: insertError } = await supabase
          .from('saved_curriculums')
          .insert({
            teacher_id: user?.id,
            subject,
            grade_level: gradeLevel,
            duration,
            learning_goals: learningGoals || null,
            curriculum_content: accumulatedContent
          });

        if (insertError) {
          console.error('Error saving curriculum:', insertError);
        } else {
          toast({
            title: 'Curriculum Generated!',
            description: 'Your comprehensive curriculum plan has been created and saved'
          });
          fetchSavedCurriculums();
        }
      }

      // Reset form
      setSubject('');
      setGradeLevel('');
      setDuration('');
      setLearningGoals('');

    } catch (error: any) {
      console.error('Generation error:', error);
      
      // Graceful error handling
      let errorTitle = "Generation Failed";
      let errorDescription = "Failed to generate curriculum. Please try again.";
      
      if (error?.message?.includes('INPUT_TOO_LONG') || error?.message?.includes('too long')) {
        errorTitle = "Input Too Detailed";
        errorDescription = "Please simplify your learning goals to under 500 characters.";
      } else if (error?.message?.includes('RATE_LIMIT') || error?.message?.includes('429')) {
        errorTitle = "Please Wait";
        errorDescription = "Too many requests. Please wait a moment before generating another curriculum.";
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteCurriculum = async (id: string) => {
    const { error } = await supabase
      .from('saved_curriculums')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Curriculum Deleted',
      description: 'The curriculum has been removed'
    });

    fetchSavedCurriculums();
  };

  const copyCurriculum = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied!',
      description: 'Curriculum copied to clipboard'
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-600 text-white rounded-t-lg p-8">
          <CardTitle className="flex items-center gap-3 text-3xl">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
              <BookOpen className="h-8 w-8" />
            </div>
            AI Curriculum Architect
          </CardTitle>
          <CardDescription className="text-pink-100 text-base mt-2">
            Generate comprehensive, standards-aligned curriculum plans powered by advanced AI research
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-8 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="e.g., Mathematics, Science"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade Level *</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent side="bottom">
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
                  <SelectItem value="K">Kindergarten</SelectItem>
                  <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                  <SelectItem value="Graduate">Graduate/Master's</SelectItem>
                  <SelectItem value="PhD">PhD/Doctorate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration *</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  <SelectItem value="semester">One Semester</SelectItem>
                  <SelectItem value="year">Full Year</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">
              Learning Goals & Standards (Optional)
              <span className="text-xs text-muted-foreground ml-2">
                {learningGoals.length}/{MAX_LEARNING_GOALS_LENGTH}
              </span>
            </Label>
            <Textarea
              id="goals"
              placeholder="Describe specific learning goals or standards you want to align with..."
              value={learningGoals}
              onChange={(e) => {
                if (e.target.value.length <= MAX_LEARNING_GOALS_LENGTH) {
                  setLearningGoals(e.target.value);
                }
              }}
              rows={4}
              className={learningGoals.length > MAX_LEARNING_GOALS_LENGTH * 0.9 ? 'border-amber-500' : ''}
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-600 hover:from-pink-600 hover:via-rose-600 hover:to-fuchsia-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {isGenerating ? (
              <>
                <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                Generating Comprehensive Curriculum...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate AI-Powered Curriculum
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedCurriculum && (
        <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white rounded-t-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold mb-2">
                  Generated Curriculum Plan
                </CardTitle>
                <CardDescription className="text-cyan-100 text-base">
                  {subject} • Grade {gradeLevel} • {duration}
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCurriculum);
                  toast({ title: "Copied!", description: "Curriculum copied to clipboard" });
                }}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="prose prose-lg max-w-none bg-white rounded-xl p-8 shadow-inner">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {generatedCurriculum}
                {isGenerating && (
                  <span className="inline-block w-2 h-5 bg-pink-500 animate-pulse ml-1" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Curriculums */}
      {savedCurriculums.length > 0 && (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg p-6">
            <CardTitle className="text-2xl">Your Saved Curriculums</CardTitle>
            <CardDescription className="text-purple-100">
              {savedCurriculums.length} curriculum{savedCurriculums.length !== 1 ? 's' : ''} saved
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="space-y-4">
              {savedCurriculums.map((curriculum) => (
                <AccordionItem 
                  key={curriculum.id} 
                  value={curriculum.id}
                  className="border-2 border-purple-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="text-left">
                        <h3 className="font-bold text-lg">
                          {curriculum.subject} Curriculum
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Grade {curriculum.grade_level} • {curriculum.duration}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {new Date(curriculum.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="flex gap-2 mb-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyCurriculum(curriculum.curriculum_content)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteCurriculum(curriculum.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                    <div className="prose prose-sm max-w-none bg-slate-50 rounded-lg p-6">
                      <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                        {curriculum.curriculum_content}
                      </div>
                    </div>
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

export default CurriculumArchitect;