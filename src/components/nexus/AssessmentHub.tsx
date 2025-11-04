import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const MAX_TOPIC_LENGTH = 200;

const AssessmentHub: React.FC = () => {
  const { toast } = useToast();
  const [assessmentType, setAssessmentType] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState('10');
  const [curriculum, setCurriculum] = useState('');
  const [generatedAssessment, setGeneratedAssessment] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!assessmentType || !subject || !gradeLevel || !topic || !numQuestions) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    if (topic.length > MAX_TOPIC_LENGTH) {
      toast({
        title: 'Topic Too Long',
        description: `Please limit topic to ${MAX_TOPIC_LENGTH} characters`,
        variant: 'destructive'
      });
      return;
    }

    const num = parseInt(numQuestions);
    if (isNaN(num) || num < 5 || num > 50) {
      toast({
        title: 'Invalid Number',
        description: 'Please enter between 5 and 50 questions',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedAssessment('');

    try {
      const { data, error } = await supabase.functions.invoke('nexus-assessment-generator', {
        body: { 
          assessmentType, 
          subject, 
          gradeLevel, 
          topic, 
          numQuestions: num,
          curriculum 
        }
      });

      if (error) throw error;

      setGeneratedAssessment(data.assessment);
      toast({
        title: 'Assessment Generated',
        description: 'Your comprehensive assessment is ready'
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
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            AI Assessment Hub
          </CardTitle>
          <CardDescription className="text-blue-100">
            Create comprehensive, curriculum-aligned assessments for any subject
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Assessment Type *</Label>
              <Select value={assessmentType} onValueChange={setAssessmentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="practice">Practice Set</SelectItem>
                  <SelectItem value="formative">Formative Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="e.g., Mathematics, Biology"
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
              <Label htmlFor="numQuestions">Number of Questions * (5-50)</Label>
              <Input
                id="numQuestions"
                type="number"
                min="5"
                max="50"
                value={numQuestions}
                onChange={(e) => setNumQuestions(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">
              Topic/Unit *
              <span className="text-xs text-muted-foreground ml-2">
                {topic.length}/{MAX_TOPIC_LENGTH}
              </span>
            </Label>
            <Input
              id="topic"
              placeholder="e.g., Quadratic Equations, Cell Biology, World War II"
              value={topic}
              onChange={(e) => {
                if (e.target.value.length <= MAX_TOPIC_LENGTH) {
                  setTopic(e.target.value);
                }
              }}
              className={topic.length > MAX_TOPIC_LENGTH * 0.9 ? 'border-amber-500' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="curriculum">Curriculum Standard (Optional)</Label>
            <Input
              id="curriculum"
              placeholder="e.g., Common Core, IB, AP"
              value={curriculum}
              onChange={(e) => setCurriculum(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {isGenerating ? (
              <>
                <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                Generating Comprehensive Assessment...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate AI Assessment
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedAssessment && (
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold">
              Generated {assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)}
            </CardTitle>
            <CardDescription className="text-emerald-100">
              {subject} • Grade {gradeLevel} • {numQuestions} Questions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {generatedAssessment}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssessmentHub;