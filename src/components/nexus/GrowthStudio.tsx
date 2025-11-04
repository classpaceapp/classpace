import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Award, BookOpen, Target, CheckCircle2, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const GrowthStudio: React.FC = () => {
  const goals = [
    {
      id: 1,
      title: 'Master Differentiated Instruction',
      category: 'Teaching Strategy',
      progress: 65,
      status: 'in-progress',
      activities: 12,
      completed: 8
    },
    {
      id: 2,
      title: 'Advanced Assessment Techniques',
      category: 'Assessment',
      progress: 40,
      status: 'in-progress',
      activities: 10,
      completed: 4
    },
    {
      id: 3,
      title: 'Technology Integration',
      category: 'EdTech',
      progress: 85,
      status: 'almost-complete',
      activities: 8,
      completed: 7
    }
  ];

  const courses = [
    {
      title: 'AI in Education',
      duration: '4 weeks',
      level: 'Intermediate',
      rating: 4.8
    },
    {
      title: 'Data-Driven Teaching',
      duration: '3 weeks',
      level: 'Advanced',
      rating: 4.9
    },
    {
      title: 'Student Engagement Strategies',
      duration: '2 weeks',
      level: 'Beginner',
      rating: 4.7
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Goals
            </CardTitle>
            <Target className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">Professional development goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Courses Completed
            </CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">This year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Learning Streak
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28 days</div>
            <p className="text-xs text-muted-foreground mt-1">Keep it up!</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Goals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-violet-600" />
                Your Growth Goals
              </CardTitle>
              <CardDescription>
                Track your professional development journey
              </CardDescription>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-purple-600">
              <Target className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.map((goal) => (
            <Card key={goal.id} className="border-l-4 border-l-violet-500">
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {goal.completed} of {goal.activities} activities completed
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={goal.status === 'almost-complete' ? 'default' : 'secondary'}
                    className={goal.status === 'almost-complete' ? 'bg-green-500' : 'bg-violet-500'}
                  >
                    {goal.progress}%
                  </Badge>
                </div>
                <Progress value={goal.progress} className="h-2" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1 bg-violet-500 hover:bg-violet-600">
                    <Play className="h-4 w-4 mr-2" />
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Recommended Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-violet-600" />
            Recommended for You
          </CardTitle>
          <CardDescription>
            AI-curated courses based on your interests and goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {courses.map((course, idx) => (
            <Card key={idx} className="border-violet-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{course.title}</CardTitle>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span>{course.duration}</span>
                      <Badge variant="outline" className="text-xs">{course.level}</Badge>
                      <span className="flex items-center gap-1">
                        <Award className="h-3 w-3 text-yellow-500" />
                        {course.rating}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Enroll
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default GrowthStudio;