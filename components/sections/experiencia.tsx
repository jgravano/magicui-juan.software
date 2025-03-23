'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const experiencias = [
  {
    id: 'exp1',
    empresa: 'Tech Solutions',
    puesto: 'QA Lead Engineer',
    periodo: '2021 - Presente',
    descripcion: 'Liderazgo del equipo de QA, implementación de estrategias de automatización y mejora continua de procesos de calidad.',
    logros: [
      'Reducción del tiempo de ciclo de testing en un 30%',
      'Implementación de CI/CD pipeline para pruebas automatizadas',
      'Desarrollo de framework de automatización modular y escalable',
    ],
    tecnologias: ['Java', 'Selenium', 'Jenkins', 'Docker', 'Git'],
    color: 'mostaza',
  },
  {
    id: 'exp2',
    empresa: 'Digital Innovation',
    puesto: 'QA Engineer',
    periodo: '2018 - 2021',
    descripcion: 'Responsable de la automatización de pruebas y aseguramiento de calidad en aplicaciones web y móviles.',
    logros: [
      'Diseño de estrategia de pruebas para aplicaciones móviles híbridas',
      'Implementación de pruebas de rendimiento y carga',
      'Colaboración estrecha con equipos de desarrollo para promover calidad desde el inicio',
    ],
    tecnologias: ['Python', 'Appium', 'REST Assured', 'JMeter'],
    color: 'menta',
  },
  {
    id: 'exp3',
    empresa: 'CreativeTech',
    puesto: 'Frontend Developer',
    periodo: '2016 - 2018',
    descripcion: 'Desarrollo de interfaces de usuario y experiencias interactivas para aplicaciones web.',
    logros: [
      'Implementación de sistema de diseño unificado',
      'Optimización de rendimiento de aplicaciones React',
      'Desarrollo de visualizaciones de datos interactivas',
    ],
    tecnologias: ['React', 'JavaScript', 'CSS', 'D3.js'],
    color: 'celeste',
  },
  {
    id: 'exp4',
    empresa: 'StartupLab',
    puesto: 'Desarrollador Full Stack Junior',
    periodo: '2014 - 2016',
    descripcion: 'Desarrollo de aplicaciones web fullstack para startups en etapa temprana.',
    logros: [
      'Implementación de MVPs para tres startups diferentes',
      'Desarrollo de sistema de autenticación y autorización',
      'Integración con APIs de pago y servicios externos',
    ],
    tecnologias: ['Node.js', 'MongoDB', 'Angular', 'Express'],
    color: 'coral',
  },
];

const ExperienciaContent = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };
  
  return (
    <div className="space-y-8">
      {/* Introducción */}
      <motion.div 
        className="bg-negro bg-opacity-70 p-6 rounded-lg border border-mostaza"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h3 className="text-2xl font-bold text-mostaza mb-4">Mi trayectoria</h3>
        <p className="text-crema">
          A lo largo de mi carrera, he acumulado experiencia en diferentes roles que 
          me han permitido desarrollar una visión integral del desarrollo de software 
          y el aseguramiento de calidad. Esta línea de tiempo cósmica muestra mi 
          viaje profesional hasta la fecha.
        </p>
      </motion.div>

      {/* Línea de tiempo */}
      <div className="relative pl-8 mt-12">
        {/* Línea vertical */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-mostaza bg-opacity-30" />
        
        {/* Experiencias */}
        {experiencias.map((exp, index) => (
          <motion.div 
            key={exp.id}
            className="mb-16 relative"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + (index * 0.1), duration: 0.6 }}
          >
            {/* Círculo en la línea de tiempo */}
            <div className={`absolute -left-[25px] top-0 w-[25px] h-[25px] rounded-full bg-${exp.color} border-2 border-negro z-10`} />
            
            {/* Conector */}
            <div className={`absolute -left-[12px] top-[25px] w-[12px] h-[2px] bg-${exp.color}`} />
            
            {/* Contenido */}
            <motion.div 
              className={`bg-negro bg-opacity-80 p-6 rounded-lg border border-${exp.color} cursor-pointer`}
              whileHover={{ scale: 1.02 }}
              onClick={() => toggleExpand(exp.id)}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className={`text-xl font-bold text-${exp.color}`}>{exp.puesto}</h4>
                <span className="text-crema opacity-70 text-sm">{exp.periodo}</span>
              </div>
              <p className="text-crema font-medium mb-4">{exp.empresa}</p>
              <p className="text-crema opacity-80 mb-4">{exp.descripcion}</p>
              
              {/* Contenido expandido */}
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ 
                  height: expandedId === exp.id ? 'auto' : 0,
                  opacity: expandedId === exp.id ? 1 : 0 
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  <h5 className="text-crema font-bold mb-2">Logros principales:</h5>
                  <ul className="list-disc list-inside space-y-1 text-crema opacity-80 mb-4">
                    {exp.logros.map((logro, i) => (
                      <li key={i}>{logro}</li>
                    ))}
                  </ul>
                  
                  <h5 className="text-crema font-bold mb-2">Tecnologías:</h5>
                  <div className="flex flex-wrap gap-2">
                    {exp.tecnologias.map(tech => (
                      <span 
                        key={tech} 
                        className={`px-2 py-1 rounded-full text-xs bg-${exp.color} bg-opacity-20 text-${exp.color}`}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
              
              {/* Indicador de expandir/colapsar */}
              <div className="flex justify-center mt-4">
                <button className={`text-${exp.color} focus:outline-none`}>
                  {expandedId === exp.id ? 
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg> : 
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        ))}
        
        {/* Punto final */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <div className="absolute -left-[25px] top-0 w-[25px] h-[25px] rounded-full bg-mostaza border-2 border-negro z-10" />
          <div className="ml-2 text-mostaza font-bold">HOY</div>
        </motion.div>
      </div>
      
      {/* Sección de educación */}
      <motion.div 
        className="bg-negro bg-opacity-70 p-6 rounded-lg border border-mostaza mt-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <h3 className="text-2xl font-bold text-mostaza mb-4">Educación</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-crema font-bold">Ingeniería en Sistemas</h4>
              <p className="text-crema opacity-70">Universidad de Buenos Aires</p>
            </div>
            <span className="text-crema opacity-70">2010 - 2014</span>
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-crema font-bold">Especialización en QA & Testing</h4>
              <p className="text-crema opacity-70">Instituto Tecnológico de Software</p>
            </div>
            <span className="text-crema opacity-70">2017</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExperienciaContent; 