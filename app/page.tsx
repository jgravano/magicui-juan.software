'use client';

import SpaceBackground from '@/components/space-background';
import { UniverseSection } from '@/components/universe-map';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// Importamos componentes específicos para cada sección
import ContactoContent from '@/components/sections/contacto';
import ExperienciaContent from '@/components/sections/experiencia';
import ProyectosContent from '@/components/sections/proyectos';
import SobreMiContent from '@/components/sections/sobre-mi';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<UniverseSection | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Simulamos una carga inicial (como si fuera un "despegue")
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Efecto de parallax para las estrellas
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const backgroundScale = useTransform(scrollYProgress, [0, 1], [1, 1.5]);

  // Colores para cada sección
  const sectionColors = {
    'sobre-mi': 'menta',
    'proyectos': 'coral',
    'experiencia': 'mostaza',
    'contacto': 'celeste'
  };

  // Actualizar sección activa y progreso basado en scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section');
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.scrollY / totalHeight) * 100;

      setScrollProgress(currentProgress);

      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.id as UniverseSection;

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(sectionId);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Variantes de animación para las secciones
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 }
  };

  return (
    <div ref={containerRef} className="relative min-h-screen bg-negro text-crema">
      {/* Fondo con partículas */}
      <div className="fixed inset-0 z-0">
        <motion.div style={{ y: backgroundY, scale: backgroundScale }}>
          <SpaceBackground
            color={activeSection ? sectionColors[activeSection] : 'celeste'}
            density={20}
          />
        </motion.div>
      </div>

      {/* Animación de carga inicial (despegue) */}
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-negro"
        initial={{ opacity: 1 }}
        animate={{ opacity: isLoading ? 1 : 0 }}
        transition={{ duration: 1 }}
        style={{ pointerEvents: isLoading ? 'auto' : 'none' }}
      >
        <motion.div
          className="w-32 h-32 bg-coral rounded-full"
          animate={{
            y: [0, -100, -500],
            scale: [1, 1.2, 0.5],
            opacity: [1, 1, 0]
          }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
        <motion.h1
          className="mt-8 text-4xl terminal-text text-center"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2.5 }}
        >
          INICIANDO VIAJE
          <br />
          <span className="text-xl opacity-70">juan.software</span>
        </motion.h1>
        <motion.div
          className="mt-8 h-2 bg-negro border border-crema w-64 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="h-full bg-crema"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5, ease: "linear" }}
          />
        </motion.div>
      </motion.div>

      {/* Contenido principal */}
      <div className="relative z-10">
        {/* Header fijo */}
        <header className="fixed top-0 left-0 right-0 z-20 bg-negro bg-opacity-50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl terminal-text">juan.software</h1>
            <nav className="flex space-x-6">
              <a href="#sobre-mi" className={`text-sm terminal-text transition-colors ${activeSection === 'sobre-mi' ? 'text-menta' : 'text-crema hover:text-menta'}`}>SOBRE MÍ</a>
              <a href="#proyectos" className={`text-sm terminal-text transition-colors ${activeSection === 'proyectos' ? 'text-coral' : 'text-crema hover:text-coral'}`}>PROYECTOS</a>
              <a href="#experiencia" className={`text-sm terminal-text transition-colors ${activeSection === 'experiencia' ? 'text-mostaza' : 'text-crema hover:text-mostaza'}`}>EXPERIENCIA</a>
              <a href="#contacto" className={`text-sm terminal-text transition-colors ${activeSection === 'contacto' ? 'text-celeste' : 'text-crema hover:text-celeste'}`}>CONTACTO</a>
            </nav>
          </div>
        </header>

        {/* Barra de progreso */}
        <motion.div
          className="fixed left-0 top-0 h-1 bg-crema z-30"
          style={{ width: `${scrollProgress}%` }}
          initial={{ width: 0 }}
        />

        {/* Secciones */}
        <main className="pt-20">
          {/* Intro */}
          <section className="min-h-screen flex items-center justify-center">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <h2 className="text-6xl terminal-text mb-6">BIENVENIDO AL UNIVERSO</h2>
              <p className="text-xl terminal-text opacity-80 max-w-2xl mx-auto mb-12">
                Explora mi universo creativo haciendo scroll para descubrir más sobre mi perfil,
                proyectos, experiencia y formas de contacto.
              </p>
              <motion.div
                className="animate-bounce"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              >
                <svg className="w-8 h-8 mx-auto text-crema" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </motion.div>
            </motion.div>
          </section>

          {/* Secciones principales */}
          <AnimatePresence mode="wait">
            <motion.section
              id="sobre-mi"
              className="min-h-screen py-20"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              exit="exit"
            >
              <div className="container mx-auto px-4">
                <SobreMiContent />
              </div>
            </motion.section>

            <motion.section
              id="proyectos"
              className="min-h-screen py-20"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              exit="exit"
            >
              <div className="container mx-auto px-4">
                <ProyectosContent />
              </div>
            </motion.section>

            <motion.section
              id="experiencia"
              className="min-h-screen py-20"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              exit="exit"
            >
              <div className="container mx-auto px-4">
                <ExperienciaContent />
              </div>
            </motion.section>

            <motion.section
              id="contacto"
              className="min-h-screen py-20"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              exit="exit"
            >
              <div className="container mx-auto px-4">
                <ContactoContent />
              </div>
            </motion.section>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-crema border-opacity-20 py-6">
          <div className="container mx-auto px-4 text-center">
            <p className="terminal-text text-sm opacity-70">
              © {new Date().getFullYear()} juan.software | Diseñado con <span className="text-coral">♥</span> en Buenos Aires
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
