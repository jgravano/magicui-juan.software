'use client';

import { DURATION, EASING } from '@/lib/motion';
import { useEffect, useState } from 'react';

export function Hero() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="mx-auto max-w-4xl text-center">
        {/* Overline */}
        <p
          className="text-xs tracking-[0.3em] text-muted-foreground uppercase mb-8"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(16px)',
            transition: `opacity ${DURATION.slow}ms ${EASING.default} 200ms, transform ${DURATION.slow}ms ${EASING.default} 200ms`,
          }}
        >
          Quality · Systems · Product
        </p>

        {/* Main Name with offset accent underline */}
        <div className="relative inline-block mb-12">
          <h1
            className="font-serif text-6xl md:text-8xl lg:text-9xl font-light tracking-tight text-foreground"
            data-emphasis
            style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(32px)',
              transition: `opacity ${DURATION.reveal}ms ${EASING.default} 400ms, transform ${DURATION.reveal}ms ${EASING.default} 400ms`,
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            Juan Gravano
          </h1>
        </div>

        {/* Tagline */}
        <p
          className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto leading-relaxed"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(24px)',
            transition: `opacity ${DURATION.slow}ms ${EASING.default} 700ms, transform ${DURATION.slow}ms ${EASING.default} 700ms`,
          }}
        >
          I design systems that hold under pressure.
        </p>

        {/* Scroll Indicator */}
        <div
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded
              ? 'translateX(-50%) translateY(0)'
              : 'translateX(-50%) translateY(16px)',
            transition: `opacity ${DURATION.slow}ms ${EASING.default} 1200ms, transform ${DURATION.slow}ms ${EASING.default} 1200ms`,
          }}
        >
          <a
            href="#statement"
            data-cursor="link"
            className="flex flex-col items-center gap-3 text-muted-foreground hover:text-accent transition-colors hover-lift tap"
          >
            <div className="w-px h-12 bg-border relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1/2 bg-accent animate-[scroll-line_1.5s_ease-in-out_infinite]" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
