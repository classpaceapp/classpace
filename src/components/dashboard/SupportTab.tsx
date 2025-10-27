import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Mail } from 'lucide-react';

export const SupportTab: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Help Center
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're here to support you every step of your Classpace journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Live Chat */}
          <Card className="border-2 border-gray-200 hover:border-purple-400 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Live Chat</h3>
              <p className="text-gray-600 mb-6">Get instant help from our support team</p>
              <div className="flex items-center justify-center space-x-2 text-purple-600 mb-6">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Coming Soon</span>
              </div>
              <Button 
                disabled
                className="w-full bg-gray-400 text-white cursor-not-allowed"
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Email Support */}
          <Card className="border-2 border-gray-200 hover:border-purple-400 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Email Support</h3>
              <p className="text-gray-600 mb-6">Send us detailed questions or feedback</p>
              <div className="flex items-center justify-center space-x-2 text-green-500 mb-6">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Response within 24 hours</span>
              </div>
              <Button 
                onClick={() => window.location.href = 'mailto:social@classpace.co'}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                Send Email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
