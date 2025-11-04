import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Target, Sparkles, Download, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CurriculumArchitect: React.FC = () => {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [duration, setDuration] = useState('');
  const [learningGoals, setLearningGoals] = useState('');
  const [generatedCurriculum, setGeneratedCurriculum] = useState<any>(null);
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

    setIsGenerating(true);
    
    // Simulate AI generation - In production, this would call an edge function
    setTimeout(() => {
      setGeneratedCurriculum({
        title: `${subject} Curriculum - Grade ${gradeLevel}`,
        duration: duration,
        units: [
          {
            id: 1,
            title: 'Foundation Building',
            weeks: 4,
            topics: ['Introduction', 'Core Concepts', 'Basic Applications'],
            standards: ['CC.1.A', 'CC.1.B', 'CC.2.A']
          },
          {
            id: 2,
            title: 'Advanced Exploration',
            weeks: 6,
            topics: ['Complex Systems', 'Critical Analysis', 'Real-world Applications'],
            standards: ['CC.3.A', 'CC.3.B', 'CC.4.A']
          },
          {
            id: 3,
            title: 'Mastery & Integration',
            weeks: 4,
            topics: ['Synthesis', 'Project-based Learning', 'Assessment'],
            standards: ['CC.5.A', 'CC.5.B']
          }
        ]
      });
      setIsGenerating(false);
      toast({
        title: 'Curriculum Generated',
        description: 'Your AI-powered curriculum has been created'
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-violet-600" />
            Design Your Curriculum
          </CardTitle>
          <CardDescription>
            Let AI help you create a comprehensive, standards-aligned curriculum
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
            <Label htmlFor="goals">Learning Goals & Standards (Optional)</Label>
            <Textarea
              id="goals"
              placeholder="Describe specific learning goals or standards you want to align with..."
              value={learningGoals}
              onChange={(e) => setLearningGoals(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                Generating Curriculum...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate AI Curriculum
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Curriculum Display */}
      {generatedCurriculum && (
        <Card className="border-violet-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{generatedCurriculum.title}</CardTitle>
                <CardDescription>
                  Duration: {generatedCurriculum.duration} • {generatedCurriculum.units.length} Units
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedCurriculum.units.map((unit: any) => (
              <Card key={unit.id} className="border-violet-100">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Unit {unit.id}: {unit.title}</CardTitle>
                      <CardDescription>{unit.weeks} weeks</CardDescription>
                    </div>
                    <Badge className="bg-violet-100 text-violet-700">
                      <Target className="h-3 w-3 mr-1" />
                      {unit.standards.length} Standards
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Key Topics:</h4>
                    <div className="flex flex-wrap gap-2">
                      {unit.topics.map((topic: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{topic}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Aligned Standards:</h4>
                    <div className="flex flex-wrap gap-2">
                      {unit.standards.map((standard: string, idx: number) => (
                        <Badge key={idx} className="bg-blue-100 text-blue-700">{standard}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CurriculumArchitect;