import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  Calendar, 
  BarChart3, 
  ClipboardCheck, 
  Clock, 
  FolderOpen, 
  Users, 
  TrendingUp,
  Sparkles
} from 'lucide-react';
import CurriculumArchitect from '@/components/nexus/CurriculumArchitect';
import LessonOrchestrator from '@/components/nexus/LessonOrchestrator';
import ProgressDashboard from '@/components/nexus/ProgressDashboard';
import AssessmentHub from '@/components/nexus/AssessmentHub';
import TimeOptimizer from '@/components/nexus/TimeOptimizer';
import ResourceCenter from '@/components/nexus/ResourceCenter';
import StudentProfiles from '@/components/nexus/StudentProfiles';


const TeacherNexus: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('curriculum');

  const tabs = [
    { id: 'curriculum', label: 'Curriculum', icon: BookOpen, description: 'AI-powered curriculum planning' },
    { id: 'lessons', label: 'Lessons', icon: Calendar, description: 'Intelligent lesson planning' },
    { id: 'progress', label: 'Progress', icon: BarChart3, description: 'Real-time analytics' },
    { id: 'assessments', label: 'Assessments', icon: ClipboardCheck, description: 'AI assessment creation' },
    { id: 'time', label: 'Time', icon: Clock, description: 'Time optimization insights' },
    { id: 'resources', label: 'Resources', icon: FolderOpen, description: 'Teaching materials library' },
    { id: 'students', label: 'Students', icon: Users, description: 'Student profiles and insights' }
  ];

  return (
    <DashboardLayout userRole="teacher">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Nexus
            </h1>
            <p className="text-muted-foreground mt-1">
              Your intelligent teaching command center
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 gap-2 h-auto p-2 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl shadow-xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-violet-500 data-[state=active]:text-white"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Descriptions */}
          <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-violet-700">
                {React.createElement(tabs.find(t => t.id === activeTab)?.icon || BookOpen, { 
                  className: "h-5 w-5" 
                })}
                {tabs.find(t => t.id === activeTab)?.label}
              </CardTitle>
              <CardDescription className="text-violet-600">
                {tabs.find(t => t.id === activeTab)?.description}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Tab Contents */}
          <TabsContent value="curriculum" className="space-y-4">
            <CurriculumArchitect />
          </TabsContent>

          <TabsContent value="lessons" className="space-y-4">
            <LessonOrchestrator />
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <ProgressDashboard />
          </TabsContent>

          <TabsContent value="assessments" className="space-y-4">
            <AssessmentHub />
          </TabsContent>

          <TabsContent value="time" className="space-y-4">
            <TimeOptimizer />
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <ResourceCenter />
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <StudentProfiles />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TeacherNexus;