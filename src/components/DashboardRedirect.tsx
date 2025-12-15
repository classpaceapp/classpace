import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const DashboardRedirect = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [isAnimating, setIsAnimating] = useState(true);
  const [showRedirect, setShowRedirect] = useState(false);

  useEffect(() => {
    if (!loading && user && profile) {
      // User is logged in, trigger redirect animation
      setShowRedirect(true);
      
      // Wait for animation to complete before navigating
      const timer = setTimeout(() => {
        const dashboardPath = profile.role === 'learner' ? '/student-dashboard' : '/dashboard';
        navigate(dashboardPath, { replace: true });
      }, 2000); // 2 second animation

      return () => clearTimeout(timer);
    } else if (!loading && !user) {
      // Not logged in, hide the redirect screen
      setIsAnimating(false);
    }
  }, [user, profile, loading, navigate]);

  if (!showRedirect && !loading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-[100px] animate-pulse delay-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] animate-pulse delay-1000" />
      </div>

      {/* Spinning rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 border border-purple-500/20 rounded-full animate-[spin_8s_linear_infinite]" />
        <div className="absolute w-80 h-80 border border-pink-500/15 rounded-full animate-[spin_12s_linear_infinite_reverse]" />
        <div className="absolute w-96 h-96 border border-blue-500/10 rounded-full animate-[spin_16s_linear_infinite]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with glow and scale animation */}
        <div className="relative mb-8 animate-[scale-in_0.5s_ease-out]">
          {/* Glow effect */}
          <div className="absolute inset-0 w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-60 animate-pulse" />
          
          {/* Logo container with breathing animation */}
          <div className="relative w-32 h-32 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl flex items-center justify-center animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
            <img 
              src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
              alt="Classpace" 
              className="w-20 h-20 drop-shadow-2xl"
            />
          </div>

          {/* Rotating highlight ring */}
          <div className="absolute -inset-4 rounded-[2rem] border-2 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-50 animate-[spin_3s_linear_infinite]" 
               style={{ 
                 mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                 maskComposite: 'xor',
                 WebkitMaskComposite: 'xor',
                 padding: '2px'
               }} 
          />
        </div>

        {/* Text with staggered fade-in */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent animate-[fade-in_0.5s_ease-out_0.3s_both]">
            Welcome back
          </h1>
          <p className="text-lg text-slate-400 animate-[fade-in_0.5s_ease-out_0.5s_both]">
            Taking you to your {profile?.role === 'learner' ? 'learning' : 'teaching'} dashboard...
          </p>
        </div>

        {/* Loading bar */}
        <div className="mt-10 w-64 h-1.5 bg-slate-800/50 rounded-full overflow-hidden animate-[fade-in_0.5s_ease-out_0.7s_both]">
          <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full animate-[loading-bar_2s_ease-in-out]" 
               style={{
                 animation: 'loading-bar 2s ease-in-out forwards'
               }}
          />
        </div>
      </div>

      {/* CSS for loading bar animation */}
      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default DashboardRedirect;
