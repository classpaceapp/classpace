
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, LogIn, ArrowLeft, Sparkles } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="text-center space-y-8 relative z-10 px-4 max-w-2xl mx-auto">
        {/* Main 404 display */}
        <div className="space-y-4">
          <div className="relative">
            <h1 className="text-8xl md:text-9xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent animate-fade-in filter drop-shadow-2xl">
              404
            </h1>
            <div className="absolute inset-0 text-8xl md:text-9xl font-black text-purple-500/20 blur-sm animate-pulse">
              404
            </div>
          </div>
          
          <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
              Lost in Space
              <Sparkles className="w-8 h-8 text-pink-400 animate-pulse" />
            </h2>
            <p className="text-xl text-gray-300 max-w-md mx-auto leading-relaxed">
              Oops! It seems like you've ventured into uncharted territory. 
              <span className="block mt-2 text-purple-300 font-medium">
                Let's get you back to familiar ground.
              </span>
            </p>
          </div>
        </div>
        
        {/* Interactive buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Button 
            onClick={() => navigate("/")}
            className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <div className="relative flex items-center gap-3">
              <Home className="w-5 h-5" />
              Take Me Home
            </div>
          </Button>
          
          <Button 
            onClick={() => navigate("/login")}
            className="group relative bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:bg-white/20 hover:shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <LogIn className="w-5 h-5" />
              Sign In
            </div>
          </Button>
        </div>

        {/* Back button */}
        <div className="animate-fade-in" style={{ animationDelay: '0.9s' }}>
          <Button 
            onClick={() => navigate(-1)}
            variant="ghost"
            className="text-gray-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
    </div>
  );
};

export default NotFound;
