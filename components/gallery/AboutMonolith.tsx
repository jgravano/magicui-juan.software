'use client';

import { Html } from '@react-three/drei';

/**
 * Wall-mounted text on the left wall — the "about" section.
 * Not a floating object; integrated into the architecture.
 */
export function AboutMonolith() {
  return (
    <group position={[-11.7, 4, -2]} rotation={[0, Math.PI / 2, 0]}>
      {/* Text panel — mounted on left wall */}
      <Html
        transform
        distanceFactor={8}
        style={{ pointerEvents: 'none', width: 280 }}
      >
        <div style={{
          fontFamily: 'var(--font-mono), monospace',
          color: '#f0ece4',
          userSelect: 'none',
        }}>
          <span style={{
            fontSize: 8,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#FF5C00',
            display: 'block',
            marginBottom: 14,
          }}>
            ABOUT THE ARTIST
          </span>
          <span style={{
            fontSize: 22,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            lineHeight: 0.95,
            display: 'block',
            marginBottom: 16,
          }}>
            JUAN<br />GRAVANO
          </span>
          <span style={{
            fontSize: 10,
            lineHeight: 1.8,
            color: '#666',
            display: 'block',
            marginBottom: 14,
          }}>
            Quality engineer.<br />
            I build systems that don&apos;t break,<br />
            test the ones that do,<br />
            and automate everything in between.
          </span>
          <span style={{
            fontSize: 8,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#333',
            display: 'block',
          }}>
            BUENOS AIRES, ARGENTINA — 2026
          </span>
        </div>
      </Html>

      {/* Accent light illuminating the text */}
      <pointLight
        color="#FF5C00"
        intensity={0.2}
        distance={6}
        position={[1.5, 0, 0]}
      />
    </group>
  );
}
