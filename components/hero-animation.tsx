'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface HeroContainerProps {
  children: ReactNode;
  className?: string;
}

export const HeroContainer: React.FC<HeroContainerProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const HeroTitle: React.FC<HeroContainerProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const HeroContent: React.FC<HeroContainerProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const HeroImage: React.FC<HeroContainerProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, duration: 1, type: "spring" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}; 