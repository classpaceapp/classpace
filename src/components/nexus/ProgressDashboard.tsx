import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Target, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ProgressDashboard: React.FC = () => {
  const stats = [
    { label: 'Total Students', value: '156', change: '+12%', icon: Users, color: 'text-blue-600' },
    { label: 'Avg. Performance', value: '87%', change: '+5%', icon: Target, color: 'text-green-600' },
    { label: 'Completion Rate', value: '94%', change: '+8%', icon: Award, color: 'text-purple-600' },
    { label: 'Growth Trend', value: '+15%', change: 'Strong', icon: TrendingUp, color: 'text-emerald-600' }
  ];

  const classProgress = [
    { class: 'Math 101', students: 32, avgScore: 89, trend: 'up' },
    { class: 'Math 102', students: 28, avgScore: 85, trend: 'up' },
    { class: 'Math 201', students: 25, avgScore: 91, trend: 'up' },
    { class: 'Math 202', students: 30, avgScore: 82, trend: 'stable' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600 font-medium">{stat.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Class Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-violet-600" />
            Class Performance Analytics
          </CardTitle>
          <CardDescription>
            Real-time insights across all your classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {classProgress.map((cls, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:border-violet-300 transition-colors">
                <div className="flex-1">
                  <h4 className="font-semibold">{cls.class}</h4>
                  <p className="text-sm text-muted-foreground">{cls.students} students</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold">{cls.avgScore}%</div>
                    <p className="text-xs text-muted-foreground">Average Score</p>
                  </div>
                  <Badge 
                    variant={cls.trend === 'up' ? 'default' : 'secondary'}
                    className={cls.trend === 'up' ? 'bg-green-500' : ''}
                  >
                    {cls.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                    {cls.trend === 'up' ? 'Improving' : 'Stable'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-violet-700">
            <TrendingUp className="h-5 w-5" />
            AI Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-white rounded-lg border border-violet-200">
            <h4 className="font-semibold text-sm mb-1">Strong Performance in Math 201</h4>
            <p className="text-sm text-muted-foreground">
              Students are excelling in advanced concepts. Consider introducing challenge problems.
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-violet-200">
            <h4 className="font-semibold text-sm mb-1">Math 202 Needs Attention</h4>
            <p className="text-sm text-muted-foreground">
              5 students struggling with recent material. Recommended: small group intervention session.
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-violet-200">
            <h4 className="font-semibold text-sm mb-1">Engagement Trend</h4>
            <p className="text-sm text-muted-foreground">
              Participation has increased 23% after implementing interactive activities.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressDashboard;