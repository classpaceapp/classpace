import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Rocket, Users, Target, Instagram, Linkedin } from "lucide-react";

const Investors = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
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
              onClick={() => navigate("/")}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-5xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent leading-tight pb-2">
            Investors
          </h1>
        </div>

        {/* Seed Round Card */}
        <div className="relative mb-16 md:mb-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-purple-900/95 via-pink-900/90 to-purple-900/95 rounded-3xl shadow-2xl p-10 md:p-16 border-2 border-purple-300/50 transform hover:scale-[1.02] transition-transform duration-300" style={{ boxShadow: '0 25px 50px -12px rgba(168, 85, 247, 0.6), 0 0 0 1px rgba(168, 85, 247, 0.4)' }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(168,85,247,0.4),transparent_60%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.4),transparent_60%)]"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
            
            <div className="relative text-center">
              <div className="inline-block px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-8">
                <span className="text-white font-bold text-lg md:text-xl">Now Raising</span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl">
                Seed Round
              </h2>
              
              <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                Classpace Labs is currently leading a seed round to accelerate our mission of making 
                world-class education accessible through AI-powered collaborative learning.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
                <a 
                  href="mailto:arya@classpace.co?subject=Investment Inquiry"
                  className="inline-flex items-center px-8 py-4 bg-white text-purple-900 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
                >
                  Get in Touch
                  <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Current Investors Section */}
        <div className="relative">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Partners</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Building the future of education together with visionary investors
            </p>
          </div>

          {/* Investor Logos Grid - Empty for now */}
          <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-3xl p-12 md:p-20 border border-gray-700/50 backdrop-blur-sm min-h-[300px] flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_70%)] rounded-3xl"></div>
            <p className="relative text-gray-400 text-lg md:text-xl text-center">
              We will publish our existing investors in due time.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white mt-16">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
                  alt="Classpace Logo" 
                  className="w-10 h-10"
                />
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Classpace
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">
                Empowering educators and learners with AI-powered shared workspaces. 
                Learn and teach anything.
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
                <li>
                  <button 
                    onClick={() => navigate("/investors")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Investors
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                © 2025 Classpace. All rights reserved.
              </p>
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

export default Investors;
