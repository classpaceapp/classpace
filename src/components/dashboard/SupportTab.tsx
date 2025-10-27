import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Mail } from 'lucide-react';

export const SupportTab: React.FC = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-3">
            Support
          </h1>
          <p className="text-lg text-foreground/70">
            Get help when you need it
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Live Chat */}
          <Card className="border border-border/50 hover:border-primary/30 transition-all bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-5">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Live Chat</h3>
              <p className="text-muted-foreground text-sm mb-5">Get instant help from our support team</p>
              <div className="flex items-center justify-center space-x-2 text-purple-600 mb-5">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                <span className="text-xs font-medium">Coming Soon</span>
              </div>
              <Button 
                disabled
                variant="secondary"
                className="w-full"
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Email Support */}
          <Card className="border border-border/50 hover:border-primary/30 transition-all bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-5">
                <Mail className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Email Support</h3>
              <p className="text-muted-foreground text-sm mb-5">Send us detailed questions or feedback</p>
              <div className="flex items-center justify-center space-x-2 text-green-500 mb-5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium">Response within 24 hours</span>
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
