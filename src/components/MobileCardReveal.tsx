
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

const MobileCardReveal = ({ cards, interval = 3000 }: MobileCardRevealProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
    }, interval);

    return () => clearInterval(timer);
  }, [cards.length, interval]);

  const currentCard = cards[currentIndex];
  const IconComponent = currentCard.icon;

  return (
    <div className="md:hidden px-4">
      <div className="max-w-sm mx-auto">
        <div 
          key={currentIndex}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-700 animate-fade-in"
        >
          <div className={`w-16 h-16 ${currentCard.color ? `bg-gradient-to-r ${currentCard.color}` : 'bg-gradient-to-r from-purple-500 to-pink-500'} rounded-2xl flex items-center justify-center mb-6`}>
            <IconComponent className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-2xl mb-4 text-white">{currentCard.title}</h3>
          <p className="text-gray-300 text-base leading-relaxed">{currentCard.description}</p>
        </div>
        
        {/* Dots indicator */}
        <div className="flex justify-center space-x-2 mt-6">
          {cards.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-purple-500 w-8' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileCardReveal;
