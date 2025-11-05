import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Sparkles, Copy, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const MAX_TOPIC_LENGTH = 200;

const LessonOrchestrator: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [subject, setSubject] = useState('');
  const [curriculum, setCurriculum] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [duration, setDuration] = useState('');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lessonContent, setLessonContent] = useState('');
  const [savedLessons, setSavedLessons] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) fetchSavedLessons();
  }, [user?.id]);

  const fetchSavedLessons = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('saved_lessons')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lessons:', error);
      return;
    }

    setSavedLessons(data || []);
  };

  const handleGenerate = async () => {
    if (!subject || !curriculum || !gradeLevel || !duration) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    if (topic && topic.length > MAX_TOPIC_LENGTH) {
      toast({
        title: 'Topic Too Long',
        description: `Topic must be ${MAX_TOPIC_LENGTH} characters or less`,
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    setLessonContent('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nexus-lesson-generator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ subject, curriculum, gradeLevel, duration, topic }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate lesson plan');
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
                setLessonContent(accumulatedContent);
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
          .from('saved_lessons')
          .insert({
            teacher_id: user?.id,
            subject,
            curriculum,
            grade_level: gradeLevel,
            duration,
            topic: topic || null,
            lesson_content: accumulatedContent
          });

        if (insertError) {
          console.error('Error saving lesson:', insertError);
        } else {
          toast({
            title: 'Lesson Plan Generated!',
            description: 'Your comprehensive lesson plan has been created and saved'
          });
          fetchSavedLessons();
        }
      }

      // Reset form
      setSubject('');
      setCurriculum('');
      setGradeLevel('');
      setDuration('');
      setTopic('');

    } catch (error) {
      console.error('Generation error:', error);
      
      // Graceful error handling
      let errorTitle = "Generation Failed";
      let errorDescription = "Failed to generate lesson plan. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('INPUT_TOO_LONG') || error.message.includes('too long')) {
          errorTitle = "Topic Too Detailed";
          errorDescription = "Please simplify your topic to under 200 characters.";
        } else if (error.message.includes('RATE_LIMIT') || error.message.includes('429')) {
          errorTitle = "Please Wait";
          errorDescription = "Too many requests. Please wait before generating another lesson.";
        }
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

  const deleteLesson = async (id: string) => {
    const { error } = await supabase
      .from('saved_lessons')
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
      title: 'Lesson Deleted',
      description: 'The lesson plan has been removed'
    });

    fetchSavedLessons();
  };

  const copyLesson = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied!',
      description: 'Lesson plan copied to clipboard'
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-600 text-white rounded-t-lg p-8">
          <CardTitle className="flex items-center gap-3 text-3xl">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
              <Calendar className="h-8 w-8" />
            </div>
            AI Lesson Orchestrator
          </CardTitle>
          <CardDescription className="text-indigo-100 text-base mt-2">
            Generate comprehensive, research-backed lesson plans with exact teaching scripts and resources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-8 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Label htmlFor="curriculum">Curriculum *</Label>
              <Select value={curriculum} onValueChange={setCurriculum}>
                <SelectTrigger>
                  <SelectValue placeholder="Select curriculum" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  <SelectItem value="IB">International Baccalaureate (IB)</SelectItem>
                  <SelectItem value="IGCSE">IGCSE</SelectItem>
                  <SelectItem value="CBSE">CBSE</SelectItem>
                  <SelectItem value="ICSE">ICSE</SelectItem>
                  <SelectItem value="A-Level">A-Level</SelectItem>
                  <SelectItem value="AP">Advanced Placement (AP)</SelectItem>
                  <SelectItem value="Common Core">Common Core</SelectItem>
                  <SelectItem value="Australian">Australian Curriculum</SelectItem>
                  <SelectItem value="UK National">UK National Curriculum</SelectItem>
                  <SelectItem value="Higher Education">Higher Education</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade Level *</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  <SelectItem value="K">Kindergarten</SelectItem>
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
            <div className="space-y-2">
              <Label htmlFor="duration">Lesson Duration *</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  <SelectItem value="30 minutes">30 minutes</SelectItem>
                  <SelectItem value="45 minutes">45 minutes</SelectItem>
                  <SelectItem value="60 minutes">60 minutes</SelectItem>
                  <SelectItem value="90 minutes">90 minutes</SelectItem>
                  <SelectItem value="2 hours">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">
              Specific Topic (Optional)
              <span className="text-xs text-muted-foreground ml-2">
                {topic.length}/{MAX_TOPIC_LENGTH}
              </span>
            </Label>
            <Textarea
              id="topic"
              placeholder="e.g., Introduction to Algebra, Photosynthesis, The French Revolution"
              value={topic}
              onChange={(e) => {
                if (e.target.value.length <= MAX_TOPIC_LENGTH) {
                  setTopic(e.target.value);
                }
              }}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-600 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {isGenerating ? (
              <>
                <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                Generating Comprehensive Lesson Plan...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate AI Lesson Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Live Generated Lesson */}
      {lessonContent && (
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white rounded-t-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold mb-2">
                  Generated Lesson Plan
                </CardTitle>
                <CardDescription className="text-emerald-100 text-base">
                  {subject} • {curriculum} • Grade {gradeLevel} • {duration}
                </CardDescription>
              </div>
              <Button
                onClick={() => copyLesson(lessonContent)}
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
                {lessonContent}
                {isGenerating && (
                  <span className="inline-block w-2 h-5 bg-indigo-500 animate-pulse ml-1" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Lessons */}
      {savedLessons.length > 0 && (
        <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-t-lg p-6">
            <CardTitle className="text-2xl">Your Saved Lesson Plans</CardTitle>
            <CardDescription className="text-violet-100">
              {savedLessons.length} lesson plan{savedLessons.length !== 1 ? 's' : ''} saved
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="space-y-4">
              {savedLessons.map((lesson, index) => (
                <AccordionItem 
                  key={lesson.id} 
                  value={lesson.id}
                  className="border-2 border-violet-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="text-left">
                        <h3 className="font-bold text-lg">
                          {lesson.topic || `${lesson.subject} Lesson Plan`}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {lesson.subject} • {lesson.curriculum} • Grade {lesson.grade_level} • {lesson.duration}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {new Date(lesson.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="flex gap-2 mb-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyLesson(lesson.lesson_content)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteLesson(lesson.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                    <div className="prose prose-sm max-w-none bg-slate-50 rounded-lg p-6">
                      <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                        {lesson.lesson_content}
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

export default LessonOrchestrator;
