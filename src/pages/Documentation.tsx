import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Clock, Sparkles } from 'lucide-react';

const Documentation = () => {
  const { profile } = useAuth();
  const userRole = profile?.role === 'teacher' ? 'teacher' : 'learner';

  return (
    <DashboardLayout userRole={userRole}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-6">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Documentation
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive guides and resources to help you master Classpace
            </p>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-6">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Coming Soon
            </h2>
            
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              We're crafting comprehensive documentation to help you get the most out of Classpace. 
              Our team is working hard to bring you detailed guides, tutorials, and best practices.
            </p>

            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <Clock className="h-5 w-5" />
              <span className="font-medium">Expected Launch: Soon</span>
            </div>
          </div>

          {/* Feature Preview */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">User Guides</h3>
              <p className="text-gray-600 text-sm">Step-by-step instructions for every feature</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Best Practices</h3>
              <p className="text-gray-600 text-sm">Tips and tricks from education experts</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Quick Start</h3>
              <p className="text-gray-600 text-sm">Get up and running in minutes</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Documentation;