'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * A tall dark monolith in the gallery — the "about" piece.
 * Floating text on its surface. Personal statement, not a project.
 */
export function AboutMonolith() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    // Very subtle breathing
    const t = state.clock.elapsedTime;
    ref.current.position.y = 1.6 + Math.sin(t * 0.3) * 0.02;
  });

  return (
    <group position={[-8, 0, -5]}>
      {/* The monolith */}
      <mesh ref={ref} position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[1.8, 3, 0.15]} />
        <meshStandardMaterial
          color="#111"
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* Text on the monolith — HTML overlay */}
      <Html
        position={[0, 2.4, 0.1]}
        transform
        distanceFactor={6}
        style={{ pointerEvents: 'none', width: 200 }}
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
            marginBottom: 10,
          }}>
            ABOUT
          </span>
          <span style={{
            fontSize: 14,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            display: 'block',
            marginBottom: 12,
          }}>
            JUAN GRAVANO
          </span>
          <span style={{
            fontSize: 9,
            lineHeight: 1.7,
            color: '#888',
            display: 'block',
            marginBottom: 10,
          }}>
            Quality engineer from Buenos Aires.
            I work on systems, reliability, and
            the parts most people avoid.
          </span>
          <span style={{
            fontSize: 8,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#555',
            display: 'block',
          }}>
            BUENOS AIRES, AR
          </span>
        </div>
      </Html>

      {/* Accent light on the monolith */}
      <pointLight
        color="#FF5C00"
        intensity={0.3}
        distance={5}
        position={[0, 3.5, 1]}
      />
    </group>
  );
}
