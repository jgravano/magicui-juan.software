'use client';

import React from 'react';
import { motion } from 'framer-motion';

const skills = [
  { name: 'QA Engineering', level: 90, color: 'bg-menta' },
  { name: 'Automatización', level: 85, color: 'bg-coral' },
  { name: 'Frontend', level: 80, color: 'bg-celeste' },
  { name: 'Diseño UI/UX', level: 70, color: 'bg-mostaza' },
  { name: 'Backend', level: 65, color: 'bg-coral' },
];

const SobreMiContent = () => {
  return (
    <div className="space-y-12">
      {/* Bio principal */}
      <motion.div 
        className="bg-negro bg-opacity-70 p-6 rounded-lg border border-menta"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h3 className="text-2xl font-bold text-menta mb-4">¿Quién soy?</h3>
        <p className="text-crema mb-4">
          Soy un QA Engineer con experiencia en automatización y desarrollo de soluciones 
          creativas. Mi objetivo es combinar la precisión técnica con la innovación, creando 
          experiencias digitales que sean tanto funcionales como estéticamente agradables.
        </p>
        <p className="text-crema">
          Con base en Buenos Aires, mi enfoque combina metodologías de calidad rigurosas 
          con una mentalidad creativa, permitiéndome diseñar soluciones que no solo funcionan 
          correctamente, sino que también sorprenden y deleitan a los usuarios.
        </p>
      </motion.div>

      {/* Habilidades */}
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <h3 className="text-2xl font-bold text-menta">Habilidades</h3>
        <div className="space-y-4">
          {skills.map((skill, index) => (
            <motion.div 
              key={skill.name}
              className="space-y-2"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + (index * 0.1), duration: 0.5 }}
            >
              <div className="flex justify-between">
                <span className="text-crema">{skill.name}</span>
                <span className="text-crema opacity-80">{skill.level}%</span>
              </div>
              <div className="h-2 bg-negro bg-opacity-50 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${skill.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.level}%` }}
                  transition={{ delay: 0.6 + (index * 0.1), duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Constelación de intereses */}
      <motion.div
        className="bg-negro bg-opacity-70 p-6 rounded-lg border border-menta"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <h3 className="text-2xl font-bold text-menta mb-4">Intereses</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { name: 'Tecnología', icon: '💻' },
            { name: 'Diseño', icon: '🎨' },
            { name: 'Música', icon: '🎵' },
            { name: 'Fotografía', icon: '📷' },
            { name: 'Viajes', icon: '✈️' },
            { name: 'Cine', icon: '🎬' },
          ].map((interest, index) => (
            <motion.div 
              key={interest.name}
              className="bg-negro bg-opacity-50 p-4 rounded-lg border border-menta border-opacity-30 text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7 + (index * 0.1), duration: 0.5 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            >
              <div className="text-2xl mb-2">{interest.icon}</div>
              <div className="text-crema text-sm">{interest.name}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Frase destacada */}
      <motion.div 
        className="text-center py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <blockquote className="text-xl italic text-menta">
          "La calidad nunca es un accidente; siempre es el resultado de un esfuerzo inteligente."
        </blockquote>
        <p className="text-crema opacity-70 mt-2">— John Ruskin</p>
      </motion.div>
    </div>
  );
};

export default SobreMiContent; 