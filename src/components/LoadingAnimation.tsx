
import React from 'react';

const LoadingAnimation = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 w-32 h-32 border-4 border-transparent border-t-purple-400 border-r-pink-400 rounded-full animate-spin"></div>
        
        {/* Middle pulsing ring */}
        <div className="absolute inset-2 w-28 h-28 border-2 border-transparent border-b-purple-300 border-l-pink-300 rounded-full animate-spin animate-pulse" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
        
        {/* Logo container with scaling animation */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div className="animate-pulse">
            <img 
              src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
              alt="Classpace Logo" 
              className="w-16 h-16 animate-bounce"
              style={{ 
                animationDuration: '1.5s',
                filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.5))'
              }}
            />
          </div>
        </div>
        
        {/* Inner glowing dots */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-purple-300 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
        
        {/* Background gradient pulse */}
        <div className="absolute inset-0 w-32 h-32 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full animate-pulse blur-xl"></div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
