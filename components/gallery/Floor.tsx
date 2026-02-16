'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { GALLERY } from '@/lib/gallery-config';

export function Floor() {
  const gridMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(GALLERY.colors.floor) },
        uGridColor: { value: new THREE.Color(GALLERY.colors.floorGrid) },
        uSize: { value: GALLERY.floor.size },
        uDivisions: { value: GALLERY.floor.gridDivisions },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uGridColor;
        uniform float uSize;
        uniform float uDivisions;
        varying vec2 vUv;
        varying vec3 vWorldPos;

        void main() {
          float halfSize = uSize * 0.5;
          vec2 worldUv = vWorldPos.xz;

          // Grid lines
          float cellSize = uSize / uDivisions;
          vec2 grid = abs(fract(worldUv / cellSize - 0.5) - 0.5);
          float line = min(grid.x, grid.y);
          float gridLine = 1.0 - smoothstep(0.0, 0.02, line);

          // Fade grid at edges
          vec2 edgeDist = abs(worldUv) / halfSize;
          float edgeFade = 1.0 - smoothstep(0.5, 0.95, max(edgeDist.x, edgeDist.y));

          vec3 color = mix(uColor, uGridColor, gridLine * edgeFade * 0.5);

          // Subtle radial vignette on floor
          float dist = length(worldUv) / halfSize;
          color *= 1.0 - smoothstep(0.3, 1.0, dist) * 0.3;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[GALLERY.floor.size, GALLERY.floor.size, 1, 1]} />
      <primitive object={gridMaterial} attach="material" />
    </mesh>
  );
}
