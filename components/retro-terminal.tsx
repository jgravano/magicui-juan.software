'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TerminalProps {
  welcomeText?: string;
  commands?: { command: string; description: string }[];
  onCommandExecuted?: (command: string) => void;
}

export default function RetroTerminal({
  welcomeText = "SISTEMA OPERATIVO RETRO v1.0",
  commands = [
    { command: "help", description: "Muestra los comandos disponibles" },
    { command: "sobre-mi", description: "Información sobre Juan" },
    { command: "proyectos", description: "Ver proyectos y portfolio" },
    { command: "contacto", description: "Información de contacto" },
    { command: "experiencia", description: "Resumen de experiencia profesional" },
    { command: "stack", description: "Tecnologías y herramientas" },
    { command: "clear", description: "Limpia la terminal" }
  ],
  onCommandExecuted
}: TerminalProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cursorVisible, setCursorVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Mostrar mensaje de bienvenida
  useEffect(() => {
    setHistory([
      welcomeText,
      "═════════════════════════════════════",
      "Escribe 'help' para ver los comandos disponibles.",
      "═════════════════════════════════════",
    ]);
    
    // Cursor intermitente
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);
    
    return () => {
      clearInterval(interval);
    };
  }, [welcomeText]);
  
  // Enfocar el input
  useEffect(() => {
    const handleClick = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  
  // Mantener el scroll en la parte inferior
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };
  
  const executeCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    
    // Actualizar historial
    if (trimmedCmd) {
      setCommandHistory(prev => [...prev, trimmedCmd]);
      setHistoryIndex(-1);
      setHistory(prev => [...prev, `> ${trimmedCmd}`]);
    }
    
    setInput("");
    
    // Procesamiento de comandos
    switch(trimmedCmd) {
      case "help": {
        const helpOutput = [
          "═════════════════════════════════════",
          "COMANDOS DISPONIBLES:",
          "═════════════════════════════════════",
          ...commands.map(c => `${c.command.padEnd(12)} - ${c.description}`),
          "═════════════════════════════════════",
        ];
        setHistory(prev => [...prev, ...helpOutput]);
        break;
      }
      
      case "clear": {
        setHistory([welcomeText, "Escribe 'help' para ver los comandos disponibles."]);
        break;
      }
      
      case "experiencia": {
        const experienciaOutput = [
          "═════════════════════════════════════",
          "EXPERIENCIA PROFESIONAL:",
          "═════════════════════════════════════",
          "▶ QA Lead @ SomosAgile (2019-Presente)",
          "   Liderando equipos de calidad en proyectos",
          "   de alto impacto para clientes internacionales.",
          "▶ QA Engineer @ TechGlobal (2016-2019)",
          "   Diseño e implementación de frameworks de testing.",
          "▶ Frontend Developer @ StartupXYZ (2014-2016)",
          "   Desarrollo de interfaces y experiencias de usuario.",
          "═════════════════════════════════════",
        ];
        setHistory(prev => [...prev, ...experienciaOutput]);
        break;
      }
      
      case "stack": {
        const stackOutput = [
          "═════════════════════════════════════",
          "TECNOLOGÍAS Y HERRAMIENTAS:",
          "═════════════════════════════════════",
          "▶ Testing: Cypress, Playwright, Selenium, Jest",
          "▶ Frontend: React, Vue, JavaScript/TypeScript",
          "▶ Backend: Node.js, Express, Python, FastAPI",
          "▶ DevOps: Docker, CI/CD, AWS, Git",
          "▶ Otras: Figma, Adobe CC, Jira, Confluence",
          "═════════════════════════════════════",
        ];
        setHistory(prev => [...prev, ...stackOutput]);
        break;
      }
      
      case "":
        // No hacer nada para comando vacío
        break;
        
      default:
        if (commands.some(c => c.command === trimmedCmd)) {
          if (onCommandExecuted) {
            onCommandExecuted(trimmedCmd);
          }
        } else {
          setHistory(prev => [...prev, `Comando no reconocido: ${trimmedCmd}. Escribe 'help' para ver los comandos disponibles.`]);
        }
        break;
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-coral border border-crema"></div>
            <div className="w-3 h-3 rounded-full bg-mostaza border border-crema"></div>
            <div className="w-3 h-3 rounded-full bg-menta border border-crema"></div>
          </div>
          <div className="text-crema text-xs">terminal.exe</div>
          <div></div>
        </div>
        <div className="terminal-body" ref={terminalRef}>
          {history.map((line, i) => (
            <div key={i} className="terminal-text whitespace-pre-wrap mb-1">
              {line}
            </div>
          ))}
          <div className="flex items-center terminal-text">
            <span className="mr-2 text-mostaza">{'>'}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-grow bg-transparent outline-none terminal-text"
              autoFocus
            />
            <span className={`h-4 w-2 ml-1 ${cursorVisible ? 'bg-negro' : 'bg-transparent'}`}></span>
          </div>
        </div>
      </div>
      
      {/* Botones de terminal */}
      <div className="flex justify-between mt-4">
        <button 
          onClick={() => executeCommand('clear')} 
          className="px-3 py-1 bg-negro text-crema text-sm border-2 border-negro transform -rotate-1"
        >
          Clear
        </button>
        <button 
          onClick={() => executeCommand('help')} 
          className="px-3 py-1 bg-mostaza text-negro text-sm border-2 border-negro transform rotate-1"
        >
          Help
        </button>
      </div>
    </motion.div>
  );
} 