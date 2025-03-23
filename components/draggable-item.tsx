'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface DraggableItemProps {
  children: React.ReactNode;
  onDragEnd?: (dropZone: string | null) => void;
  dropZones?: {id: string, x: number, y: number, width: number, height: number}[];
  constraintsRef?: React.RefObject<HTMLElement>;
  className?: string;
}

export default function DraggableItem({
  children,
  onDragEnd,
  dropZones = [],
  constraintsRef,
  className = ''
}: DraggableItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [currentDropZone, setCurrentDropZone] = useState<string | null>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useTransform(
    [isDragging, !!currentDropZone], 
    [[false, false], [true, false], [true, true]], 
    [1, 1.05, 1.1]
  );
  
  const checkDropZones = () => {
    const itemX = x.get();
    const itemY = y.get();
    
    for (const zone of dropZones) {
      if (
        itemX > zone.x - 50 && 
        itemX < zone.x + zone.width - 50 &&
        itemY > zone.y - 50 && 
        itemY < zone.y + zone.height - 50
      ) {
        return zone.id;
      }
    }
    
    return null;
  };
  
  const handleDragStart = () => {
    setIsDragging(true);
  };
  
  const handleDrag = () => {
    const zone = checkDropZones();
    setCurrentDropZone(zone);
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd && onDragEnd(currentDropZone);
    setCurrentDropZone(null);
    
    // Reiniciar posición si no se soltó en ninguna zona
    if (!currentDropZone) {
      x.set(0);
      y.set(0);
    }
  };

  return (
    <motion.div
      className={`cursor-grab active:cursor-grabbing ${className}`}
      drag
      dragConstraints={constraintsRef}
      dragElastic={0.1}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={{ scale }}
      style={{ x, y }}
      whileTap={{ cursor: 'grabbing' }}
    >
      <div className={`border-2 ${currentDropZone ? 'border-mostaza' : 'border-negro'} transition-colors duration-300`}>
        {children}
      </div>
    </motion.div>
  );
} 