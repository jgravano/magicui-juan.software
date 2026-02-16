'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * A floating terminal screen in the gallery — contact links.
 * Looks like a CRT monitor displaying links.
 */
export function ContactTerminal() {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = 1.4 + Math.sin(t * 0.5 + 2) * 0.03;
    ref.current.rotation.y = -0.3 + Math.sin(t * 0.2) * 0.02;
  });

  return (
    <group position={[7, 0, -4]}>
      {/* Screen frame */}
      <mesh ref={ref} position={[0, 1.4, 0]}>
        <boxGeometry args={[2.2, 1.5, 0.08]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
      </mesh>

      {/* Screen surface with glow */}
      <mesh position={[0, 1.4, 0.045]}>
        <planeGeometry args={[2, 1.3]} />
        <meshBasicMaterial color="#050a05" />
      </mesh>

      {/* HTML content on screen */}
      <Html
        position={[0, 1.4, 0.06]}
        transform
        distanceFactor={5}
        style={{ pointerEvents: hovered ? 'auto' : 'none', width: 240 }}
      >
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            fontFamily: 'var(--font-mono), monospace',
            color: '#39ff14',
            userSelect: 'none',
            padding: 4,
          }}
        >
          <div style={{
            fontSize: 8,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#39ff14',
            marginBottom: 8,
            opacity: 0.6,
          }}>
            {'>'} OPEN CHANNELS_
          </div>

          {[
            { label: 'LINKEDIN', href: 'https://linkedin.com/in/juan-gravano', prefix: '01' },
            { label: 'GITHUB', href: 'https://github.com/jgravano', prefix: '02' },
            { label: 'EMAIL', href: 'mailto:juangravano@gmail.com', prefix: '03' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
                padding: '3px 0',
                fontSize: 10,
                color: '#39ff14',
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#FF5C00'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#39ff14'; }}
            >
              <span style={{ opacity: 0.4, fontSize: 8 }}>{link.prefix}</span>
              <span style={{ width: 12, height: 1, background: 'currentColor', opacity: 0.3 }} />
              <span style={{ fontWeight: 700, letterSpacing: '0.05em' }}>{link.label}</span>
            </a>
          ))}

          <div style={{
            marginTop: 10,
            fontSize: 8,
            color: '#39ff14',
            opacity: 0.3,
          }}>
            BUENOS AIRES — 2026
          </div>
        </div>
      </Html>

      {/* Screen glow */}
      <pointLight
        color="#39ff14"
        intensity={0.15}
        distance={4}
        position={[0, 1.4, 0.5]}
      />
    </group>
  );
}
