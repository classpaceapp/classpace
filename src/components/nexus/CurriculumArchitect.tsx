import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const MAX_LEARNING_GOALS_LENGTH = 500;

const CurriculumArchitect: React.FC = () => {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [duration, setDuration] = useState('');
  const [learningGoals, setLearningGoals] = useState('');
  const [generatedCurriculum, setGeneratedCurriculum] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
      const { data, error } = await supabase.functions.invoke('nexus-curriculum-generator', {
        body: { subject, gradeLevel, duration, learningGoals }
      });

      if (error) throw error;

      setGeneratedCurriculum(data.curriculum);
      toast({
        title: 'Curriculum Generated',
        description: 'Your comprehensive curriculum plan is ready'
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <BookOpen className="h-6 w-6" />
            </div>
            AI Curriculum Architect
          </CardTitle>
          <CardDescription className="text-violet-100">
            Generate comprehensive, standards-aligned curriculum plans powered by AI research
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                <SelectContent>
                  {['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(grade => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration *</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
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
            className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
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
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold">
              Generated Curriculum Plan
            </CardTitle>
            <CardDescription className="text-emerald-100">
              {subject} • Grade {gradeLevel} • {duration}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {generatedCurriculum}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CurriculumArchitect;