'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GALLERY } from '@/lib/gallery-config';

function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight
        color={GALLERY.colors.ambientLight}
        intensity={GALLERY.lighting.ambient}
      />
      <directionalLight
        color={GALLERY.colors.directionalLight}
        intensity={GALLERY.lighting.directional}
        position={[5, 10, 5]}
        castShadow
        shadow-mapSize-width={GALLERY.performance.shadowMapSize}
        shadow-mapSize-height={GALLERY.performance.shadowMapSize}
      />

      {/* Proof-of-life object */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={GALLERY.colors.accentLight} />
      </mesh>

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[GALLERY.floor.size, GALLERY.floor.size]} />
        <meshStandardMaterial color={GALLERY.colors.floor} />
      </mesh>

      {/* Grid */}
      <gridHelper
        args={[
          GALLERY.floor.size,
          GALLERY.floor.gridDivisions,
          GALLERY.colors.floorGrid,
          GALLERY.colors.floorGrid,
        ]}
        position={[0, 0.001, 0]}
      />

      {/* Camera controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={GALLERY.camera.minDistance}
        maxDistance={GALLERY.camera.maxDistance}
        minPolarAngle={GALLERY.camera.minPolarAngle}
        maxPolarAngle={GALLERY.camera.maxPolarAngle}
        target={[...GALLERY.camera.lookAt]}
      />

      {/* Fog */}
      <fog attach="fog" args={[GALLERY.colors.fog, GALLERY.fog.near, GALLERY.fog.far]} />
    </>
  );
}

export function Gallery() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: GALLERY.colors.background }}>
      <Canvas
        shadows
        dpr={[...GALLERY.performance.dpr]}
        camera={{
          fov: GALLERY.camera.fov,
          near: GALLERY.camera.near,
          far: GALLERY.camera.far,
          position: [...GALLERY.camera.position],
        }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
