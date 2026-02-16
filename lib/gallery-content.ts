/* ================================================================
   Gallery v2 — Content & Spatial Layout
   Maps projects to 3D pieces with position, geometry, and color.
   Positions are aligned with pedestals in Architecture.tsx.
   ================================================================ */

export type PieceGeometry = 'box' | 'octahedron' | 'torus' | 'icosahedron';

export interface GalleryPiece {
  id: string;
  title: string;
  category: string;
  label: string;
  tag: string;
  description: string;
  color: string;
  emissive: string;
  geometry: PieceGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export const GALLERY_PIECES: GalleryPiece[] = [
  {
    id: 'automation-platform',
    title: 'Automation Platform',
    category: 'FINTECH',
    label: 'PROJ-001',
    tag: 'FRAGILE: REAL MONEY',
    description:
      'An automation and testing platform for fintech systems that move real money. Focused on reliability, edge cases, and catching things before users notice.',
    color: '#FF5C00',
    emissive: '#FF5C00',
    geometry: 'box',
    position: [-4, 1.1, -3],      // on left pedestal (0.6 high + piece center)
    rotation: [0, Math.PI / 6, 0],
    scale: 0.9,
  },
  {
    id: 'bender',
    title: 'Bender — AI Testing Assistant',
    category: 'AI',
    label: 'PROJ-002',
    tag: 'HANDLE WITH CARE',
    description:
      'An AI assistant focused on making test results understandable for humans. Less logs. Less guessing. More context when something breaks.',
    color: '#E8D44D',
    emissive: '#E8D44D',
    geometry: 'octahedron',
    position: [0, 0.9, -5],       // on center pedestal (0.3 high)
    rotation: [0.2, 0, 0.1],
    scale: 0.8,
  },
  {
    id: 'quality-processes',
    title: 'Testing, Reliability & Feedback Loops',
    category: 'QUALITY',
    label: 'PROJ-003',
    tag: 'DO NOT SHIP UNTESTED',
    description:
      'Quality as an ongoing process, not a phase. Clear signals, early failures, and feedback you can actually act on.',
    color: '#D62828',
    emissive: '#D62828',
    geometry: 'torus',
    position: [4, 1.5, -2.5],     // on tall right pedestal (0.9 high)
    rotation: [Math.PI / 4, 0, 0],
    scale: 0.75,
  },
  {
    id: 'experiments',
    title: 'Experiments & Side Projects',
    category: 'MISC',
    label: 'PROJ-004',
    tag: 'VOLATILE',
    description:
      'Small systems and experiments where I explore ideas around design, tooling, and interaction. Mostly to learn. Sometimes to ship.',
    color: '#0038FF',
    emissive: '#0038FF',
    geometry: 'icosahedron',
    position: [2, 1.2, -7],       // on back pedestal (0.5 high)
    rotation: [0, Math.PI / 3, 0.15],
    scale: 0.65,
  },
];
