'use client';

import { Html } from '@react-three/drei';
import type { GalleryPiece } from '@/lib/gallery-content';

interface PieceLabelProps {
  piece: GalleryPiece;
}

export function PieceLabel({ piece }: PieceLabelProps) {
  return (
    <Html
      position={[piece.position[0], piece.position[1] - 0.8, piece.position[2]]}
      center
      distanceFactor={10}
      style={{ pointerEvents: 'none' }}
    >
      <span style={{
        fontFamily: 'var(--font-mono), monospace',
        fontSize: 9,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: '#555',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}>
        {piece.label}
      </span>
    </Html>
  );
}
