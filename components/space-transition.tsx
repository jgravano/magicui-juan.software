'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpaceTransitionProps {
  isActive: boolean;
  onComplete: () => void;
  color?: 'coral' | 'mostaza' | 'menta' | 'celeste';
  duration?: number;
}

const SpaceTransition: React.FC<SpaceTransitionProps> = ({
  isActive,
  onComplete,
  color = 'celeste',
  duration = 2
}) => {
  const [stars, setStars] = useState<{ x: number; y: number; size: number; delay: number }[]>([]);
  
  // Colores según la paleta
  const colorMap = {
    coral: '#FF8075',
    mostaza: '#FFD166',
    menta: '#83D1B5',
    celeste: '#6ABED8'
  };

  // Generar estrellas aleatorias cuando se active la transición
  useEffect(() => {
    if (isActive) {
      const newStars = Array.from({ length: 100 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 0.5
      }));
      setStars(newStars);
    }
  }, [isActive]);

  // Variantes para la animación
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
        when: "beforeChildren"
      }
    },
    exit: { 
      opacity: 0,
      transition: { 
        duration: 0.3,
        when: "afterChildren"
      }
    }
  };

  const warpVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: { 
      opacity: 1, 
      scale: 1.5,
      transition: { 
        duration: duration * 0.7,
      }
    },
    exit: { 
      opacity: 0,
      scale: 5,
      transition: { 
        duration: duration * 0.3
      }
    }
  };

  const starVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: (i: number) => ({ 
      opacity: 1, 
      scale: 1,
      transition: { 
        delay: i,
        duration: 0.3
      }
    }),
    exit: { 
      opacity: 0,
      transition: { 
        duration: 0.2
      }
    }
  };

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-50 bg-negro overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Efecto de viaje espacial */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            variants={warpVariants}
          >
            <div 
              className="w-40 h-40 rounded-full"
              style={{
                background: `radial-gradient(circle, ${colorMap[color]} 0%, rgba(17, 17, 17, 0) 70%)`,
                boxShadow: `0 0 100px 20px ${colorMap[color]}`
              }}
            />
          </motion.div>

          {/* Estrellas que pasan rápidamente */}
          {stars.map((star, index) => (
            <motion.div
              key={index}
              className="absolute rounded-full bg-crema"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`
              }}
              variants={starVariants}
              custom={star.delay}
              animate={{
                x: [0, window.innerWidth],
                opacity: [0, 1, 0],
                transition: {
                  duration: duration * 0.8,
                  delay: star.delay,
                  ease: "linear"
                }
              }}
            />
          ))}

          {/* Texto de transición */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              transition: { 
                duration: duration,
                times: [0, 0.2, 0.8]
              }
            }}
          >
            <h2 className="text-crema terminal-text text-4xl">NAVEGANDO</h2>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SpaceTransition; 