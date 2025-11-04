import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Plus, FileText, BarChart, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AssessmentHub: React.FC = () => {
  const assessments = [
    {
      id: 1,
      title: 'Quadratic Equations Quiz',
      type: 'Quiz',
      class: 'Math 101',
      questions: 15,
      avgScore: 88,
      completed: 28,
      total: 32,
      status: 'active'
    },
    {
      id: 2,
      title: 'Midterm Exam',
      type: 'Exam',
      class: 'Math 102',
      questions: 40,
      avgScore: null,
      completed: 0,
      total: 28,
      status: 'scheduled'
    },
    {
      id: 3,
      title: 'Functions Unit Test',
      type: 'Test',
      class: 'Math 201',
      questions: 25,
      avgScore: 91,
      completed: 25,
      total: 25,
      status: 'graded'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assessment Hub</h2>
          <p className="text-muted-foreground">Create, manage, and analyze assessments with AI assistance</p>
        </div>
        <Button className="bg-gradient-to-r from-violet-600 to-purple-600">
          <Plus className="h-4 w-4 mr-2" />
          Create Assessment
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-violet-200 cursor-pointer hover:border-violet-400 transition-colors">
          <CardHeader>
            <Sparkles className="h-8 w-8 text-violet-600 mb-2" />
            <CardTitle className="text-lg">AI Question Generator</CardTitle>
            <CardDescription>
              Generate questions aligned with learning objectives
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-blue-200 cursor-pointer hover:border-blue-400 transition-colors">
          <CardHeader>
            <FileText className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle className="text-lg">Quick Quiz Builder</CardTitle>
            <CardDescription>
              Create a quiz in minutes with templates
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-green-200 cursor-pointer hover:border-green-400 transition-colors">
          <CardHeader>
            <BarChart className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle className="text-lg">Auto-Grade</CardTitle>
            <CardDescription>
              Upload and grade assessments automatically
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Assessments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-violet-600" />
            Active Assessments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="border-l-4 border-l-violet-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{assessment.title}</CardTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant="outline">{assessment.type}</Badge>
                      <span>{assessment.class}</span>
                      <span>{assessment.questions} questions</span>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      assessment.status === 'graded' ? 'default' : 
                      assessment.status === 'active' ? 'secondary' : 
                      'outline'
                    }
                    className={
                      assessment.status === 'graded' ? 'bg-green-500' : 
                      assessment.status === 'active' ? 'bg-blue-500' : 
                      ''
                    }
                  >
                    {assessment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Completion</p>
                    <p className="text-lg font-semibold">
                      {assessment.completed}/{assessment.total}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Average Score</p>
                    <p className="text-lg font-semibold">
                      {assessment.avgScore ? `${assessment.avgScore}%` : '-'}
                    </p>
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    {assessment.status === 'active' && (
                      <Button size="sm" className="flex-1 bg-violet-500 hover:bg-violet-600">
                        Grade Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentHub;