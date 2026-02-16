'use client';

import { useEffect } from 'react';
import type { GalleryPiece } from '@/lib/gallery-content';

interface PieceOverlayProps {
  piece: GalleryPiece;
  onClose: () => void;
}

export function PieceOverlay({ piece, onClose }: PieceOverlayProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 300ms ease forwards',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#111',
          border: '1px solid #333',
          maxWidth: 480,
          width: '90vw',
          padding: 'clamp(24px, 4vw, 40px)',
          animation: 'slideUp 400ms cubic-bezier(0.23, 1, 0.32, 1) forwards',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: '1px solid #222',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono), monospace',
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: piece.color,
          }}>
            {piece.label}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono), monospace',
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#555',
          }}>
            {piece.category}
          </span>
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          color: '#f0ece4',
          lineHeight: 1.1,
          marginBottom: 16,
        }}>
          {piece.title}
        </h2>

        {/* Description */}
        <p style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 13,
          lineHeight: 1.65,
          color: '#888',
          marginBottom: 20,
        }}>
          {piece.description}
        </p>

        {/* Tag */}
        <span style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: piece.color,
        }}>
          {piece.tag}
        </span>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            display: 'block',
            marginTop: 24,
            fontFamily: 'var(--font-mono), monospace',
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#555',
            background: 'transparent',
            border: '1px solid #333',
            padding: '8px 20px',
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f0ece4';
            e.currentTarget.style.borderColor = '#f0ece4';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#555';
            e.currentTarget.style.borderColor = '#333';
          }}
        >
          CLOSE
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
