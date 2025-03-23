'use client';

import React, { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';
import type { Engine } from 'tsparticles-engine';

interface SpaceBackgroundProps {
  color?: 'coral' | 'mostaza' | 'menta' | 'celeste';
  density?: number;
}

const SpaceBackground: React.FC<SpaceBackgroundProps> = ({ 
  color = 'celeste',
  density = 30
}) => {
  const colorMap = {
    coral: '#FF8075',
    mostaza: '#FFD166',
    menta: '#83D1B5',
    celeste: '#6ABED8'
  };

  const particleColor = colorMap[color];

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      <Particles
        id="space-particles"
        init={particlesInit}
        options={{
          background: {
            color: {
              value: '#111111',
            },
          },
          fpsLimit: 60,
          interactivity: {
            events: {
              onHover: {
                enable: true,
                mode: 'grab',
                parallax: {
                  enable: true,
                  force: 60,
                  smooth: 10
                }
              },
              resize: true,
            },
            modes: {
              grab: {
                distance: 200,
                links: {
                  opacity: 0.2
                }
              }
            },
          },
          particles: {
            color: {
              value: particleColor,
            },
            links: {
              color: particleColor,
              distance: 150,
              enable: true,
              opacity: 0.2,
              width: 1,
            },
            move: {
              direction: 'none',
              enable: true,
              outModes: {
                default: 'out',
              },
              random: true,
              speed: 0.8,
              straight: false,
              parallax: true
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: density,
            },
            opacity: {
              value: 0.5,
              random: true,
              anim: {
                enable: true,
                speed: 0.5,
                opacity_min: 0.1,
                sync: false
              }
            },
            shape: {
              type: 'circle',
            },
            size: {
              value: { min: 1, max: 3 },
              random: true,
              anim: {
                enable: true,
                speed: 2,
                size_min: 0.1,
                sync: false
              }
            },
          },
          detectRetina: true,
        }}
        className="absolute inset-0"
        canvasClassName="w-full h-full"
      />
    </div>
  );
};

export default SpaceBackground; 