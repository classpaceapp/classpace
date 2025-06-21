
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
                alt="Classpace Logo" 
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Classpace
              </span>
            </div>
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Welcome back{profile?.first_name ? `, ${profile.first_name}` : ''}!
            </h1>
            <div className="flex items-center justify-center space-x-2 mb-6">
              {profile?.role === 'teacher' ? (
                <>
                  <BookOpen className="w-6 h-6 text-purple-400" />
                  <span className="text-xl text-purple-400 font-semibold">Teacher Dashboard</span>
                </>
              ) : (
                <>
                  <Users className="w-6 h-6 text-pink-400" />
                  <span className="text-xl text-pink-400 font-semibold">Learner Dashboard</span>
                </>
              )}
            </div>
            <p className="text-gray-300 text-lg">
              {profile?.role === 'teacher' 
                ? "Ready to create and share knowledge with your students?"
                : "Ready to continue your learning journey?"
              }
            </p>
          </div>

          {/* Dashboard Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Profile</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> {profile?.role}</p>
                <p><strong>Name:</strong> {profile?.first_name} {profile?.last_name}</p>
                <p><strong>Member since:</strong> {new Date(profile?.created_at || '').toLocaleDateString()}</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {profile?.role === 'teacher' ? 'My Classes' : 'My Courses'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                <p>Coming soon! You'll be able to manage your {profile?.role === 'teacher' ? 'classes' : 'enrolled courses'} here.</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">AI Pods</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                <p>Your AI-powered workspaces will appear here. Create your first pod to get started!</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400">
              This is just the beginning! More features are coming soon.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
