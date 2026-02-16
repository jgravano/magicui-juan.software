'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import type { GalleryPiece } from '@/lib/gallery-content';

interface PieceProps {
  piece: GalleryPiece;
  onClick: (piece: GalleryPiece) => void;
  selected: boolean;
}

function PieceGeometry({ type }: { type: GalleryPiece['geometry'] }) {
  switch (type) {
    case 'box':
      return <boxGeometry args={[0.9, 0.9, 0.9]} />;
    case 'octahedron':
      return <octahedronGeometry args={[0.7, 0]} />;
    case 'torus':
      return <torusGeometry args={[0.55, 0.22, 16, 32]} />;
    case 'icosahedron':
      return <icosahedronGeometry args={[0.65, 0]} />;
  }
}

export function Piece({ piece, onClick, selected }: PieceProps) {
  const ref = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const baseY = piece.position[1];

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;

    // Idle bob
    ref.current.position.y = baseY + Math.sin(t * 0.8 + piece.position[0]) * 0.08;

    // Slow rotation
    ref.current.rotation.y += 0.003;

    // Hover/select scale
    const targetScale = hovered || selected ? piece.scale * 1.12 : piece.scale;
    ref.current.scale.setScalar(
      ref.current.scale.x + (targetScale - ref.current.scale.x) * 0.1
    );
  });

  return (
    <mesh
      ref={ref}
      position={[...piece.position]}
      rotation={[...piece.rotation]}
      scale={piece.scale}
      castShadow
      onClick={(e) => {
        e.stopPropagation();
        onClick(piece);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      <PieceGeometry type={piece.geometry} />
      <meshStandardMaterial
        color={piece.color}
        emissive={piece.emissive}
        emissiveIntensity={hovered || selected ? 0.5 : 0.15}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
}
