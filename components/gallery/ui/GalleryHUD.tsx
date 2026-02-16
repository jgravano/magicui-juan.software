'use client';

import { useState, useEffect } from 'react';

export function GalleryHUD() {
  const [showHint, setShowHint] = useState(true);

  // Hide navigation hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Bottom-left: identity */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#f0ece4',
        }}>
          JG
        </span>
        <span style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 8,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: '#555',
        }}>
          THE GALLERY
        </span>
      </div>

      {/* Bottom-right: navigation hint — fades out */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 50,
        opacity: showHint ? 0.5 : 0,
        transition: 'opacity 1s ease',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 9,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#555',
        }}>
          DRAG TO LOOK — SCROLL TO ZOOM — CLICK PIECES
        </span>
      </div>
    </>
  );
}
