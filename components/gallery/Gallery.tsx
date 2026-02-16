'use client';

import { Suspense, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { GALLERY } from '@/lib/gallery-config';
import { GALLERY_PIECES, type GalleryPiece } from '@/lib/gallery-content';
import { Floor } from './Floor';
import { CameraRig } from './CameraRig';
import { Piece } from './Piece';
import { Particles } from './effects/Particles';
import { PostProcessing } from './effects/PostProcessing';
import { PieceOverlay } from './PieceOverlay';
import { PieceLabel } from './ui/PieceLabel';
import { EntryTransition } from './EntryTransition';

interface SceneProps {
  onPieceClick: (piece: GalleryPiece) => void;
  selectedId: string | null;
}

function Scene({ onPieceClick, selectedId }: SceneProps) {
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

      {/* Accent spotlight */}
      <spotLight
        color={GALLERY.colors.accentLight}
        intensity={GALLERY.lighting.accent}
        position={[0, 8, 0]}
        angle={0.6}
        penumbra={0.8}
        castShadow
        target-position={[0, 0, 0]}
      />

      {/* Project pieces */}
      {GALLERY_PIECES.map((piece) => (
        <group key={piece.id}>
          <Piece
            piece={piece}
            onClick={onPieceClick}
            selected={selectedId === piece.id}
          />
          <PieceLabel piece={piece} />
        </group>
      ))}

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
  const [selectedPiece, setSelectedPiece] = useState<GalleryPiece | null>(null);

  const handleEnter = useCallback(() => setEntered(true), []);
  const handlePieceClick = useCallback((piece: GalleryPiece) => setSelectedPiece(piece), []);
  const handleCloseOverlay = useCallback(() => setSelectedPiece(null), []);

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
          <Scene
            onPieceClick={handlePieceClick}
            selectedId={selectedPiece?.id ?? null}
          />
        </Suspense>
      </Canvas>

      {/* Project detail overlay */}
      {selectedPiece && (
        <PieceOverlay piece={selectedPiece} onClose={handleCloseOverlay} />
      )}

      {/* Entry overlay */}
      {!entered && <EntryTransition onEnter={handleEnter} />}
    </div>
  );
}
