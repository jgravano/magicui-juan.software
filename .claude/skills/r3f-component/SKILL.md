---
name: r3f-component
description: Scaffold a new React Three Fiber component for the v2 gallery. Creates a typed component with proper R3F imports and structure.
disable-model-invocation: true
argument-hint: "[ComponentName]"
allowed-tools: Write, Read, Glob
---

Create a new R3F component for the v2 gallery at `components/gallery/$ARGUMENTS.tsx`.

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

## Rules

1. Always use `'use client'` directive (R3F requires client-side rendering)
2. Import types from `three` (e.g., `Group`, `Mesh`, `Vector3`)
3. Use `useRef` + `useFrame` for animations (not useState for per-frame updates)
4. Import scene constants from `@/lib/gallery-config`
5. Export as named export (not default)
6. If the component renders HTML overlays inside 3D, use `@react-three/drei`'s `Html` component
7. Keep components focused — one responsibility per file

## After creating

- Tell the user where the file was created
- Suggest where to import it (likely `Gallery.tsx` or `Scene.tsx`)
- If it's a sub-component (e.g., effects/Particles), create in the appropriate subdirectory
