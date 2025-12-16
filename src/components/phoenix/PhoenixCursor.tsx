import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface PhoenixCursorProps {
  x: number;
  y: number;
  isVisible: boolean;
  isActive?: boolean;
}

export const PhoenixCursor: React.FC<PhoenixCursorProps> = ({
  x,
  y,
  isVisible,
  isActive = false
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className="pointer-events-none absolute z-50"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: x - 12,
        y: y - 12
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ 
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 0.5
      }}
    >
      {/* Main cursor */}
      <div className="relative">
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-red-500 blur-lg opacity-60"
          animate={{ 
            scale: isActive ? [1, 1.5, 1] : 1,
            opacity: isActive ? [0.6, 0.9, 0.6] : 0.6
          }}
          transition={{ 
            repeat: isActive ? Infinity : 0,
            duration: 0.8
          }}
        />
        
        {/* Cursor body */}
        <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
          <Sparkles className="w-3 h-3 text-white" />
        </div>

        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-8 top-0 whitespace-nowrap"
        >
          <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-medium rounded-full shadow-lg">
            Phoenix
          </span>
        </motion.div>
      </div>

      {/* Trail effect */}
      {isActive && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-400 to-red-400 blur-md" />
        </motion.div>
      )}
    </motion.div>
  );
};
