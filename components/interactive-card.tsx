'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InteractiveCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  color?: 'coral' | 'mostaza' | 'menta' | 'celeste';
  delayFactor?: number;
}

export default function InteractiveCard({
  title,
  description,
  icon,
  color = 'coral',
  delayFactor = 0
}: InteractiveCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const colorClasses = {
    coral: 'bg-coral',
    mostaza: 'bg-mostaza',
    menta: 'bg-menta',
    celeste: 'bg-celeste'
  };
  
  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <motion.div
      className="h-64 w-full cursor-pointer"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delayFactor * 0.1 }}
      onClick={toggleFlip}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="w-full h-full relative"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Frente de la tarjeta */}
        <motion.div 
          className={`absolute w-full h-full border-2 border-negro p-6 ${colorClasses[color]}`}
          animate={{ 
            scale: isHovered && !isFlipped ? 1.03 : 1,
            translateY: isHovered && !isFlipped ? -5 : 0
          }}
          transition={{ duration: 0.3 }}
          style={{ 
            backfaceVisibility: 'hidden',
            boxShadow: '4px 4px 0 #111111',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          <div className="flex items-center mb-4">
            {icon && (
              <div className="mr-4 p-2 bg-crema border-2 border-negro">
                {icon}
              </div>
            )}
            <h3 className="rounded-title text-lg sm:text-xl">{title}</h3>
          </div>
          <p className="terminal-text text-sm">Haz clic para descubrir más</p>
          
          <motion.div 
            className="absolute bottom-4 right-4 w-8 h-8 flex items-center justify-center bg-crema border-2 border-negro"
            animate={{ 
              rotate: isHovered ? 90 : 0,
              scale: isHovered ? 1.1 : 1
            }}
            transition={{ duration: 0.3 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 6H11M6 1V11" stroke="#111111" strokeWidth="2" strokeLinecap="square"/>
            </svg>
          </motion.div>
        </motion.div>

        {/* Reverso de la tarjeta */}
        <motion.div 
          className="absolute w-full h-full border-2 border-negro p-6 bg-crema"
          style={{ 
            backfaceVisibility: 'hidden',
            boxShadow: '4px 4px 0 #111111',
            transform: 'rotateY(180deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          <h3 className="rounded-title text-lg mb-4 animate-color-cycle">{title}</h3>
          <p className="terminal-text">{description}</p>
          
          <motion.div 
            className="absolute bottom-4 right-4 w-8 h-8 flex items-center justify-center bg-negro border-2 border-negro"
            animate={{ 
              rotate: isHovered ? -90 : 0,
              scale: isHovered ? 1.1 : 1
            }}
            transition={{ duration: 0.3 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 6H11" stroke="#FEFAE0" strokeWidth="2" strokeLinecap="square"/>
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
} 