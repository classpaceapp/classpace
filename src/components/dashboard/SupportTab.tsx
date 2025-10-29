import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Mail } from 'lucide-react';

export const SupportTab: React.FC = () => {
  return (
    <div className="p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                Support
              </h1>
            </div>
          </div>
          <p className="text-lg text-foreground/70">
            Get help when you need it
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Live Chat */}
          <Card className="border-2 border-border/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 transition-all bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Live Chat</h3>
              <p className="text-muted-foreground mb-6">Get instant help from our support team</p>
              <div className="flex items-center justify-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-full mb-6">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-sm font-semibold">Live</span>
              </div>
              <Button 
                onClick={() => (window as any)?.openTawkChat?.()}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                Open Live Chat
              </Button>
            </CardContent>
          </Card>

          {/* Email Support */}
          <Card className="border-2 border-border/30 hover:border-pink-500/50 hover:shadow-2xl hover:shadow-pink-500/20 transition-all bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-500/30">
                <Mail className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Email Support</h3>
              <p className="text-muted-foreground mb-6">Send us detailed questions or feedback</p>
              <div className="flex items-center justify-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-full mb-6">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-sm font-semibold">Response within 24 hours</span>
              </div>
              <Button 
                onClick={() => window.location.href = 'mailto:social@classpace.co'}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
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
