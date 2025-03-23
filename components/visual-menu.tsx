'use client';

import React from 'react';
import { motion } from 'framer-motion';

type VisualMenuItem = {
  id: string;
  title: string;
  description: string;
  color: 'coral' | 'mostaza' | 'menta' | 'celeste';
  icon: React.ReactNode;
};

interface VisualMenuProps {
  items: VisualMenuItem[];
  onItemClick: (itemId: string) => void;
}

export default function VisualMenu({ items, onItemClick }: VisualMenuProps) {
  return (
    <motion.div
      className="visual-menu"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="visual-menu-header">
        <h3 className="visual-menu-title">Explora mi universo</h3>
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-coral border border-negro"></div>
          <div className="w-3 h-3 rounded-full bg-mostaza border border-negro"></div>
          <div className="w-3 h-3 rounded-full bg-menta border border-negro"></div>
        </div>
      </div>
      
      <div className="space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            className={`visual-menu-item visual-menu-item-${item.color}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => onItemClick(item.id)}
          >
            <div className="visual-menu-icon">
              {item.icon}
            </div>
            <div>
              <div className="visual-menu-text font-bold text-negro">{item.title}</div>
              <div className="text-sm font-medium text-negro opacity-80">{item.description}</div>
            </div>
            <div className="ml-auto">
              <svg
                className="w-5 h-5 text-negro"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="absolute -bottom-6 -right-6 w-32 h-32">
        <div className="circle-decoration bg-mostaza absolute top-10 right-20 opacity-50 animate-pulse-slow"></div>
        <div className="circle-decoration bg-menta absolute bottom-5 right-5 opacity-50 animate-pulse-slow animation-delay-2000"></div>
      </div>
    </motion.div>
  );
} 