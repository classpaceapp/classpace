import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Mail, ArrowLeft, Instagram, Linkedin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Support = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const dashboardPath = profile?.role === 'learner' ? '/student-dashboard' : '/dashboard';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <button 
              onClick={() => navigate(dashboardPath)}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <img 
                src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
                alt="Classpace Logo" 
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Classpace
              </span>
            </button>
            <Button 
              variant="ghost"
              onClick={() => navigate(dashboardPath)}
              className="flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
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
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Help Center
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            We're here to support you every step of your Classpace journey. Find answers, get help, and make the most of your AI-powered teaching experience.
          </p>
        </div>

        {/* Support Options */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Live Chat */}
          <Card className="border-2 border-gray-700 hover:border-purple-500 transition-all duration-300 bg-gray-800/90 backdrop-blur-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Live Chat</h3>
              <p className="text-gray-300 mb-6">Get instant help from our support team</p>
              <div className="flex items-center justify-center space-x-2 text-green-400 mb-6">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium">Live</span>
              </div>
              <Button 
                onClick={() => (window as any)?.openTawkChat?.()}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                Open Live Chat
              </Button>
            </CardContent>
          </Card>

          {/* Email Support */}
          <Card className="border-2 border-gray-700 hover:border-purple-500 transition-all duration-300 bg-gray-800/90 backdrop-blur-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Email Support</h3>
              <p className="text-gray-300 mb-6">Send us detailed questions or feedback</p>
              <div className="flex items-center justify-center space-x-2 text-green-400 mb-6">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
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

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white mt-16">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
                  alt="Classpace Logo" 
                  className="w-10 h-10"
                />
                <span className="text-2xl font-bold text-white">
                  Classpace
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">
                Empowering educators and learners with AI-powered shared workspaces. 
                Learn and teach anything, together.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://www.instagram.com/classpace.co/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors cursor-pointer"
                >
                  <Instagram className="w-5 h-5 text-white" />
                </a>
                <a 
                  href="https://www.linkedin.com/company/105928104/admin/dashboard/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors cursor-pointer"
                >
                  <Linkedin className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-purple-300">Product</h3>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={() => navigate("/pricing")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/our-journey")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Our Journey
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/login")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Sign In
                  </button>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-purple-300">Support</h3>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={() => navigate("/support")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/refunds")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Refunds
                  </button>
                </li>
                <li>
                  <a 
                    href="mailto:social@classpace.co"
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-purple-300">Legal</h3>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={() => navigate("/terms")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/privacy")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-gray-400">
                  © 2025 Classpace. All rights reserved.
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Classpace Inc, 600 N Broad St, Ste 5 #445, Middletown, Delaware 19709
                </p>
              </div>
              <p className="text-gray-400 text-sm">
                Built for educators and learners everywhere.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Support;
