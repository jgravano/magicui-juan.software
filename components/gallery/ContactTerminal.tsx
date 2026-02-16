'use client';

import { Html } from '@react-three/drei';

/**
 * Wall-mounted terminal on the right wall — contact links.
 */
export function ContactTerminal() {
  return (
    <group position={[11.7, 3.5, -4]} rotation={[0, -Math.PI / 2, 0]}>
      {/* Screen bezel */}
      <mesh>
        <boxGeometry args={[2.4, 1.7, 0.1]} />
        <meshStandardMaterial color="#080808" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Screen face */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[2.1, 1.4]} />
        <meshBasicMaterial color="#030a03" />
      </mesh>

      {/* HTML content */}
      <Html
        position={[0, 0, 0.08]}
        transform
        distanceFactor={5.5}
        style={{ pointerEvents: 'auto', width: 240 }}
      >
        <div style={{
          fontFamily: 'var(--font-mono), monospace',
          color: '#39ff14',
          userSelect: 'none',
          padding: 4,
        }}>
          <div style={{
            fontSize: 8,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            marginBottom: 10,
            opacity: 0.5,
          }}>
            {'>'} CONTACT_
          </div>

          <div style={{
            fontSize: 9,
            lineHeight: 1.6,
            color: '#39ff14',
            opacity: 0.4,
            marginBottom: 10,
          }}>
            I DON&apos;T TAKE EVERY PROJECT.<br />
            I TAKE THE INTERESTING ONES.
          </div>

          {[
            { label: 'LINKEDIN', href: 'https://linkedin.com/in/juan-gravano', prefix: '01' },
            { label: 'GITHUB', href: 'https://github.com/jgravano', prefix: '02' },
            { label: 'EMAIL', href: 'mailto:juangravano@gmail.com', prefix: '03' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
                padding: '4px 0',
                fontSize: 11,
                fontWeight: 700,
                color: '#39ff14',
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#FF5C00'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#39ff14'; }}
            >
              <span style={{ opacity: 0.3, fontSize: 8 }}>{link.prefix}</span>
              <span style={{ width: 16, height: 1, background: 'currentColor', opacity: 0.3 }} />
              <span>{link.label}</span>
            </a>
          ))}

          <div style={{
            marginTop: 12,
            fontSize: 7,
            opacity: 0.2,
            letterSpacing: '0.1em',
          }}>
            SYS READY — 2026
          </div>
        </div>
      </Html>

      {/* Screen glow */}
      <pointLight
        color="#39ff14"
        intensity={0.12}
        distance={4}
        position={[-1, 0, 0.5]}
      />
    </group>
  );
}
