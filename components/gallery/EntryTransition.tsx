'use client';

import { useState, useCallback } from 'react';

interface EntryTransitionProps {
  onEnter: () => void;
}

export function EntryTransition({ onEnter }: EntryTransitionProps) {
  const [fading, setFading] = useState(false);

  const handleEnter = useCallback(() => {
    setFading(true);
    setTimeout(onEnter, 800);
  }, [onEnter]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        opacity: fading ? 0 : 1,
        transition: 'opacity 800ms ease',
        cursor: 'default',
      }}
    >
      <h1 style={{
        fontFamily: 'var(--font-mono), monospace',
        fontSize: 'clamp(2rem, 8vw, 5rem)',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '-0.02em',
        color: '#f0ece4',
        lineHeight: 0.92,
        textAlign: 'center',
      }}>
        JUAN GRAVANO
      </h1>

      <button
        type="button"
        onClick={handleEnter}
        style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: '#555',
          background: 'transparent',
          border: '1px solid #333',
          padding: '10px 28px',
          cursor: 'pointer',
          transition: 'all 300ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#FF5C00';
          e.currentTarget.style.borderColor = '#FF5C00';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#555';
          e.currentTarget.style.borderColor = '#333';
        }}
      >
        ENTER GALLERY
      </button>

      <span style={{
        fontFamily: 'var(--font-mono), monospace',
        fontSize: 9,
        letterSpacing: '0.12em',
        color: '#333',
        textTransform: 'uppercase',
        position: 'absolute',
        bottom: 24,
      }}>
        USE MOUSE TO NAVIGATE
      </span>
    </div>
  );
}
