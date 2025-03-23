'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Definir las secciones disponibles en el universo
export type UniverseSection = 'sobre-mi' | 'proyectos' | 'experiencia' | 'contacto';

interface SectionConfig {
  id: UniverseSection;
  title: string;
  description: string;
  color: 'coral' | 'mostaza' | 'menta' | 'celeste';
  position: { x: number; y: number };
  size: number;
}

interface UniverseMapProps {
  onNavigate: (section: UniverseSection) => void;
  activeSection?: UniverseSection | null;
}

const UniverseMap: React.FC<UniverseMapProps> = ({ 
  onNavigate,
  activeSection = null
}) => {
  const [hoveredSection, setHoveredSection] = useState<UniverseSection | null>(null);

  // Configuración de las secciones del universo
  const sections: SectionConfig[] = [
    {
      id: 'sobre-mi',
      title: 'SOBRE MÍ',
      description: 'Planeta Personal: mi perfil, habilidades y pasiones',
      color: 'menta',
      position: { x: 20, y: 20 },
      size: 100
    },
    {
      id: 'proyectos',
      title: 'PROYECTOS',
      description: 'Estación Espacial: colección de mis trabajos y experimentos',
      color: 'coral',
      position: { x: 70, y: 30 },
      size: 120
    },
    {
      id: 'experiencia',
      title: 'EXPERIENCIA',
      description: 'Línea Temporal: mi trayectoria profesional',
      color: 'mostaza',
      position: { x: 25, y: 70 },
      size: 90
    },
    {
      id: 'contacto',
      title: 'CONTACTO',
      description: 'Centro de Comunicaciones: conecta conmigo',
      color: 'celeste',
      position: { x: 75, y: 75 },
      size: 80
    }
  ];

  return (
    <div className="relative w-full h-full min-h-[80vh] overflow-hidden bg-negro rounded-lg border-2 border-negro">
      {/* Fondo con estrellas */}
      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 100 }).map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 bg-crema rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.3,
              animation: `pulse ${Math.random() * 3 + 2}s infinite alternate`
            }}
          />
        ))}
      </div>

      {/* Título del mapa */}
      <div className="absolute top-4 left-4 z-10">
        <h2 className="text-crema terminal-text text-xl">MAPA DEL UNIVERSO</h2>
        <p className="text-crema terminal-text text-sm opacity-70">Selecciona un destino para navegar</p>
      </div>

      {/* Secciones del universo */}
      {sections.map((section) => (
        <motion.div
          key={section.id}
          className={`absolute cursor-pointer flex items-center justify-center rounded-full
                     border-2 border-negro bg-${section.color} preserve-3d`}
          style={{
            left: `${section.position.x}%`,
            top: `${section.position.y}%`,
            width: `${section.size}px`,
            height: `${section.size}px`,
            transform: 'translateX(-50%) translateY(-50%)'
          }}
          animate={{
            scale: activeSection === section.id ? 1.2 : 
                  hoveredSection === section.id ? 1.1 : 1,
            boxShadow: activeSection === section.id ? '0 0 30px rgba(255,255,255,0.5)' : 
                      hoveredSection === section.id ? '0 0 20px rgba(255,255,255,0.3)' : '0 0 0px rgba(0,0,0,0)'
          }}
          onMouseEnter={() => setHoveredSection(section.id)}
          onMouseLeave={() => setHoveredSection(null)}
          onClick={() => onNavigate(section.id)}
          whileHover={{ rotate: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="sr-only">{section.title}</span>
        </motion.div>
      ))}

      {/* Líneas de conexión entre secciones */}
      <svg className="absolute inset-0 w-full h-full z-0 opacity-30" xmlns="http://www.w3.org/2000/svg">
        <line 
          x1={`${sections[0].position.x}%`} 
          y1={`${sections[0].position.y}%`} 
          x2={`${sections[1].position.x}%`} 
          y2={`${sections[1].position.y}%`} 
          stroke="#FEFAE0" 
          strokeWidth="1" 
          strokeDasharray="5,5" 
        />
        <line 
          x1={`${sections[1].position.x}%`} 
          y1={`${sections[1].position.y}%`} 
          x2={`${sections[3].position.x}%`} 
          y2={`${sections[3].position.y}%`} 
          stroke="#FEFAE0" 
          strokeWidth="1" 
          strokeDasharray="5,5" 
        />
        <line 
          x1={`${sections[3].position.x}%`} 
          y1={`${sections[3].position.y}%`} 
          x2={`${sections[2].position.x}%`} 
          y2={`${sections[2].position.y}%`} 
          stroke="#FEFAE0" 
          strokeWidth="1" 
          strokeDasharray="5,5" 
        />
        <line 
          x1={`${sections[2].position.x}%`} 
          y1={`${sections[2].position.y}%`} 
          x2={`${sections[0].position.x}%`} 
          y2={`${sections[0].position.y}%`} 
          stroke="#FEFAE0" 
          strokeWidth="1" 
          strokeDasharray="5,5" 
        />
      </svg>

      {/* Panel con información de la sección */}
      {hoveredSection && (
        <motion.div 
          className="absolute bottom-4 left-4 bg-negro border-2 border-crema p-4 rounded-md z-20 max-w-xs text-crema"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="text-lg font-bold mb-1 terminal-text">
            {sections.find(s => s.id === hoveredSection)?.title}
          </h3>
          <p className="text-sm terminal-text opacity-80">
            {sections.find(s => s.id === hoveredSection)?.description}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default UniverseMap; 