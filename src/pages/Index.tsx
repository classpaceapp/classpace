import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Brain, MessageSquare, Music, Palette, Calculator, Globe, Video, Clock, ArrowRight, CheckCircle, Instagram, Linkedin, LogOut } from "lucide-react";
import LoadingAnimation from "@/components/LoadingAnimation";
import MobileCardReveal from "@/components/MobileCardReveal";
import { useLoadingAnimation } from "@/hooks/useLoadingAnimation";
import { useAuth } from "@/contexts/AuthContext";
import DashboardRedirect from "@/components/DashboardRedirect";

const Index = () => {
  const navigate = useNavigate();
  const isLoading = useLoadingAnimation();
  const { user, profile, signOut, loading } = useAuth();

  const domains = [
    {
      icon: BookOpen,
      title: "Academics",
      description: "Math, Science, Literature, History",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Palette,
      title: "Arts & Crafts",
      description: "Painting, Drawing, Sculpture, Design",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: Music,
      title: "Music",
      description: "Piano, Guitar, Voice, Theory",
      color: "from-purple-500 to-violet-500"
    },
    {
      icon: Calculator,
      title: "Technical Skills",
      description: "Programming, Engineering, Data Science",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Globe,
      title: "Languages",
      description: "English, Spanish, French, Mandarin",
      color: "from-orange-500 to-amber-500"
    },
    {
      icon: Video,
      title: "Online & In-Person",
      description: "Virtual classes, Hybrid learning",
      color: "from-indigo-500 to-blue-500"
    }
  ];

  const features = [
    {
      icon: MessageSquare,
      title: "AI Pods",
      description: "Private workspaces with persistent AI memory"
    },
    {
      icon: Brain,
      title: "Smart Summaries",
      description: "Auto-generate notes, quizzes, and flashcards"
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "Share materials and track progress"
    },
    {
      icon: Clock,
      title: "Progress Tracking",
      description: "Monitor learning with personalized insights"
    }
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  if (isLoading) {
    return <LoadingAnimation />;
  }

  // Show redirect animation for logged-in users
  if (!loading && user && profile) {
    return <DashboardRedirect />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-3">
              <img 
                src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
                alt="Classpace Logo" 
                className="w-7 h-7 md:w-10 md:h-10"
              />
              <span className="text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Classpace
              </span>
            </div>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="hidden md:block text-sm text-gray-300">
                  Welcome, {profile?.first_name || user.email}
                </span>
                <Button 
                  onClick={() => {
                    const dashboardPath = profile?.role === 'learner' ? '/student-dashboard' : '/dashboard';
                    navigate(dashboardPath);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 md:px-6 py-2 text-sm md:text-base border-0"
                >
                  Dashboard
                </Button>
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 px-4 py-2 text-sm md:text-base"
                >
                  <LogOut className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => navigate("/login")}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 md:px-6 py-2 text-sm md:text-base border-0"
              >
                Get Started
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section - Enhanced prominence for desktop */}
      <section className="relative py-12 md:py-40 lg:py-48 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-3 md:px-4">
          <div className="text-center max-w-6xl mx-auto">
            <div className="animate-fade-in">
              <h1 className="text-3xl md:text-8xl lg:text-9xl font-bold mb-4 md:mb-8 leading-[1.1] tracking-tight text-clip-fix bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent px-2">
                Learn and Teach Anything
              </h1>
              <p className="text-lg md:text-4xl lg:text-5xl font-semibold text-gray-200 mb-6 md:mb-12 px-2">
                with the world's first AI-native classroom and workspace
              </p>
            </div>
            
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <p className="text-base md:text-3xl lg:text-4xl mb-8 md:mb-20 max-w-5xl mx-auto leading-relaxed font-medium bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent px-2">
                AI-powered shared workspaces where teachers and learners collaborate, 
                share knowledge, and grow through intelligent conversations.
              </p>
            </div>
            
            {!user && (
              <div className="animate-fade-in flex flex-col sm:flex-row gap-6 md:gap-8 justify-center mb-16 md:mb-24" style={{ animationDelay: '0.4s' }}>
                <Button 
                  size="lg" 
                  onClick={() => navigate("/login")}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 md:px-16 py-6 md:py-8 text-xl md:text-2xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 border-0"
                >
                  Start Teaching
                </Button>
                <Button 
                  size="lg" 
                  onClick={() => navigate("/login")}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-12 md:px-16 py-6 md:py-8 text-xl md:text-2xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 border-0"
                >
                  Start Learning
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-32 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 overflow-hidden">
        <div className="container mx-auto px-3 md:px-4 mb-10 md:mb-16">
          <div className="text-center">
            <h2 className="text-2xl md:text-6xl font-bold text-white mb-4 md:mb-6 px-2">
              Powered by <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Intelligence</span>
            </h2>
            <p className="text-base md:text-xl text-gray-300 max-w-3xl mx-auto px-3">
              Revolutionary AI features that transform how you teach and learn
            </p>
          </div>
        </div>
        
        {/* Mobile Card Reveal */}
        <MobileCardReveal cards={features} />
        
        {/* Desktop Sliding Cards */}
        <div className="slides-container hidden md:block">
          <div className="flex animate-slide space-x-8">
            {[...features, ...features, ...features].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={index}
                  className="flex-shrink-0 w-80 md:w-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-700 hover:border-purple-500 transition-all duration-500 hover:-translate-y-2"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-2xl mb-4 text-white">{feature.title}</h3>
                  <p className="text-gray-300 text-base leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Domains Section */}
      <section className="py-12 md:py-32 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="container mx-auto px-3 md:px-4 mb-10 md:mb-16">
          <div className="text-center">
            <h2 className="text-2xl md:text-6xl font-bold text-white mb-4 md:mb-6 px-2">
              Perfect for <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Every Domain</span>
            </h2>
            <p className="text-base md:text-xl text-gray-300 max-w-4xl mx-auto px-3">
              Whether you're teaching online or in-person, Classpace adapts to any subject, 
              skill, or learning environment with seamless precision.
            </p>
          </div>
        </div>
        
        {/* Mobile Card Reveal */}
        <MobileCardReveal cards={domains} />
        
        {/* Desktop Sliding Cards */}
        <div className="slides-container hidden md:block">
          <div className="flex animate-slide-reverse space-x-8">
            {[...domains, ...domains, ...domains].map((domain, index) => {
              const IconComponent = domain.icon;
              return (
                <div 
                  key={index}
                  className="flex-shrink-0 w-80 md:w-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-700 hover:border-pink-500 transition-all duration-500 hover:-translate-y-2"
                >
                  <div className={`w-20 h-20 bg-gradient-to-r ${domain.color} rounded-3xl flex items-center justify-center mb-8 shadow-xl`}>
                    <IconComponent className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="font-bold text-2xl mb-4 text-white">{domain.title}</h3>
                  <p className="text-gray-300 leading-relaxed text-base">{domain.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-12 md:py-32 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600">
          <div className="container mx-auto px-3 md:px-4 text-center">
            <div className="max-w-4xl mx-auto text-white px-2">
              <h2 className="text-2xl md:text-6xl font-bold mb-6 md:mb-8">
                Ready to Transform Learning?
              </h2>
              <p className="text-base md:text-2xl mb-8 md:mb-12 opacity-90">
                Join thousands of educators and learners already using Classpace
              </p>
              <Button 
                size="lg"
                onClick={() => navigate("/login")}
                className="bg-white text-purple-600 hover:bg-gray-100 px-12 py-6 text-xl font-semibold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2"
              >
                Start Your Journey
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
        <div className="container mx-auto px-3 md:px-4 py-8 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-4 md:mb-6">
                <img 
                  src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
                  alt="Classpace Logo" 
                  className="w-8 h-8 md:w-10 md:h-10"
                />
                <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Classpace
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4 md:mb-6 text-sm md:text-base">
                Empowering educators and learners with AI-powered shared workspaces. 
                Learn and teach anything.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://www.instagram.com/classpace.co/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 md:w-10 md:h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors cursor-pointer"
                >
                  <Instagram className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </a>
                <a 
                  href="https://www.linkedin.com/company/classpace-app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 md:w-10 md:h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors cursor-pointer"
                >
                  <Linkedin className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-base md:text-xl font-bold mb-3 md:mb-6 text-purple-300">Product</h3>
              <ul className="space-y-2 md:space-y-4">
                <li>
                  <button 
                    onClick={() => navigate("/pricing")}
                    className="text-sm md:text-lg font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/our-journey")}
                    className="text-sm md:text-lg font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Our Journey
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/careers")}
                    className="text-sm md:text-lg font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Careers
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/login")}
                    className="text-sm md:text-lg font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Sign In
                  </button>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-base md:text-xl font-bold mb-3 md:mb-6 text-purple-300">Support</h3>
              <ul className="space-y-2 md:space-y-4">
                <li>
                  <button 
                    onClick={() => navigate("/support")}
                    className="text-sm md:text-lg font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/refunds")}
                    className="text-sm md:text-lg font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Refunds
                  </button>
                </li>
                <li>
                  <a 
                    href="mailto:social@classpace.co"
                    className="text-sm md:text-lg font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-base md:text-xl font-bold mb-3 md:mb-6 text-purple-300">Legal</h3>
              <ul className="space-y-2 md:space-y-4">
                <li>
                  <button 
                    onClick={() => navigate("/terms")}
                    className="text-sm md:text-lg font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/privacy")}
                    className="text-sm md:text-lg font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/investors")}
                    className="text-sm md:text-lg font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Investors
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-700 mt-8 md:mt-12 pt-6 md:pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
              <p className="text-gray-400 text-xs md:text-base text-center md:text-left">
                © 2025 Classpace. All rights reserved.
              </p>
              <p className="text-gray-400 text-xs md:text-sm text-center md:text-right">
                Built for educators and learners everywhere.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
