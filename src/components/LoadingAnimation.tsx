
import React from 'react';

const LoadingAnimation = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative w-24 h-24">
        {/* Logo with reveal animation */}
        <div className="logo-reveal-container">
          <img 
            src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
            alt="Classpace Logo" 
            className="w-24 h-24 logo-reveal"
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
