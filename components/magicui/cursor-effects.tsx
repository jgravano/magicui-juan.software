import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';

interface CursorEffectsProps {
  children: React.ReactNode;
}

export const CursorEffects: React.FC<CursorEffectsProps> = ({ children }) => {
  const { theme } = useTheme();
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const trailsRef = useRef<HTMLDivElement>(null);
  const [cursorText, setCursorText] = useState<string>("");
  const [cursorVariant, setCursorVariant] = useState<string>("default");
  const [trailElements, setTrailElements] = useState<HTMLDivElement[]>([]);
  const mousePosition = useRef({ x: 0, y: 0 });
  const cursorPosition = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);
  const magneticElements = useRef<HTMLElement[]>([]);
  
  // Colores y estilos según el tema
  const getCursorStyles = () => {
    switch(theme) {
      case 'Bauhaus':
        return {
          color: '#e30613',
          trailColor: 'rgba(227, 6, 19, 0.2)',
          ringSize: '30px',
          dotSize: '6px',
          trailShape: 'square' // cuadrado para Bauhaus
        };
      case 'Midcentury':
        return {
          color: '#d96b44',
          trailColor: 'rgba(217, 107, 68, 0.2)',
          ringSize: '32px',
          dotSize: '6px',
          trailShape: 'circle' // círculos para Midcentury
        };
      case 'Dopamine':
        return {
          color: '#ff5757',
          trailColor: 'rgba(255, 87, 87, 0.3)',
          ringSize: '35px',
          dotSize: '8px',
          trailShape: 'star' // estrellas para Dopamine
        };
      case 'Terminal':
        return {
          color: '#00b894',
          trailColor: 'rgba(0, 184, 148, 0.2)',
          ringSize: '28px',
          dotSize: '4px',
          trailShape: 'dot' // puntos para Terminal
        };
      case 'Neobrutal':
        return {
          color: '#ff3a5e',
          trailColor: 'rgba(255, 58, 94, 0.25)',
          ringSize: '36px',
          dotSize: '10px',
          trailShape: 'square' // cuadrado para Neobrutal
        };
      default:
        return {
          color: '#000000',
          trailColor: 'rgba(0, 0, 0, 0.2)',
          ringSize: '30px',
          dotSize: '6px',
          trailShape: 'circle'
        };
    }
  };

  // Función para actualizar la posición del cursor con LERP
  const updateCursorPosition = () => {
    if (!cursorRef.current || !cursorRingRef.current || !cursorDotRef.current) return;

    // LERP (Linear Interpolation) para suavizado de movimiento
    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    // Suavizado del movimiento adaptado según el tema
    const lerpFactor = theme === 'Terminal' ? 0.15 : 
                     theme === 'Dopamine' ? 0.08 :
                     theme === 'Neobrutal' ? 0.2 : 0.1;
    
    // Aplicar LERP a la posición del cursor
    cursorPosition.current.x = lerp(cursorPosition.current.x, mousePosition.current.x, lerpFactor);
    cursorPosition.current.y = lerp(cursorPosition.current.y, mousePosition.current.y, lerpFactor);

    // Aplicar la transformación al cursor
    cursorRef.current.style.transform = `translate3d(${cursorPosition.current.x}px, ${cursorPosition.current.y}px, 0) translate(-50%, -50%)`;
    
    // Aplicar transformación al anillo con un retraso diferente para crear efecto de arrastre
    const ringDelay = lerpFactor * 0.8;
    cursorRingRef.current.style.transform = `translate3d(${lerp(cursorPosition.current.x, mousePosition.current.x, ringDelay)}px, ${lerp(cursorPosition.current.y, mousePosition.current.y, ringDelay)}px, 0) translate(-50%, -50%) scale(${cursorVariant === 'hover' ? 1.2 : 1})`;
    
    // Actualizar el punto del cursor con un factor diferente
    const dotDelay = lerpFactor * 1.2;
    cursorDotRef.current.style.transform = `translate3d(${lerp(cursorPosition.current.x, mousePosition.current.x, dotDelay)}px, ${lerp(cursorPosition.current.y, mousePosition.current.y, dotDelay)}px, 0) translate(-50%, -50%)`;

    // Gestionar los efectos de estela (trails)
    updateCursorTrails();

    // Continuar la animación
    animationRef.current = requestAnimationFrame(updateCursorPosition);
  };

  // Función para actualizar las estelas del cursor
  const updateCursorTrails = () => {
    if (!trailsRef.current || trailElements.length === 0) return;
    
    // Actualizar cada elemento de la estela con diferentes retrasos
    trailElements.forEach((trailEl, index) => {
      const delay = 0.04 * (index + 1);
      const x = lerp(parseFloat(trailEl.dataset.x || "0"), mousePosition.current.x, delay);
      const y = lerp(parseFloat(trailEl.dataset.y || "0"), mousePosition.current.y, delay);
      
      // Guardar la nueva posición en el dataset
      trailEl.dataset.x = x.toString();
      trailEl.dataset.y = y.toString();
      
      // Aplicar la nueva posición y opacidad basada en el índice
      trailEl.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      trailEl.style.opacity = (1 - index * 0.15).toString();
    });
  };

  // Función auxiliar de LERP
  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };
  
  // Efecto para el seguimiento del cursor
  useEffect(() => {
    // Crear elementos de estela
    const createTrailElements = () => {
      if (!trailsRef.current) return;
      
      const styles = getCursorStyles();
      const trailCount = theme === 'Dopamine' ? 8 : theme === 'Terminal' ? 6 : 5;
      const newTrails: HTMLDivElement[] = [];
      
      // Limpiar estelas existentes
      trailsRef.current.innerHTML = '';
      
      // Crear nuevas estelas
      for (let i = 0; i < trailCount; i++) {
        const trail = document.createElement('div');
        trail.className = `cursor-trail ${styles.trailShape}`;
        trail.style.width = `${parseInt(styles.dotSize) - i * 0.5}px`;
        trail.style.height = `${parseInt(styles.dotSize) - i * 0.5}px`;
        trail.style.backgroundColor = styles.trailColor;
        trail.style.position = 'absolute';
        trail.style.borderRadius = styles.trailShape === 'circle' ? '50%' : styles.trailShape === 'square' ? '0' : '50%';
        trail.style.pointerEvents = 'none';
        trail.style.zIndex = '9998';
        trail.style.transition = 'opacity 0.2s ease';
        trail.dataset.x = "0";
        trail.dataset.y = "0";
        
        trailsRef.current.appendChild(trail);
        newTrails.push(trail);
      }
      
      setTrailElements(newTrails);
    };

    // Event listeners para el cursor
    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY };
      
      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(updateCursorPosition);
      }
      
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '1';
      }
      
      // Comprobar elementos magnéticos
      checkMagneticElements(e);
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

    // Función para comprobar elementos magnéticos
    const checkMagneticElements = (e: MouseEvent) => {
      magneticElements.current.forEach(element => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        // Distancia al centro del elemento
        const distance = Math.sqrt(x * x + y * y);
        const maxDistance = Math.max(rect.width, rect.height) * 0.8;
        
        // Si está dentro del rango magnético
        if (distance < maxDistance) {
          const magneticPull = 0.4; // Intensidad del efecto magnético
          const moveX = x * magneticPull;
          const moveY = y * magneticPull;
          element.style.transform = `translate(${moveX}px, ${moveY}px)`;
          element.dataset.magnetic = "true";
          
          // Cambiar el cursor al estar sobre un elemento magnético
          setCursorVariant('hover');
        } else if (element.dataset.magnetic === "true") {
          // Restablecer posición cuando sale del rango
          element.style.transform = `translate(0, 0)`;
          element.dataset.magnetic = "false";
          
          // Restablecer cursor si no hay otros elementos magnéticos activos
          if (!magneticElements.current.some(el => el.dataset.magnetic === "true")) {
            setCursorVariant('default');
          }
        }
      });
    };
    
    // Configuración inicial y recolección de elementos magnéticos
    const setupMagneticElements = () => {
      const elements = document.querySelectorAll<HTMLElement>('[data-magnetic="true"]');
      magneticElements.current = Array.from(elements);
      
      // Añadir transición suave a los elementos magnéticos
      magneticElements.current.forEach(element => {
        element.style.transition = 'transform 0.3s ease-out';
        
        // Restablecer al salir
        element.addEventListener('mouseleave', () => {
          element.style.transform = `translate(0, 0)`;
          element.dataset.magnetic = "false";
          setCursorVariant('default');
        });
        
        // Aplicar efecto al entrar
        element.addEventListener('mouseenter', () => {
          setCursorVariant('hover');
        });
      });
    };
    
    // Función para habilitar el cursor personalizado
    const enableCustomCursor = () => {
      document.documentElement.classList.add('custom-cursor');
      createTrailElements();
      setupMagneticElements();
    };
    
    // Inicializar el cursor
    enableCustomCursor();
    
    // Configurar listeners
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    
    // Limpiar al desmontar
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
  }, [theme]); // Reevaluar cuando cambie el tema

  return (
    <>
      <div className="cursor-container">
        {/* Elemento principal del cursor */}
        <div
          ref={cursorRef}
          className={`cursor ${cursorVariant}`}
          style={{
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 9999,
            transform: 'translate(-50%, -50%)',
            mixBlendMode: theme === 'Terminal' ? 'screen' : 'normal',
            transition: 'opacity 0.2s ease, width 0.3s ease, height 0.3s ease, background-color 0.3s ease',
            opacity: 0
          }}
        >
          {/* Anillo exterior */}
          <div
            ref={cursorRingRef}
            className="cursor-ring"
            style={{
              position: 'absolute',
              width: getCursorStyles().ringSize,
              height: getCursorStyles().ringSize,
              borderRadius: theme === 'Bauhaus' || theme === 'Neobrutal' ? '0' : '50%',
              border: `1px solid ${getCursorStyles().color}`,
              opacity: 0.6,
              transition: 'width 0.3s ease, height 0.3s ease, transform 0.1s ease',
              pointerEvents: 'none'
            }}
          />
          
          {/* Punto central */}
          <div
            ref={cursorDotRef}
            className="cursor-dot"
            style={{
              position: 'absolute',
              width: getCursorStyles().dotSize,
              height: getCursorStyles().dotSize,
              backgroundColor: getCursorStyles().color,
              borderRadius: theme === 'Bauhaus' || theme === 'Neobrutal' ? '0' : '50%',
              opacity: 0.8,
              pointerEvents: 'none'
            }}
          />
          
          {/* Texto del cursor (para mostrar textos como "Click", "Drag", etc.) */}
          {cursorText && (
            <div
              className="cursor-text"
              style={{
                position: 'absolute',
                top: '30px',
                left: '10px',
                color: getCursorStyles().color,
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                pointerEvents: 'none'
              }}
            >
              {cursorText}
            </div>
          )}
        </div>
        
        {/* Contenedor para las estelas */}
        <div ref={trailsRef} className="cursor-trails" />
      </div>
      
      {/* Contenido de la página */}
      {children}
    </>
  );
};

export default CursorEffects; 