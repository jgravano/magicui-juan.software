'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ContactoContent = () => {
  const [formState, setFormState] = useState({
    nombre: '',
    email: '',
    mensaje: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isError, setIsError] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!formState.nombre || !formState.email || !formState.mensaje) {
      return;
    }
    
    // Simulación de envío
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      // Aquí iría la lógica real de envío
    }, 2000);
  };
  
  return (
    <div className="space-y-12">
      {/* Intro */}
      <motion.div 
        className="bg-negro bg-opacity-70 p-6 rounded-lg border border-celeste"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h3 className="text-2xl font-bold text-celeste mb-4">¡Conectemos!</h3>
        <p className="text-crema">
          Si estás interesado en discutir proyectos, oportunidades de colaboración o 
          simplemente quieres decir hola, no dudes en contactarme. Estoy siempre abierto 
          a nuevas conexiones en el universo digital.
        </p>
      </motion.div>
      
      {/* Formas de contacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          className="bg-negro bg-opacity-70 p-6 rounded-lg border border-celeste"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h4 className="text-xl font-bold text-celeste mb-4">Información de contacto</h4>
          
          <div className="space-y-4">
            <a 
              href="mailto:contacto@juan.software" 
              className="flex items-center space-x-3 text-crema hover:text-celeste transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-celeste bg-opacity-20 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                <svg className="w-5 h-5 text-celeste" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                </svg>
              </div>
              <span>contacto@juan.software</span>
            </a>
            
            <a 
              href="https://linkedin.com/in/juan-gravano" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-3 text-crema hover:text-celeste transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-celeste bg-opacity-20 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                <svg className="w-5 h-5 text-celeste" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.338 16.338H13.67V12.16c0-1-.02-2.285-1.39-2.285-1.39 0-1.601 1.087-1.601 2.21v4.253H8.014v-8.59h2.56v1.174h.035c.358-.674 1.228-1.387 2.528-1.387 2.7 0 3.2 1.778 3.2 4.091v4.712zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"></path>
                </svg>
              </div>
              <span>linkedin.com/in/juan-gravano</span>
            </a>
            
            <a 
              href="https://github.com/jgravano" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-3 text-crema hover:text-celeste transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-celeste bg-opacity-20 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                <svg className="w-5 h-5 text-celeste" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd"></path>
                </svg>
              </div>
              <span>github.com/jgravano</span>
            </a>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-negro bg-opacity-70 p-6 rounded-lg border border-celeste"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h4 className="text-xl font-bold text-celeste mb-4">Ubicación</h4>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-crema">
              <div className="w-10 h-10 rounded-full bg-celeste bg-opacity-20 flex items-center justify-center">
                <svg className="w-5 h-5 text-celeste" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                </svg>
              </div>
              <span>Buenos Aires, Argentina</span>
            </div>
            
            <div className="relative w-full h-40 rounded-lg overflow-hidden mt-4">
              <div className="absolute inset-0 bg-celeste opacity-10"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="pulse-circle bg-celeste"></div>
                <div className="text-celeste font-bold">Buenos Aires</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Formulario de contacto */}
      <motion.div
        className="bg-negro bg-opacity-70 p-6 rounded-lg border border-celeste"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <h4 className="text-xl font-bold text-celeste mb-6">Envíame un mensaje</h4>
        
        {isSubmitted ? (
          <motion.div 
            className="text-center py-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-4xl mb-4">🚀</div>
            <h5 className="text-xl text-celeste font-bold mb-2">¡Mensaje enviado!</h5>
            <p className="text-crema">
              Gracias por ponerte en contacto. Te responderé lo antes posible.
            </p>
            <button
              className="mt-6 px-6 py-2 bg-celeste text-negro font-bold rounded-lg hover:bg-opacity-90 transition-all"
              onClick={() => setIsSubmitted(false)}
            >
              Enviar otro mensaje
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-crema mb-2">Nombre</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formState.nombre}
                onChange={handleInputChange}
                className="w-full bg-negro bg-opacity-50 border border-celeste border-opacity-50 rounded-lg px-4 py-2 text-crema focus:border-celeste focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-crema mb-2">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formState.email}
                onChange={handleInputChange}
                className="w-full bg-negro bg-opacity-50 border border-celeste border-opacity-50 rounded-lg px-4 py-2 text-crema focus:border-celeste focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label htmlFor="mensaje" className="block text-crema mb-2">Mensaje</label>
              <textarea
                id="mensaje"
                name="mensaje"
                value={formState.mensaje}
                onChange={handleInputChange}
                rows={5}
                className="w-full bg-negro bg-opacity-50 border border-celeste border-opacity-50 rounded-lg px-4 py-2 text-crema focus:border-celeste focus:outline-none transition-colors"
                required
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-celeste text-negro font-bold rounded-lg hover:bg-opacity-90 transition-all flex items-center space-x-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-negro" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Enviar mensaje</span>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
      
      {/* Elementos decorativos */}
      <div className="absolute top-40 right-10 opacity-20">
        <div className="w-32 h-32 rounded-full border-2 border-dashed animate-spin-slow border-celeste"></div>
      </div>
      <div className="absolute bottom-40 left-10 opacity-20">
        <div className="w-16 h-16 rounded-full border border-celeste animate-pulse"></div>
      </div>
    </div>
  );
};

export default ContactoContent; 