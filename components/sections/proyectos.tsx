'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const proyectos = [
  {
    id: 'proyecto1',
    titulo: 'Automatización de pruebas',
    subtitulo: 'Framework modular de testing',
    descripcion: 'Desarrollo de una arquitectura modular para automatización de pruebas que permitió reducir el tiempo de ejecución en un 40% y mejorar la cobertura de pruebas.',
    tecnologias: ['Java', 'Selenium', 'TestNG', 'Docker'],
    imagen: '🧪',
    color: 'coral',
  },
  {
    id: 'proyecto2',
    titulo: 'Visualización de datos',
    subtitulo: 'Dashboard interactivo',
    descripcion: 'Creación de un dashboard para visualización de métricas de calidad en tiempo real, permitiendo a equipos detectar y resolver problemas de forma proactiva.',
    tecnologias: ['React', 'D3.js', 'Node.js', 'GraphQL'],
    imagen: '📊',
    color: 'menta',
  },
  {
    id: 'proyecto3',
    titulo: 'Sitio web personal',
    subtitulo: 'Concepto de universo interactivo',
    descripcion: 'Diseño y desarrollo de un sitio web personal con estética espacial y navegación interactiva, implementando animaciones avanzadas y efectos visuales.',
    tecnologias: ['Next.js', 'TypeScript', 'Framer Motion', 'Tailwind CSS'],
    imagen: '🚀',
    color: 'celeste',
  },
  {
    id: 'proyecto4',
    titulo: 'Herramienta de colaboración',
    subtitulo: 'Plataforma para equipos de QA',
    descripcion: 'Desarrollo de una plataforma para facilitar la colaboración entre equipos de QA, incluyendo gestión de casos de prueba y reporte de resultados.',
    tecnologias: ['Vue.js', 'Firebase', 'Express', 'MongoDB'],
    imagen: '👥',
    color: 'mostaza',
  },
];

const ProyectosContent = () => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleSelectProject = (id: string) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    if (selectedProject === id) {
      setSelectedProject(null);
      setTimeout(() => setIsAnimating(false), 500);
    } else {
      setSelectedProject(id);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };
  
  const findProject = (id: string) => proyectos.find(p => p.id === id);
  
  return (
    <div className="space-y-8">
      {/* Introducción */}
      <motion.div 
        className="bg-negro bg-opacity-70 p-6 rounded-lg border border-coral"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h3 className="text-2xl font-bold text-coral mb-4">Mis proyectos</h3>
        <p className="text-crema">
          Aquí encontrarás una selección de proyectos en los que he trabajado. 
          Cada uno representa un desafío único que me permitió aplicar y expandir mis 
          habilidades en diferentes áreas de la tecnología.
        </p>
      </motion.div>

      {/* Grid de proyectos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {proyectos.map((proyecto, index) => (
          <motion.div
            key={proyecto.id}
            className={`bg-negro bg-opacity-80 border border-${proyecto.color} rounded-lg overflow-hidden cursor-pointer transform transition-all duration-300`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + (index * 0.1), duration: 0.5 }}
            whileHover={{ scale: 1.03 }}
            onClick={() => handleSelectProject(proyecto.id)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className={`text-xl font-bold text-${proyecto.color}`}>{proyecto.titulo}</h4>
                <div className="text-3xl">{proyecto.imagen}</div>
              </div>
              <p className="text-crema opacity-80 text-sm mb-3">{proyecto.subtitulo}</p>
              <p className="text-crema text-sm mb-4">{
                selectedProject === proyecto.id 
                  ? proyecto.descripcion 
                  : `${proyecto.descripcion.substring(0, 100)}...`
              }</p>
              <div className="flex flex-wrap gap-2">
                {proyecto.tecnologias.map(tech => (
                  <span 
                    key={tech} 
                    className={`px-2 py-1 rounded-full text-xs bg-${proyecto.color} bg-opacity-20 text-${proyecto.color}`}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Proyecto detallado (modal) */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-negro bg-opacity-90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => handleSelectProject(selectedProject)}
          >
            <motion.div
              className={`w-full max-w-2xl bg-negro p-8 rounded-lg border-2 border-${findProject(selectedProject)?.color}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className={`text-2xl font-bold text-${findProject(selectedProject)?.color}`}>
                    {findProject(selectedProject)?.titulo}
                  </h3>
                  <p className="text-crema opacity-80">{findProject(selectedProject)?.subtitulo}</p>
                </div>
                <div className="text-5xl">{findProject(selectedProject)?.imagen}</div>
              </div>
              
              <p className="text-crema mb-6">{findProject(selectedProject)?.descripcion}</p>
              
              <div className="mb-6">
                <h4 className="text-crema font-bold mb-2">Tecnologías utilizadas:</h4>
                <div className="flex flex-wrap gap-2">
                  {findProject(selectedProject)?.tecnologias.map(tech => (
                    <span 
                      key={tech} 
                      className={`px-3 py-1 rounded-full text-sm bg-${findProject(selectedProject)?.color} bg-opacity-20 text-${findProject(selectedProject)?.color}`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  className={`px-4 py-2 rounded-lg bg-${findProject(selectedProject)?.color} text-negro font-bold`}
                  onClick={() => handleSelectProject(selectedProject)}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Llamada a la acción */}
      <motion.div 
        className="text-center py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <p className="text-crema opacity-80 mb-4">¿Interesado en colaborar en un proyecto?</p>
        <a 
          href="#contacto" 
          className="inline-block px-6 py-3 bg-coral text-negro font-bold rounded-lg hover:bg-opacity-90 transition-all"
          onClick={(e) => {
            e.preventDefault();
            // Aquí podrías implementar navegación a la sección de contacto
          }}
        >
          ¡Hablemos de tu idea!
        </a>
      </motion.div>
    </div>
  );
};

export default ProyectosContent; 