'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface SmoothScrollProps extends Omit<HTMLMotionProps<"a">, "onClick" | "href"> {
  href: string;
  offset?: number;
  duration?: number;
  children: React.ReactNode;
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({
  href,
  offset = 0,
  duration = 1.5,
  children,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Obtener el elemento de destino
    const targetId = href.replace(/.*\#/, '');
    const targetElement = document.getElementById(targetId);

    if (!targetElement) {
      console.warn(`Target element "${targetId}" not found.`);
      return;
    }

    // Comprobar si Lenis está disponible en window
    if (typeof window !== 'undefined' && 'Lenis' in window) {
      // @ts-ignore - Lenis está disponible globalmente desde el script
      const lenis = new window.Lenis.default({
        duration: duration,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
      });

      // Calcular la posición de desplazamiento
      const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY + offset;

      // Animar el desplazamiento usando Lenis
      lenis.scrollTo(targetPosition);

      // Limpiar la instancia después de la animación
      setTimeout(() => {
        lenis.destroy();
      }, duration * 1000 + 100);
    } else {
      // Fallback para navegadores sin Lenis
      const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <motion.a 
      href={href} 
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {children}
    </motion.a>
  );
}; 