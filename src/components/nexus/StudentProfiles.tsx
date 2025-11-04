import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Search, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const StudentProfiles: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const students = [
    {
      id: 1,
      name: 'Emma Johnson',
      initials: 'EJ',
      class: 'Math 101',
      avgScore: 92,
      trend: 'up',
      attendance: 98,
      strengths: ['Problem Solving', 'Critical Thinking'],
      needsAttention: false
    },
    {
      id: 2,
      name: 'Michael Chen',
      initials: 'MC',
      class: 'Math 101',
      avgScore: 78,
      trend: 'down',
      attendance: 95,
      strengths: ['Visual Learning'],
      needsAttention: true
    },
    {
      id: 3,
      name: 'Sarah Williams',
      initials: 'SW',
      class: 'Math 102',
      avgScore: 88,
      trend: 'stable',
      attendance: 100,
      strengths: ['Collaborative Work', 'Verbal Skills'],
      needsAttention: false
    },
    {
      id: 4,
      name: 'David Martinez',
      initials: 'DM',
      class: 'Math 201',
      avgScore: 95,
      trend: 'up',
      attendance: 97,
      strengths: ['Advanced Concepts', 'Independent Study'],
      needsAttention: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-600" />
            Student Intelligence Profiles
          </CardTitle>
          <CardDescription>
            AI-powered insights into individual student progress and needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students by name or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <div className="space-y-4">
        {students.map((student) => (
          <Card 
            key={student.id} 
            className={`border-l-4 ${
              student.needsAttention 
                ? 'border-l-orange-500 bg-orange-50/30' 
                : 'border-l-violet-500'
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-violet-500 text-white font-semibold">
                      {student.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{student.name}</CardTitle>
                      {student.needsAttention && (
                        <Badge variant="destructive" className="bg-orange-500">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Needs Attention
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{student.class}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Average Score</p>
                  <p className="text-2xl font-bold">{student.avgScore}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Attendance</p>
                  <p className="text-2xl font-bold">{student.attendance}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Performance Trend</p>
                  <div className="flex items-center gap-2">
                    {student.trend === 'up' && (
                      <>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-semibold text-green-600">Improving</span>
                      </>
                    )}
                    {student.trend === 'down' && (
                      <>
                        <TrendingDown className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-semibold text-orange-600">Declining</span>
                      </>
                    )}
                    {student.trend === 'stable' && (
                      <>
                        <Minus className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-600">Stable</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Strengths */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Identified Strengths:</h4>
                <div className="flex flex-wrap gap-2">
                  {student.strengths.map((strength, idx) => (
                    <Badge key={idx} className="bg-green-100 text-green-700">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* AI Recommendations */}
              {student.needsAttention && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="text-sm text-orange-700">AI Recommendation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Recent decline in performance suggests need for additional support. 
                      Recommend: one-on-one session focusing on current unit concepts.
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StudentProfiles;