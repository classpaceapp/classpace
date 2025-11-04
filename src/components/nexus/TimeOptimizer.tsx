import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, Zap, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const TimeOptimizer: React.FC = () => {
  const timeBreakdown = [
    { activity: 'Teaching', hours: 25, percentage: 62, color: 'bg-violet-500' },
    { activity: 'Grading', hours: 8, percentage: 20, color: 'bg-blue-500' },
    { activity: 'Planning', hours: 5, percentage: 12, color: 'bg-green-500' },
    { activity: 'Admin', hours: 2, percentage: 5, color: 'bg-orange-500' }
  ];

  const suggestions = [
    {
      title: 'Automate Quiz Grading',
      impact: 'Save 3 hours/week',
      category: 'Grading',
      icon: Zap
    },
    {
      title: 'Batch Lesson Planning',
      impact: 'Save 2 hours/week',
      category: 'Planning',
      icon: Calendar
    },
    {
      title: 'Use Assessment Templates',
      impact: 'Save 1.5 hours/week',
      category: 'Admin',
      icon: Clock
    }
  ];

  return (
    <div className="space-y-6">
      {/* Time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-violet-600" />
              Weekly Time Distribution
            </CardTitle>
            <CardDescription>
              Your time allocation for this week
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <div className="text-4xl font-bold">40</div>
              <p className="text-sm text-muted-foreground">Total Hours This Week</p>
            </div>
            <div className="space-y-3">
              {timeBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.activity}</span>
                    <span className="text-muted-foreground">{item.hours}h ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className={`${item.color} h-2 rounded-full transition-all`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-violet-700">
              <TrendingUp className="h-5 w-5" />
              Efficiency Insights
            </CardTitle>
            <CardDescription>
              AI-powered recommendations to optimize your time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-violet-700">6.5 hours</div>
              <p className="text-sm text-muted-foreground">Potential time saved per week</p>
            </div>
            <div className="space-y-2">
              <Badge className="bg-green-500">+15% efficiency this month</Badge>
              <Badge className="bg-blue-500">3 optimization tips available</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-violet-600" />
            Smart Optimization Suggestions
          </CardTitle>
          <CardDescription>
            Actionable recommendations to save time and increase efficiency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.map((suggestion, idx) => {
            const Icon = suggestion.icon;
            return (
              <Card key={idx} className="border-l-4 border-l-violet-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-violet-100 rounded-lg">
                        <Icon className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{suggestion.title}</CardTitle>
                        <CardDescription className="text-green-600 font-medium mt-1">
                          {suggestion.impact}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">{suggestion.category}</Badge>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeOptimizer;