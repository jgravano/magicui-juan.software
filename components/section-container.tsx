'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { UniverseSection } from './universe-map';

interface SectionContainerProps {
  children: ReactNode;
  section: UniverseSection;
  isActive: boolean;
  onBack: () => void;
}

const SectionContainer: React.FC<SectionContainerProps> = ({
  children,
  section,
  isActive,
  onBack
}) => {
  // Configuración específica para cada sección
  const sectionConfig = {
    'sobre-mi': {
      title: 'SOBRE MÍ',
      subtitle: 'Planeta Personal',
      color: 'menta',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
        </svg>
      )
    },
    'proyectos': {
      title: 'PROYECTOS',
      subtitle: 'Estación Espacial',
      color: 'coral',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
        </svg>
      )
    },
    'experiencia': {
      title: 'EXPERIENCIA',
      subtitle: 'Línea Temporal',
      color: 'mostaza',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
        </svg>
      )
    },
    'contacto': {
      title: 'CONTACTO',
      subtitle: 'Centro de Comunicaciones',
      color: 'celeste',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
        </svg>
      )
    }
  };

  const config = sectionConfig[section];

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        delay: 0.2,
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0,
      y: -50,
      transition: {
        duration: 0.3
      }
    }
  };

  const elementVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div 
      className={`min-h-screen bg-negro text-crema relative overflow-hidden`}
      initial="hidden"
      animate={isActive ? "visible" : "hidden"}
      exit="exit"
      variants={containerVariants}
    >
      {/* Elementos decorativos temáticos */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i}
            className={`absolute rounded-full bg-${config.color}`}
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2,
              animation: `float ${Math.random() * 10 + 5}s infinite ease-in-out`
            }}
          />
        ))}
      </div>

      {/* Barra de navegación */}
      <motion.header 
        className={`sticky top-0 z-10 bg-negro border-b-2 border-${config.color} py-4 px-6 flex justify-between items-center`}
        variants={elementVariants}
      >
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full bg-${config.color} flex items-center justify-center text-negro mr-4`}>
            {config.icon}
          </div>
          <div>
            <h1 className="text-2xl terminal-text">{config.title}</h1>
            <p className="text-sm terminal-text opacity-70">{config.subtitle}</p>
          </div>
        </div>
        <motion.button 
          className={`px-4 py-2 border-2 border-${config.color} text-${config.color} terminal-text flex items-center space-x-2 hover:bg-${config.color} hover:text-negro transition-colors`}
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>VOLVER AL MAPA</span>
        </motion.button>
      </motion.header>

      {/* Contenido principal de la sección */}
      <main className="container mx-auto py-8 px-4">
        {children}
      </main>

      {/* Indicador de navegación */}
      <motion.div 
        className="fixed bottom-6 right-6 z-10"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <div className={`w-16 h-16 rounded-full bg-${config.color} border-2 border-negro flex items-center justify-center text-negro shadow-lg`}>
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SectionContainer; 