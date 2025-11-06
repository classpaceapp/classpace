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
  Compass
} from 'lucide-react';
import CurriculumArchitect from '@/components/nexus/CurriculumArchitect';
import LessonOrchestrator from '@/components/nexus/LessonOrchestrator';
import ProgressDashboard from '@/components/nexus/ProgressDashboard';
import AssessmentHub from '@/components/nexus/AssessmentHub';
import TimeOptimizer from '@/components/nexus/TimeOptimizer';
import ResourceCenter from '@/components/nexus/ResourceCenter';
import StudentProfiles from '@/components/nexus/StudentProfiles';
import UpgradeOverlay from '@/components/nexus/UpgradeOverlay';


const TeacherNexus: React.FC = () => {
  const { profile, subscription } = useAuth();
  const [activeTab, setActiveTab] = useState('curriculum');
  
  const isPremium = subscription?.subscribed && subscription.tier === 'teacher_premium';

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
            <Compass className="h-8 w-8 text-white" />
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
                  className="flex flex-col items-center gap-2 py-3 data-[state=active]:font-bold data-[state=active]:scale-105 data-[state=active]:shadow-2xl data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=inactive]:text-white data-[state=inactive]:hover:bg-white/10 transition-all duration-300 rounded-xl"
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden sm:inline font-semibold text-xs md:text-sm">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="curriculum" className="space-y-4">
            {!isPremium ? (
              <UpgradeOverlay 
                title="Curriculum Architect"
                features={[
                  "Generate comprehensive curriculum plans with AI",
                  "Align with standards and learning outcomes",
                  "Create year-long, semester, or unit plans",
                  "Customize for different grade levels and subjects",
                  "Export and share curriculum templates",
                  "Integrate seamlessly with your lessons"
                ]}
              />
            ) : null}
            <CurriculumArchitect />
          </TabsContent>

          <TabsContent value="lessons" className="space-y-4">
            {!isPremium ? (
              <UpgradeOverlay 
                title="Lesson Orchestrator"
                features={[
                  "AI-powered lesson plan generation",
                  "Create engaging activities and assessments",
                  "Generate differentiated instruction materials",
                  "Include multimedia resources automatically",
                  "Save time with smart templates",
                  "Customize for your teaching style"
                ]}
              />
            ) : null}
            <LessonOrchestrator />
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            {!isPremium ? (
              <UpgradeOverlay 
                title="Progress Dashboard"
                features={[
                  "Real-time analytics on student performance",
                  "Track engagement across all pods",
                  "Visualize quiz and assessment results",
                  "Monitor resource usage and effectiveness",
                  "Identify students needing support",
                  "Generate progress reports instantly"
                ]}
              />
            ) : null}
            <ProgressDashboard />
          </TabsContent>

          <TabsContent value="assessments" className="space-y-4">
            {!isPremium ? (
              <UpgradeOverlay 
                title="Assessment Hub"
                features={[
                  "AI-generated assessments and quizzes",
                  "Automatic grading and feedback",
                  "Create rubrics and marking schemes",
                  "Generate public assessment links",
                  "Track student responses in real-time",
                  "Export results and analytics"
                ]}
              />
            ) : null}
            <AssessmentHub />
          </TabsContent>

          <TabsContent value="time" className="space-y-4">
            {!isPremium ? (
              <UpgradeOverlay 
                title="Time Optimizer"
                features={[
                  "Analyze time spent on teaching tasks",
                  "Get insights on workload distribution",
                  "Identify time-saving opportunities",
                  "Track pod management efficiency",
                  "Optimize resource creation workflow",
                  "Balance teaching and administrative work"
                ]}
              />
            ) : null}
            <TimeOptimizer />
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            {!isPremium ? (
              <UpgradeOverlay 
                title="Resource Center"
                features={[
                  "Upload and share teaching resources globally",
                  "Access thousands of educator-created materials",
                  "Search by subject, grade level, and type",
                  "Download PDFs, presentations, and documents",
                  "Organize your resource library",
                  "Contribute to the teaching community"
                ]}
              />
            ) : null}
            <ResourceCenter />
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            {!isPremium ? (
              <UpgradeOverlay 
                title="Student Profiles"
                features={[
                  "View detailed student engagement metrics",
                  "Track participation across all pods",
                  "Monitor quiz performance and progress",
                  "Identify at-risk students early",
                  "Access individual learning analytics",
                  "Support personalized instruction"
                ]}
              />
            ) : null}
            <StudentProfiles />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TeacherNexus;