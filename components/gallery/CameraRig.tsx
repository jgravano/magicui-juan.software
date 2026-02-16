'use client';

import { OrbitControls } from '@react-three/drei';
import { GALLERY } from '@/lib/gallery-config';

export function CameraRig() {
  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.5}
      minDistance={GALLERY.camera.minDistance}
      maxDistance={GALLERY.camera.maxDistance}
      minPolarAngle={GALLERY.camera.minPolarAngle}
      maxPolarAngle={GALLERY.camera.maxPolarAngle}
      target={[...GALLERY.camera.lookAt]}
      enablePan={false}
    />
  );
}
