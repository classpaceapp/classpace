import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const LessonOrchestrator: React.FC = () => {
  const [lessons] = useState([
    {
      id: 1,
      title: 'Introduction to Quadratic Equations',
      date: new Date(2025, 0, 20),
      duration: 45,
      status: 'upcoming',
      objectives: ['Understand quadratic form', 'Identify coefficients', 'Graph basic functions'],
      materials: ['Whiteboard', 'Graphing calculator', 'Worksheets'],
      activities: ['Lecture (15min)', 'Group work (20min)', 'Practice (10min)']
    },
    {
      id: 2,
      title: 'Solving Quadratics by Factoring',
      date: new Date(2025, 0, 22),
      duration: 45,
      status: 'draft',
      objectives: ['Master factoring techniques', 'Apply zero product property'],
      materials: ['Manipulatives', 'Practice problems'],
      activities: ['Review (10min)', 'Demonstration (15min)', 'Practice (20min)']
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lesson Plans</h2>
          <p className="text-muted-foreground">Orchestrate your teaching schedule with AI assistance</p>
        </div>
        <Button className="bg-gradient-to-r from-violet-600 to-purple-600">
          <Plus className="h-4 w-4 mr-2" />
          New Lesson Plan
        </Button>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-violet-600" />
            This Week's Lessons
          </CardTitle>
          <CardDescription>
            Your intelligent lesson schedule with AI recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="border-l-4 border-l-violet-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(lesson.date, 'MMM dd, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {lesson.duration} minutes
                      </span>
                    </div>
                  </div>
                  <Badge 
                    variant={lesson.status === 'upcoming' ? 'default' : 'secondary'}
                    className={lesson.status === 'upcoming' ? 'bg-violet-500' : ''}
                  >
                    {lesson.status === 'upcoming' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {lesson.status === 'draft' && <AlertCircle className="h-3 w-3 mr-1" />}
                    {lesson.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Learning Objectives:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                    {lesson.objectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Materials:</h4>
                    <div className="flex flex-wrap gap-2">
                      {lesson.materials.map((material, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Activities:</h4>
                    <div className="flex flex-wrap gap-2">
                      {lesson.activities.map((activity, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {activity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit Plan
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Duplicate
                  </Button>
                  <Button size="sm" className="flex-1 bg-violet-500 hover:bg-violet-600">
                    Start Lesson
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default LessonOrchestrator;