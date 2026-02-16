'use client';

import type { CSSProperties } from 'react';

interface StickerProps {
  text: string;
  rotation?: number;
  variant?: 'default' | 'danger' | 'neon';
  tape?: boolean;
  className?: string;
  style?: CSSProperties;
}

const variantStyles: Record<string, CSSProperties> = {
  default: {
    background: 'var(--machine-sticker)',
    color: '#1a0f08',
  },
  danger: {
    background: 'var(--machine-danger)',
    color: '#fff',
  },
  neon: {
    background: 'var(--machine-accent)',
    color: '#000',
  },
};

export function Sticker({
  text,
  rotation = -3,
  variant = 'default',
  tape = false,
  className = '',
  style,
}: StickerProps) {
  const lines = text.split('\n');

  return (
    <div
      className={`${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        transform: `rotate(${rotation}deg)`,
        zIndex: 10,
        pointerEvents: 'none',
        ...style,
      }}
      aria-hidden="true"
    >
      {tape && (
        <span
          style={{
            position: 'absolute',
            top: -6,
            left: 12,
            width: 40,
            height: 10,
            background: 'var(--machine-tape)',
            opacity: 0.7,
            transform: 'rotate(-4deg)',
            zIndex: 11,
          }}
        />
      )}
      <div
        style={{
          ...variantStyles[variant],
          padding: '10px 14px',
          fontFamily: 'var(--font-sans), system-ui, sans-serif',
          fontWeight: 800,
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          lineHeight: 1.2,
          boxShadow: '4px 4px 0 rgba(0,0,0,0.5)',
        }}
      >
        {lines.map((line, i) => (
          <span key={i} style={{ display: 'block' }}>
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}
