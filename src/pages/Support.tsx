
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Mail, ArrowLeft } from "lucide-react";

const Support = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
                alt="Classpace Logo" 
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <span className="text-xl md:text-2xl font-bold text-gray-900">
                Classpace
              </span>
            </div>
            <Button 
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Help Center
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're here to support you every step of your Classpace journey. Find answers, get help, and make the most of your AI-powered teaching experience.
          </p>
        </div>

        {/* Support Options */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Live Chat */}
          <Card className="border-2 border-gray-100 hover:border-purple-200 transition-all duration-300">
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
                className="w-full bg-gray-100 text-gray-400 cursor-not-allowed"
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Email Support */}
          <Card className="border-2 border-gray-100 hover:border-purple-200 transition-all duration-300">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Email Support</h3>
              <p className="text-gray-600 mb-6">Send us detailed questions or feedback</p>
              <div className="flex items-center justify-center space-x-2 text-green-600 mb-6">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-sm font-medium">Response within 24 hours</span>
              </div>
              <Button 
                onClick={() => window.location.href = 'mailto:social@classpace.co'}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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

export default Support;
