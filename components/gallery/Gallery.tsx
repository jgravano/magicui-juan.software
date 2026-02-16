'use client';

import { Suspense, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { GALLERY } from '@/lib/gallery-config';
import { GALLERY_PIECES, type GalleryPiece } from '@/lib/gallery-content';
import { Floor } from './Floor';
import { CameraRig } from './CameraRig';
import { Architecture } from './Architecture';
import { Piece } from './Piece';
import { AboutMonolith } from './AboutMonolith';
import { ContactTerminal } from './ContactTerminal';
import { Particles } from './effects/Particles';
import { PostProcessing } from './effects/PostProcessing';
import { BackgroundShader } from './effects/BackgroundShader';
import { PieceOverlay } from './PieceOverlay';
import { PieceLabel } from './ui/PieceLabel';
import { GalleryHUD } from './ui/GalleryHUD';

interface SceneProps {
  onPieceClick: (piece: GalleryPiece) => void;
  selectedId: string | null;
}

function Scene({ onPieceClick, selectedId }: SceneProps) {
  return (
    <>
      {/* Lighting — ambient base only, per-piece spots are in Architecture */}
      <ambientLight
        color={GALLERY.colors.ambientLight}
        intensity={0.08}
      />
      <directionalLight
        color={GALLERY.colors.directionalLight}
        intensity={0.2}
        position={[5, 10, 5]}
        castShadow
        shadow-mapSize-width={GALLERY.performance.shadowMapSize}
        shadow-mapSize-height={GALLERY.performance.shadowMapSize}
      />

      {/* Generative background */}
      <BackgroundShader />

      {/* Architecture — walls, columns, pedestals, spotlights */}
      <Architecture />

      {/* Project pieces — on pedestals */}
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

      {/* About — left wall */}
      <AboutMonolith />

      {/* Contact — right wall */}
      <ContactTerminal />

      {/* Floor */}
      <Floor />

      {/* Ambient particles */}
      <Particles />

      {/* Camera with cinematic intro */}
      <CameraRig />

      {/* Fog — tighter for more drama */}
      <fog attach="fog" args={['#050505', 8, 35]} />

      {/* Post-processing */}
      <PostProcessing />
    </>
  );
}

export function Gallery() {
  const [selectedPiece, setSelectedPiece] = useState<GalleryPiece | null>(null);

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
          position: [0, 1.8, 2], // cinematic start — close in
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

      {/* HUD */}
      <GalleryHUD />

      {/* Project detail overlay */}
      {selectedPiece && (
        <PieceOverlay piece={selectedPiece} onClose={handleCloseOverlay} />
      )}
    </div>
  );
}
