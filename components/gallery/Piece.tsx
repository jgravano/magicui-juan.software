'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
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
      return <octahedronGeometry args={[0.7, 2]} />;
    case 'torus':
      return <torusGeometry args={[0.55, 0.22, 32, 64]} />;
    case 'icosahedron':
      return <icosahedronGeometry args={[0.65, 2]} />;
  }
}

/**
 * Custom animated material — each piece pulses with internal energy.
 * Vertex displacement + emissive pulsation driven by noise.
 */
function usePieceMaterial(piece: GalleryPiece) {
  return useMemo(() => {
    const color = new THREE.Color(piece.color);
    const emissive = new THREE.Color(piece.emissive);

    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: color },
        uEmissive: { value: emissive },
        uHover: { value: 0 },
        uSeed: { value: Math.abs(piece.position[0] * 13.7 + piece.position[2] * 7.3) },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uSeed;
        uniform float uHover;
        varying vec3 vNormal;
        varying vec3 vPos;
        varying float vDisplacement;

        // Simple 3D noise
        vec3 mod289(vec3 x) { return x - floor(x / 289.0) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x / 289.0) * 289.0; }
        vec4 perm(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
        float noise(vec3 p) {
          vec3 a = floor(p);
          vec3 d = p - a;
          d = d * d * (3.0 - 2.0 * d);
          vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
          vec4 k1 = perm(b.xyxy);
          vec4 k2 = perm(k1.xyxy + b.zzww);
          vec4 c = k2 + a.zzzz;
          vec4 k3 = perm(c);
          vec4 k4 = perm(c + 1.0);
          vec4 o1 = fract(k3 * (1.0 / 41.0));
          vec4 o2 = fract(k4 * (1.0 / 41.0));
          vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
          vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
          return o4.y * d.y + o4.x * (1.0 - d.y);
        }

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPos = position;

          // Vertex displacement — breathing effect
          float n = noise(position * 2.0 + uTime * 0.5 + uSeed);
          float displacement = n * 0.04 * (1.0 + uHover * 0.8);
          vec3 displaced = position + normal * displacement;
          vDisplacement = n;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uSeed;
        uniform vec3 uColor;
        uniform vec3 uEmissive;
        uniform float uHover;
        varying vec3 vNormal;
        varying vec3 vPos;
        varying float vDisplacement;

        void main() {
          // Fresnel rim lighting
          vec3 viewDir = normalize(cameraPosition - vPos);
          float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);

          // Base color with displacement variation
          vec3 base = uColor * (0.8 + vDisplacement * 0.4);

          // Emissive pulsation
          float pulse = sin(uTime * 1.5 + uSeed) * 0.5 + 0.5;
          float emissiveStrength = mix(0.15, 0.4, pulse) + uHover * 0.3;
          vec3 emissiveColor = uEmissive * emissiveStrength;

          // Rim glow
          vec3 rimColor = uEmissive * fresnel * (0.5 + uHover * 0.5);

          vec3 color = base * 0.6 + emissiveColor + rimColor;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
  }, [piece.color, piece.emissive, piece.position]);
}

export function Piece({ piece, onClick, selected }: PieceProps) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const baseY = piece.position[1];
  const material = usePieceMaterial(piece);
  const hoverRef = useRef(0);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;

    // Idle bob
    ref.current.position.y = baseY + Math.sin(t * 0.8 + piece.position[0]) * 0.08;

    // Slow rotation
    ref.current.rotation.y += 0.003;

    // Smooth hover transition
    const hoverTarget = hovered || selected ? 1 : 0;
    hoverRef.current += (hoverTarget - hoverRef.current) * 0.08;

    // Update shader uniforms
    material.uniforms.uTime.value = t;
    material.uniforms.uHover.value = hoverRef.current;

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
      <primitive object={material} attach="material" />
    </mesh>
  );
}
