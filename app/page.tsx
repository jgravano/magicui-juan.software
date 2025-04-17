"use client";

import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";

// Definición de temas actualizados inspirados en diseño modernista y Bauhaus
const themes = [
  {
    name: "default",
    primaryColor: "#4F67B1", // Azul Play Blue
    secondaryColor: "#FFD7B9", // Nude Stone
    backgroundColor: "#F9F7F4", // Fondo casi blanco
    textColor: "#222222", // Casi negro
    label: "Modernista"
  },
  {
    name: "bauhaus",
    primaryColor: "#0A7E3D", // Verde Bauhaus
    secondaryColor: "#0A2E1D", // Verde oscuro
    backgroundColor: "#F4F2E6", // Beige claro
    textColor: "#131313", // Negro puro
    label: "Bauhaus"
  },
  {
    name: "riso",
    primaryColor: "#FF4F4F", // Rojo Riso
    secondaryColor: "#0065E3", // Azul Riso
    backgroundColor: "#FFF9EA", // Blanco cálido
    textColor: "#000000", // Negro puro
    label: "Riso"
  },
  {
    name: "space",
    primaryColor: "#95D30A", // Verde brillante
    secondaryColor: "#FF5C1B", // Naranja vivo
    backgroundColor: "#121212", // Negro profundo
    textColor: "#FFFFFF", // Blanco
    label: "Space Age"
  },
  {
    name: "archi",
    primaryColor: "#4F67B1", // Azul Play Blue
    secondaryColor: "#B44B28", // Terracota
    backgroundColor: "#FFD7B9", // Nude Stone
    textColor: "#383838", // Gris oscuro
    label: "Arquitectura"
  }
];

export default function Home() {
  const [isHovering, setIsHovering] = useState("");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const cursorPosition = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);
  
  // Función para actualizar la posición del cursor con suavizado
  const updateCursorPosition = useCallback(() => {
    if (!cursorRef.current || !cursorDotRef.current) return;

    // Implementación de LERP (Linear Interpolation)
    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    // Suavizado del movimiento
    cursorPosition.current.x = lerp(cursorPosition.current.x, mousePosition.current.x, 0.1);
    cursorPosition.current.y = lerp(cursorPosition.current.y, mousePosition.current.y, 0.1);

    // Aplicar posición al cursor
    cursorRef.current.style.transform = `translate3d(${cursorPosition.current.x}px, ${cursorPosition.current.y}px, 0) translate(-50%, -50%)`;
    
    // Actualizar el círculo interno con un suavizado más intenso para generar un efecto de arrastre
    cursorDotRef.current.style.transform = `translate3d(${lerp(cursorPosition.current.x, mousePosition.current.x, 0.15)}px, ${lerp(cursorPosition.current.y, mousePosition.current.y, 0.15)}px, 0) translate(-50%, -50%)`;

    // Continuar la animación
    animationRef.current = requestAnimationFrame(updateCursorPosition);
  }, []);
  
  // Efecto para cargar el tema inicial y configurar el cursor
  useEffect(() => {
    setMounted(true);
    
    // Event listeners para el cursor
    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY };
      
      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(updateCursorPosition);
      }
      
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '1';
      }
    };
    
    const handleMouseLeave = () => {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '0';
      }
    };
    
    const handleMouseEnter = () => {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '1';
      }
    };
    
    // Configurar cursor personalizado
    document.documentElement.classList.add('custom-cursor');
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    
    // Seleccionar tema aleatorio al inicio si no hay uno guardado
    if (!localStorage.getItem("selectedTheme")) {
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      setTheme(randomTheme.name);
    }
    
    return () => {
      document.documentElement.classList.remove('custom-cursor');
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [updateCursorPosition, setTheme]);

  // No renderizar nada hasta que esté montado el componente
  if (!mounted) return null;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--background)] text-[var(--text)]">
      {/* Cursor personalizado - diseño modernista y geométrico */}
      <div 
        ref={cursorRef} 
        className="fixed pointer-events-none z-50 opacity-0 transition-opacity duration-300 ease-in-out"
        style={{ 
          transform: 'translate(-50%, -50%)',
          willChange: 'transform, width, height',
        }}
      >
        <div 
          className={`transition-all duration-200 ease-out ${
            isHovering ? "w-12 h-12" : "w-4 h-4"
          } flex items-center justify-center`}
          style={{
            backgroundColor: isHovering.startsWith("theme-") 
              ? 'var(--primary)' 
              : isHovering === "github" 
                ? 'var(--primary)'
                : isHovering === "linkedin"
                  ? 'var(--secondary)'
                  : 'var(--text)',
            borderRadius: isHovering ? '2px' : '50%',
            mixBlendMode: theme === 'space' ? 'difference' : 'normal',
          }}
        >
          <div 
            ref={cursorDotRef}
            className="absolute bg-[var(--background)]"
            style={{
              width: isHovering ? '4px' : '2px',
              height: isHovering ? '4px' : '2px',
              opacity: 0.9,
              position: 'absolute',
              top: '50%',
              left: '50%',
              borderRadius: '50%',
              willChange: 'transform',
            }}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <main className="relative h-full flex flex-col justify-center items-center">
        {/* Grilla geométrica de fondo inspirada en Bauhaus */}
        <div className="fixed inset-0 z-0 opacity-5">
          <div className="grid grid-cols-6 h-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border-r border-[var(--text)]" />
            ))}
          </div>
          <div className="grid grid-rows-6 h-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border-b border-[var(--text)]" />
            ))}
          </div>
        </div>

        {/* Contenido central */}
        <div className="relative z-10 flex flex-col items-center justify-center px-4 space-y-24">
          {/* Logo/Marca - estilo tipográfico Bauhaus */}
          <div className={`text-center transition-transform duration-300 hover:scale-105 fade-in ${
             theme === 'Bauhaus' ? 'mt-2' : 
             theme === 'Midcentury' ? 'mt-4' : 
             theme === 'Terminal' ? 'mt-6' : 
             theme === 'Dopamine' ? 'mt-4' : 
             theme === 'Neobrutal' ? 'mt-8 neobrutal-logo' : ''
           }`}
           data-magnetic="true"
           onMouseEnter={() => setIsHovering("logo")}
           onMouseLeave={() => setIsHovering("")}>
            <h1 className="font-syne text-5xl md:text-8xl font-bold tracking-tight">
              <span className="text-[var(--primary)]">juan</span>
              <span className="text-[var(--text)]">.</span>
              <span className="text-[var(--secondary)]">software</span>
            </h1>
          </div>
          
          {/* Links con estilo minimalista y geométrico */}
          <div className="flex space-x-8 md:space-x-16 fade-in" style={{ animationDelay: "0.2s" }}>
            <a href="https://github.com/jgravano" 
               target="_blank" 
               rel="noopener noreferrer"
               data-magnetic="true"
               onMouseEnter={() => setIsHovering("github")}
               onMouseLeave={() => setIsHovering("")}
               className={`relative group ${theme === 'Midcentury' ? 'rounded-md px-1' : ''}`}>
              <span className="block p-4 text-xl transition-all duration-300 group-hover:text-[var(--primary)]">
                GitHub
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--primary)] transition-all duration-300 group-hover:w-full"></span>
            </a>
            
            <a href="https://linkedin.com/in/juan-gravano" 
               target="_blank" 
               rel="noopener noreferrer"
               data-magnetic="true"
               onMouseEnter={() => setIsHovering("linkedin")}
               onMouseLeave={() => setIsHovering("")}
               className="relative group">
              <span className="block p-4 text-xl transition-all duration-300 group-hover:text-[var(--secondary)]">
                LinkedIn
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--secondary)] transition-all duration-300 group-hover:w-full"></span>
            </a>
            
            <a href="mailto:contacto@juan.software" 
               data-magnetic="true"
               onMouseEnter={() => setIsHovering("email")}
               onMouseLeave={() => setIsHovering("")}
               className="relative group">
              <span className="block p-4 text-xl transition-all duration-300 group-hover:text-[var(--text)]">
                Email
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--text)] transition-all duration-300 group-hover:w-full"></span>
            </a>
          </div>

          {/* Selector de temas - formas geométricas simples inspiradas en Bauhaus */}
          <div className="w-full max-w-xl px-4 fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex justify-between items-center">
              {themes.map((themeOption) => {
                const isActive = theme === themeOption.name;
                return (
                  <button
                    key={themeOption.name}
                    data-magnetic="true"
                    onClick={() => {
                      setTheme(themeOption.name);
                      localStorage.setItem("selectedTheme", themeOption.name);
                    }}
                    className={`
                      relative flex items-center justify-center ${themeOption.name === 'Bauhaus' ? 'rounded-none' : 
                                                              themeOption.name === 'Neobrutal' ? 'neobrutal-button' : 
                                                              'rounded-full'} w-20 h-20 
                      transition-all duration-500 ease-out
                      ${isActive ? 'shadow-lg scale-110 ring-3 ring-[var(--primary)]' : 'hover:scale-105'}
                    `}
                    style={{
                      backgroundColor: themeOption.backgroundColor,
                      fontFamily: `var(--font-${themeOption.name.toLowerCase().replace(' ', '-')})`
                    }}
                    aria-label={`Cambiar al tema ${themeOption.name}`}
                  >
                    {/* Indicador minimalista para el tema activo */}
                    {theme === themeOption.name && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`
                          ${themeOption.name === 'bauhaus' ? 'w-3 h-3 rounded-none' : 
                             themeOption.name === 'riso' ? 'w-3 h-3 rounded-full' : 
                             themeOption.name === 'space' ? 'w-3 h-3 rounded-tr-[50%]' : 
                             'w-3 h-3 rounded-[25%]'}
                          bg-[var(--background)] opacity-90
                        `}></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Footer con texto minimalista */}
        <footer className="absolute bottom-5 w-full text-center text-xs text-[var(--text-muted)] font-mono fade-in" style={{ animationDelay: "0.6s" }}>
          <div className="px-4 w-full max-w-md mx-auto">
            © {new Date().getFullYear()} | Diseño Modernista
          </div>
        </footer>
      </main>
    </div>
  );
}
