'use client';

import dynamic from 'next/dynamic';

const Gallery = dynamic(
  () => import('@/components/gallery/Gallery').then(mod => mod.Gallery),
  {
    ssr: false,
    loading: () => (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: '#333',
        }}>
          LOADING GALLERY...
        </span>
      </div>
    ),
  }
);

export default function V2Page() {
  return <Gallery />;
}
