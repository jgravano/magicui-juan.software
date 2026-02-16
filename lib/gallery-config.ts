/* ================================================================
   Gallery v2 — Scene Configuration
   Single source of truth for all 3D scene parameters.
   ================================================================ */

export const GALLERY = {
  /* ── Space dimensions ── */
  floor: {
    size: 60,           // floor plane extends 60x60 units
    gridDivisions: 40,  // subtle grid line count
  },

  /* ── Camera ── */
  camera: {
    fov: 50,
    near: 0.1,
    far: 200,
    position: [0, 2.5, 12] as const,    // start position: eye-level, looking in
    lookAt: [0, 1.5, 0] as const,       // look toward center of space
    minDistance: 3,
    maxDistance: 30,
    minPolarAngle: 0.3,                  // prevent looking straight up
    maxPolarAngle: Math.PI / 2 - 0.05,  // prevent going below floor
  },

  /* ── Colors ── */
  colors: {
    background: '#0a0a0a',
    floor: '#141414',
    floorGrid: '#1f1f1f',
    fog: '#0a0a0a',
    ambientLight: '#e8e0d4',
    directionalLight: '#ffffff',
    accentLight: '#FF5C00',
  },

  /* ── Lighting intensities ── */
  lighting: {
    ambient: 0.15,
    directional: 0.4,
    accent: 0.8,
  },

  /* ── Fog ── */
  fog: {
    near: 15,
    far: 50,
  },

  /* ── Performance ── */
  performance: {
    dpr: [1, 2] as const,       // device pixel ratio range
    shadowMapSize: 1024,
    maxLights: 8,
  },

  /* ── Pieces (project positions — populated in M2) ── */
  pieces: [] as {
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
  }[],
} as const;
