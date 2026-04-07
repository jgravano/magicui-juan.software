---
name: r3f-component
description: Scaffold a new React Three Fiber component for v2 "Inside the Machine". Creates a typed component with proper R3F imports and structure.
disable-model-invocation: true
argument-hint: "[ComponentName]"
allowed-tools: Write, Read, Glob
---

Create a new R3F component for v2 at `components/gallery/$ARGUMENTS.tsx`.

If the component is an interactive fragment, place it in `components/gallery/fragments/$ARGUMENTS.tsx`.

## Template

```tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { GALLERY } from '@/lib/gallery-config';

interface ${ARGUMENTS}Props {
  // Add props here
}

export function $ARGUMENTS({ }: ${ARGUMENTS}Props) {
  const ref = useRef<Group>(null);

  useFrame((state, delta) => {
    // Animation loop — runs every frame
  });

  return (
    <group ref={ref}>
      {/* 3D content here */}
    </group>
  );
}
```

## Fragment Template (for components in fragments/)

```tsx
'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { GALLERY } from '@/lib/gallery-config';

interface ${ARGUMENTS}Props {
  position?: [number, number, number];
  onInteract?: () => void;
}

export function $ARGUMENTS({ position = [0, 0, 0], onInteract }: ${ARGUMENTS}Props) {
  const ref = useRef<Group>(null);
  const [active, setActive] = useState(false);

  useFrame((state, delta) => {
    // Animation loop
    // Fragment-specific interaction logic
  });

  return (
    <group ref={ref} position={position}>
      {/* Interactive 3D content */}
      {/* Each fragment should have a unique interaction mechanic */}
    </group>
  );
}
```

## Rules

1. Always use `'use client'` directive (R3F requires client-side rendering)
2. Import types from `three` (e.g., `Group`, `Mesh`, `Vector3`)
3. Use `useRef` + `useFrame` for animations (not useState for per-frame updates)
4. Import scene constants from `@/lib/gallery-config`
5. Export as named export (not default)
6. If the component renders HTML overlays inside 3D, use `@react-three/drei`'s `Html` component
7. Keep components focused — one responsibility per file
8. Fragments should have unique interaction mechanics — not just click-to-read

## After creating

- Tell the user where the file was created
- Suggest where to import it (likely `Gallery.tsx`)
- If it's a fragment, suggest adding it to the fragment system
