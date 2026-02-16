'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 120;
const SPREAD = 20;
const HEIGHT = 8;

export function Particles() {
  const ref = useRef<THREE.Points>(null);

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const spd = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * SPREAD;
      pos[i * 3 + 1] = Math.random() * HEIGHT;
      pos[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;
      spd[i] = 0.002 + Math.random() * 0.005;
    }
    return [pos, spd];
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const geo = ref.current.geometry;
    const posAttr = geo.getAttribute('position');
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Slow upward drift
      arr[i * 3 + 1] += speeds[i];
      // Subtle horizontal sway
      arr[i * 3] += Math.sin(Date.now() * 0.0003 + i) * 0.001;

      // Reset when above ceiling
      if (arr[i * 3 + 1] > HEIGHT) {
        arr[i * 3 + 1] = 0;
        arr[i * 3] = (Math.random() - 0.5) * SPREAD;
        arr[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={PARTICLE_COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#e8e0d4"
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
