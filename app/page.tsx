import Image from "next/image";
import { SmoothScroll } from "@/components/smooth-scroll";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-[#FF69B4] selection:text-black">
      {/* Hero Section */}
      <header className="min-h-screen flex items-center justify-center px-4 sm:px-6">
        <div className="absolute inset-0 grid grid-cols-[1fr,2fr,1fr] opacity-5">
          <div className="border-r border-white"></div>
          <div className="border-r border-white"></div>
        </div>
        <div className="w-full max-w-[1400px] grid lg:grid-cols-[1.5fr,1fr] gap-12">
          <div className="space-y-12">
            <div>
              <p className="font-mono text-[#FF69B4] text-sm sm:text-base tracking-[0.2em] mb-3 pl-1">BUENOS AIRES, AR</p>
              <h2 className="font-mono text-[#00B140] text-base sm:text-lg tracking-[0.2em] mb-6">QA ENGINEER & CREATIVE TECHNOLOGIST</h2>
              <h1 className="font-syne text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] font-bold tracking-tight leading-[0.9] -ml-1 sm:-ml-2">
                JUAN GRAVANO
              </h1>
            </div>
            <div className="space-y-6 max-w-2xl pl-1">
              <p className="text-lg sm:text-xl text-zinc-400 font-mono leading-relaxed">
                Explorando la intersección entre tecnología y creatividad. 
                Construyo soluciones que combinan precisión técnica con expresión artística.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <SmoothScroll 
                  href="#about"
                  className="inline-block px-8 py-4 bg-[#00B140] text-black font-mono hover:bg-white transition-colors text-center"
                >
                  DESCUBRIR MÁS
                </SmoothScroll>
                <SmoothScroll
                  href="#contact"
                  className="inline-block px-8 py-4 border border-[#FF69B4] text-[#FF69B4] font-mono hover:bg-[#FF69B4] hover:text-black transition-colors text-center"
                >
                  CONTACTO
                </SmoothScroll>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="bg-[#00B140] aspect-square relative">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-30"></div>
            </div>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section id="about" className="py-24 sm:py-32 bg-[#FF69B4] text-black relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="px-4 sm:px-6 w-full max-w-[1400px] mx-auto relative">
          <div className="grid lg:grid-cols-[1fr,2fr] gap-8 sm:gap-16 items-start">
            <div>
              <p className="font-mono tracking-[0.2em] mb-4 text-black/70">01 —</p>
              <h2 className="font-syne text-4xl sm:text-6xl font-bold tracking-tight">SOBRE<br/>MÍ</h2>
            </div>
            <div className="space-y-8 text-lg sm:text-xl font-mono">
              <p className="leading-relaxed">
                Soy un profesional multifacético que encuentra inspiración en la diversidad. 
                Mi background en ingeniería de software y QA me dio las herramientas para construir 
                soluciones robustas, mientras que mi pasión por el arte y la tecnología me impulsa 
                a explorar nuevas formas de expresión digital.
              </p>
              <p className="leading-relaxed">
                Me motiva la idea de crear experiencias que combinen funcionalidad con creatividad, 
                siempre buscando desafiar los límites de lo convencional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What I Do Section */}
      <section className="py-24 sm:py-32 bg-black relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        <div className="px-4 sm:px-6 w-full max-w-[1400px] mx-auto relative">
          <div className="grid lg:grid-cols-[1fr,2fr] gap-8 sm:gap-16 items-start">
            <div>
              <p className="font-mono tracking-[0.2em] mb-4 text-[#00B140]/70">02 —</p>
              <h2 className="font-syne text-4xl sm:text-6xl font-bold tracking-tight text-[#00B140]">LO QUE<br/>HAGO</h2>
            </div>
            <div className="grid gap-12 sm:gap-16">
              <div className="group">
                <h3 className="font-syne text-2xl sm:text-3xl font-bold mb-6 group-hover:text-[#00B140] transition-colors">QUALITY ENGINEERING</h3>
                <p className="text-lg sm:text-xl text-zinc-400 font-mono leading-relaxed">
                  Diseño y desarrollo soluciones de testing que priorizan tanto la eficiencia como la experiencia del desarrollador. 
                  Mi enfoque combina automatización inteligente con arquitecturas modulares y mantenibles.
                </p>
              </div>
              <div className="group">
                <h3 className="font-syne text-2xl sm:text-3xl font-bold mb-6 group-hover:text-[#FF69B4] transition-colors">CREATIVE TECHNOLOGY</h3>
                <p className="text-lg sm:text-xl text-zinc-400 font-mono leading-relaxed">
                  Desarrollo proyectos en la intersección entre código y arte, explorando nuevas formas 
                  de visualizar datos y crear experiencias interactivas que desafían lo convencional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Approach Section (replacing Skills) */}
      <section className="py-24 sm:py-32 bg-[#00B140] relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="px-4 sm:px-6 w-full max-w-[1400px] mx-auto relative">
          <div className="grid lg:grid-cols-[1fr,2fr] gap-8 sm:gap-16 items-start">
            <div>
              <p className="font-mono tracking-[0.2em] mb-4 text-black/70">03 —</p>
              <h2 className="font-syne text-4xl sm:text-6xl font-bold tracking-tight">ENFOQUE &<br/>PROCESO</h2>
            </div>
            <div className="space-y-12">
              <div className="group">
                <h3 className="font-syne text-2xl sm:text-3xl font-bold mb-6">DISEÑO CENTRADO EN LA EXPERIENCIA</h3>
                <p className="text-lg sm:text-xl font-mono leading-relaxed">
                  Creo en construir soluciones que no solo funcionen bien, sino que sean intuitivas y 
                  agradables de usar. Cada proyecto es una oportunidad para mejorar la experiencia 
                  del equipo y del usuario final.
                </p>
              </div>
              <div className="group">
                <h3 className="font-syne text-2xl sm:text-3xl font-bold mb-6">INNOVACIÓN PRÁCTICA</h3>
                <p className="text-lg sm:text-xl font-mono leading-relaxed">
                  Busco el balance entre la innovación y la practicidad. Me apasiona explorar nuevas 
                  tecnologías y enfoques, siempre manteniendo el foco en entregar valor real y 
                  soluciones sostenibles.
                </p>
              </div>
              <div className="group">
                <h3 className="font-syne text-2xl sm:text-3xl font-bold mb-6">COLABORACIÓN & APRENDIZAJE</h3>
                <p className="text-lg sm:text-xl font-mono leading-relaxed">
                  El desarrollo de software es un esfuerzo colectivo. Priorizo la colaboración abierta, 
                  el intercambio de conocimientos y el aprendizaje continuo como pilares fundamentales 
                  de mi trabajo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interests Section */}
      <section className="py-24 sm:py-32 bg-[#FF69B4] relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="px-4 sm:px-6 w-full max-w-[1400px] mx-auto relative">
          <div className="grid lg:grid-cols-[1fr,2fr] gap-8 sm:gap-16 items-start">
            <div>
              <p className="font-mono tracking-[0.2em] mb-4 text-black/70">04 —</p>
              <h2 className="font-syne text-4xl sm:text-6xl font-bold tracking-tight text-black">OTROS<br/>INTERESES</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8 sm:gap-12 text-black">
              <div className="group">
                <h3 className="font-syne text-xl sm:text-2xl font-bold mb-4 group-hover:text-white transition-colors">ARTE DIGITAL</h3>
                <p className="text-lg sm:text-xl font-mono leading-relaxed">
                  Me gusta transformar datos en experiencias visuales únicas. Estoy explorando el arte generativo y sus infinitas posibilidades creativas.
                </p>
              </div>
              <div className="group">
                <h3 className="font-syne text-xl sm:text-2xl font-bold mb-4 group-hover:text-white transition-colors">GASTRONOMÍA</h3>
                <p className="text-lg sm:text-xl font-mono leading-relaxed">
                  Disfruto experimentar en la cocina, desde el café de especialidad hasta la creación de pizzas napolitanas perfectas en casa.
                </p>
              </div>
              <div className="group">
                <h3 className="font-syne text-xl sm:text-2xl font-bold mb-4 group-hover:text-white transition-colors">CONEXIÓN CON EL MAR</h3>
                <p className="text-lg sm:text-xl font-mono leading-relaxed">
                  El mar es una fuente constante de inspiración para mí. Me atraen su inmensidad, su calma y su capacidad de renovar la mente. Siempre busco formas de integrar su esencia en mi vida y proyectos creativos.
                </p>
              </div>
              <div className="group">
                <h3 className="font-syne text-xl sm:text-2xl font-bold mb-4 group-hover:text-white transition-colors">BIENESTAR</h3>
                <p className="text-lg sm:text-xl font-mono leading-relaxed">
                  Estoy aprendiendo a equilibrar hábitos, productividad y calidad de vida a través de la nutrición, el ejercicio y la autoconciencia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 sm:py-32 bg-black relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        <div className="px-4 sm:px-6 w-full max-w-[1400px] mx-auto text-center relative">
          <p className="font-mono text-[#FF69B4] tracking-[0.2em] mb-6">05 —</p>
          <h2 className="font-syne text-4xl sm:text-6xl font-bold tracking-tight mb-12 sm:mb-16">CONECTEMOS</h2>
          <div className="flex gap-6 sm:gap-8 justify-center">
          <a
            href="https://github.com/jgravano"
            target="_blank"
            rel="noopener noreferrer"
              className="p-4 sm:p-6 bg-[#00B140] text-black hover:bg-white transition-colors"
          >
              <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <a
            href="https://linkedin.com/in/juan-gravano"
            target="_blank"
            rel="noopener noreferrer"
              className="p-4 sm:p-6 bg-[#FF69B4] text-black hover:bg-white transition-colors"
          >
              <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </a>
        </div>
        </div>
      </section>

      <footer className="py-6 sm:py-8 bg-black text-center text-zinc-600 text-base sm:text-lg font-mono border-t border-zinc-900">
        <div className="px-4 sm:px-6 w-full max-w-[1400px] mx-auto">
          © {new Date().getFullYear()} | made with ❤️ by juan.software
        </div>
      </footer>
    </div>
  );
}
