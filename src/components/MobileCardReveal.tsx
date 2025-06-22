
import React, { useState, useEffect } from 'react';

interface Card {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color?: string;
}

interface MobileCardRevealProps {
  cards: Card[];
  interval?: number;
}

const MobileCardReveal = ({ cards, interval = 3500 }: MobileCardRevealProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
        setIsAnimating(false);
      }, 400); // Half of the animation duration
    }, interval);

    return () => clearInterval(timer);
  }, [cards.length, interval]);

  const currentCard = cards[currentIndex];
  const IconComponent = currentCard.icon;

  return (
    <div className="md:hidden px-4">
      <div className="max-w-sm mx-auto">
        <div 
          key={`${currentIndex}-${isAnimating}`}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-700 animate-morph-reveal relative overflow-hidden"
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl opacity-0 animate-pulse" 
               style={{ animationDelay: '0.3s', animationDuration: '2s' }} />
          
          <div className={`w-16 h-16 ${currentCard.color ? `bg-gradient-to-r ${currentCard.color}` : 'bg-gradient-to-r from-purple-500 to-pink-500'} rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-lg`}>
            <IconComponent className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="font-bold text-2xl mb-4 text-white relative z-10">
            {currentCard.title}
          </h3>
          
          <p className="text-gray-300 text-base leading-relaxed relative z-10">
            {currentCard.description}
          </p>
        </div>
        
        {/* Enhanced dots indicator */}
        <div className="flex justify-center space-x-3 mt-8">
          {cards.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-500 ${
                index === currentIndex 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 w-8 shadow-lg' 
                  : 'bg-gray-600 w-2 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileCardReveal;
