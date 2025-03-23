'use client';

import React, { ReactNode } from 'react';
import { motion, MotionProps } from 'framer-motion';

interface AnimatedSectionProps extends MotionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  delay?: number;
}

export function AnimatedSection({
  children,
  className = '',
  id,
  delay = 0,
  ...motionProps
}: AnimatedSectionProps) {
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.8 }}
      viewport={{ once: true }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedText({
  children,
  className = '',
  delay = 0,
  ...motionProps
}: AnimatedSectionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.6 }}
      viewport={{ once: true }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCard({
  children,
  className = '',
  delay = 0,
  ...motionProps
}: AnimatedSectionProps) {
  return (
    <motion.div
      className={`glassmorphism-card p-6 rounded-lg h-full transform-gpu group-hover:scale-[1.02] transition-all duration-500 ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.7 }}
      viewport={{ once: true }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
} 