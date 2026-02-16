'use client';

import { Suspense, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { GALLERY } from '@/lib/gallery-config';
import { Floor } from './Floor';
import { CameraRig } from './CameraRig';
import { Particles } from './effects/Particles';
import { PostProcessing } from './effects/PostProcessing';
import { EntryTransition } from './EntryTransition';

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

      {/* Accent spotlight — aimed at center where pieces will go */}
      <spotLight
        color={GALLERY.colors.accentLight}
        intensity={GALLERY.lighting.accent}
        position={[0, 8, 0]}
        angle={0.6}
        penumbra={0.8}
        castShadow
        target-position={[0, 0, 0]}
      />

      {/* Proof-of-life object — will be replaced by Pieces in M2 */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial
          color={GALLERY.colors.accentLight}
          emissive={GALLERY.colors.accentLight}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Floor with shader grid */}
      <Floor />

      {/* Ambient dust particles */}
      <Particles />

      {/* Camera */}
      <CameraRig />

      {/* Fog */}
      <fog attach="fog" args={[GALLERY.colors.fog, GALLERY.fog.near, GALLERY.fog.far]} />

      {/* Post-processing */}
      <PostProcessing />
    </>
  );
}

export function Gallery() {
  const [entered, setEntered] = useState(false);

  const handleEnter = useCallback(() => {
    setEntered(true);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: GALLERY.colors.background }}>
      {/* 3D Canvas — always mounted for preloading */}
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

      {/* Entry overlay — fades out on enter */}
      {!entered && <EntryTransition onEnter={handleEnter} />}
    </div>
  );
}
