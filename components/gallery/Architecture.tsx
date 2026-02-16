'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Gallery architecture — walls, columns, and light beams
 * that create an actual sense of space and intimacy.
 */
export function Architecture() {
  const wallMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#0e0e0e',
      roughness: 0.95,
      metalness: 0,
    }),
    []
  );

  const columnMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#111',
      roughness: 0.85,
      metalness: 0.05,
    }),
    []
  );

  return (
    <group>
      {/* ── Back wall ── */}
      <mesh position={[0, 4, -10]} receiveShadow>
        <boxGeometry args={[30, 8, 0.3]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* ── Left wall ── */}
      <mesh position={[-12, 4, -2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[18, 8, 0.3]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* ── Right wall (partial — opening for contact terminal) ── */}
      <mesh position={[12, 4, -4]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[14, 8, 0.3]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* ── Columns ── */}
      {[
        [-6, 0, -8],
        [6, 0, -8],
        [-6, 0, 2],
        [6, 0, 2],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.15, 0.18, 8, 8]} />
          <primitive object={columnMaterial} attach="material" />
        </mesh>
      ))}

      {/* ── Pedestals for pieces ── */}
      {[
        { pos: [-4, 0.3, -3] as const, size: [0.7, 0.6, 0.7] as const },
        { pos: [0, 0.15, -5] as const, size: [0.6, 0.3, 0.6] as const },
        { pos: [4, 0.45, -2.5] as const, size: [0.65, 0.9, 0.65] as const },
        { pos: [2, 0.25, -7] as const, size: [0.55, 0.5, 0.55] as const },
      ].map((pedestal, i) => (
        <mesh key={`ped-${i}`} position={[...pedestal.pos]} receiveShadow castShadow>
          <boxGeometry args={[...pedestal.size]} />
          <meshStandardMaterial color="#0d0d0d" roughness={0.9} metalness={0.02} />
        </mesh>
      ))}

      {/* ── Light beams (volumetric feel via narrow bright planes) ── */}
      {[
        { pos: [-4, 6, -3], rot: [0, 0, 0.1], color: '#FF5C00' },
        { pos: [0, 6, -5], rot: [0, 0, -0.05], color: '#E8D44D' },
        { pos: [4, 6, -2.5], rot: [0, 0, 0.08], color: '#D62828' },
        { pos: [2, 6, -7], rot: [0, 0, -0.12], color: '#0038FF' },
      ].map((beam, i) => (
        <spotLight
          key={`beam-${i}`}
          position={beam.pos as [number, number, number]}
          color={beam.color}
          intensity={1.2}
          angle={0.25}
          penumbra={0.9}
          distance={12}
          castShadow
          target-position={[beam.pos[0], 0, beam.pos[2]]}
        />
      ))}
    </group>
  );
}
