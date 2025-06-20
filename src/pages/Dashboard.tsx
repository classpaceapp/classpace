
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, MessageSquare, Users, BookOpen, Clock, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole] = useState<"teacher" | "learner">("teacher"); // Mock role

  // Mock data
  const pods = [
    {
      id: "1",
      name: "Advanced Mathematics",
      members: 12,
      lastActivity: "2 hours ago",
      newMessages: 3,
      progress: 78,
    },
    {
      id: "2", 
      name: "Physics Fundamentals",
      members: 8,
      lastActivity: "1 day ago",
      newMessages: 0,
      progress: 45,
    },
    {
      id: "3",
      name: "Chemistry Lab",
      members: 15,
      lastActivity: "3 hours ago", 
      newMessages: 7,
      progress: 92,
    },
  ];

  const handleCreatePod = () => {
    toast({
      title: "Create New Pod",
      description: "Pod creation feature coming soon!",
    });
  };

  const handleJoinPod = () => {
    toast({
      title: "Join Pod",
      description: "Pod joining feature coming soon!",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
                alt="Classpace Logo" 
                className="w-8 h-8"
              />
              <span className="text-xl font-bold bg-gradient-main bg-clip-text text-transparent">
                Classpace
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-gradient-soft border-purple-200">
                {userRole === "teacher" ? "Teacher" : "Learner"}
              </Badge>
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
              <Avatar>
                <AvatarFallback className="bg-gradient-main text-white">
                  {userRole === "teacher" ? "T" : "L"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back!
          </h1>
          <p className="text-gray-600">
            {userRole === "teacher" 
              ? "Manage your classes and track student progress" 
              : "Continue your learning journey"
            }
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Button
            onClick={handleCreatePod}
            className="h-16 bg-gradient-main hover:opacity-90 text-white text-left justify-start p-6"
          >
            <Plus className="w-6 h-6 mr-3" />
            <div>
              <div className="font-semibold">
                {userRole === "teacher" ? "Create New Pod" : "Join a Pod"}
              </div>
              <div className="text-sm opacity-90">
                {userRole === "teacher" 
                  ? "Start a new learning space" 
                  : "Enter an invite code"
                }
              </div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            onClick={handleJoinPod}
            className="h-16 border-purple-200 text-purple-700 hover:bg-purple-50 text-left justify-start p-6"
          >
            <MessageSquare className="w-6 h-6 mr-3" />
            <div>
              <div className="font-semibold">Quick AI Chat</div>
              <div className="text-sm opacity-70">Ask anything, get instant help</div>
            </div>
          </Button>
        </div>

        {/* Pods Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {userRole === "teacher" ? "Your Pods" : "Joined Pods"}
            </h2>
            <Badge variant="outline" className="text-purple-600 border-purple-200">
              {pods.length} active
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pods.map((pod) => (
              <Card 
                key={pod.id}
                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-none shadow-md"
                onClick={() => navigate(`/pod/${pod.id}`)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold">{pod.name}</CardTitle>
                    {pod.newMessages > 0 && (
                      <Badge className="bg-gradient-main text-white">
                        {pod.newMessages}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {pod.members}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {pod.lastActivity}
                    </span>
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{pod.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-main h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pod.progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { pod: "Advanced Mathematics", action: "New quiz generated", time: "2 hours ago" },
                { pod: "Physics Fundamentals", action: "Summary created", time: "1 day ago" },
                { pod: "Chemistry Lab", action: "New materials uploaded", time: "3 hours ago" },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gradient-main rounded-full"></div>
                    <div>
                      <span className="font-medium">{activity.pod}</span>
                      <span className="text-gray-600 ml-2">•</span>
                      <span className="text-gray-600 ml-2">{activity.action}</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
