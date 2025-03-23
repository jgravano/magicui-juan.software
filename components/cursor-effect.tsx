'use client'

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CursorEffect() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Solo aplicar en dispositivos no táctiles
    if (window.matchMedia('(pointer: fine)').matches) {
      setIsVisible(true);
      
      const handleMouseMove = (e: MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
        
        // Detectar si el cursor está sobre un elemento clickeable
        const target = e.target as HTMLElement;
        const computedStyle = window.getComputedStyle(target);
        const newIsPointer = computedStyle.cursor === 'pointer' || 
                            target.tagName === 'A' || 
                            target.tagName === 'BUTTON' ||
                            target.closest('a') !== null ||
                            target.closest('button') !== null ||
                            target.classList.contains('cursor-pointer') ||
                            target.classList.contains('retro-button') ||
                            computedStyle.cursor.includes('grab');
        
        setIsPointer(newIsPointer);
      };
      
      const handleMouseDown = () => setIsClicking(true);
      const handleMouseUp = () => setIsClicking(false);
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <>
      {/* Cursor principal */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-50 mix-blend-difference"
        animate={{
          x: mousePosition.x - (isPointer ? 16 : 8),
          y: mousePosition.y - (isPointer ? 16 : 8),
          scale: isClicking ? 0.8 : 1
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 28,
          mass: 0.5
        }}
        style={{
          position: 'fixed',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {/* Cursor exterior */}
        <motion.div 
          className={`border-2 rounded-sm ${isPointer ? 'border-mostaza' : 'border-coral'}`}
          style={{
            width: isPointer ? '32px' : '16px',
            height: isPointer ? '32px' : '16px',
            backgroundColor: 'transparent',
            transition: 'width 0.2s, height 0.2s, border-color 0.3s'
          }}
        />
      </motion.div>
      
      {/* Punto central del cursor */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-50"
        animate={{
          x: mousePosition.x - 3,
          y: mousePosition.y - 3,
          scale: isClicking ? 1.5 : 1
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 28,
          mass: 0.5,
          delay: 0.02
        }}
        style={{
          position: 'fixed',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        <div 
          className={`w-1.5 h-1.5 rounded-sm ${isPointer ? 'bg-mostaza' : 'bg-coral'}`}
          style={{ transition: 'background-color 0.3s' }}
        />
      </motion.div>
    </>
  );
} 