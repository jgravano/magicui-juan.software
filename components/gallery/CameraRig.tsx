'use client';

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GALLERY } from '@/lib/gallery-config';

/**
 * Camera rig with cinematic intro:
 * Starts close to center piece, slowly pulls back to reveal the gallery.
 * After intro completes, switches to orbit controls.
 */
export function CameraRig() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const introProgress = useRef(0);
  const introComplete = useRef(false);

  // Start camera very close, looking at center
  useEffect(() => {
    camera.position.set(0, 1.8, 2);
    camera.lookAt(0, 1.5, -4);
  }, [camera]);

  useFrame((_, delta) => {
    if (introComplete.current) return;

    introProgress.current += delta * 0.15; // ~6.5 seconds for full intro
    const t = Math.min(introProgress.current, 1);

    // Ease out cubic
    const ease = 1 - Math.pow(1 - t, 3);

    // Interpolate from close to final position
    const startPos = new THREE.Vector3(0, 1.8, 2);
    const endPos = new THREE.Vector3(...GALLERY.camera.position);
    camera.position.lerpVectors(startPos, endPos, ease);

    // Interpolate lookAt
    const startLook = new THREE.Vector3(0, 1.5, -4);
    const endLook = new THREE.Vector3(...GALLERY.camera.lookAt);
    const currentLook = new THREE.Vector3().lerpVectors(startLook, endLook, ease);
    camera.lookAt(currentLook);

    if (t >= 1) {
      introComplete.current = true;
      if (controlsRef.current) {
        controlsRef.current.target.copy(endLook);
        controlsRef.current.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.5}
      minDistance={GALLERY.camera.minDistance}
      maxDistance={GALLERY.camera.maxDistance}
      minPolarAngle={GALLERY.camera.minPolarAngle}
      maxPolarAngle={GALLERY.camera.maxPolarAngle}
      target={[...GALLERY.camera.lookAt]}
      enablePan={false}
      enabled={introComplete.current}
    />
  );
}
