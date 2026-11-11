import * as THREE from './vendor/three.module.min.js';
import {MM} from './design-tools.js';

const PADDING = .12;
const PENUMBRA = .036;
const CONTACT_HEIGHT = .04;
const SIZE = 512;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

// Local ambient contact, complementary to the directional shadow maps. The
// transparent cover otherwise leaves no occlusion cue at its supporting edge.
export function createContactOcclusion(parent) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.name = 'Cover contact occlusion';
  texture.colorSpace = THREE.NoColorSpace;
  const geometry = new THREE.PlaneGeometry(1, 1);
  const make = name => {
    const material = new THREE.MeshBasicMaterial({
      map: texture, color: 0x000000, transparent: true,
      opacity: .18, depthWrite: false, toneMapped: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.renderOrder = -1;
    parent.add(mesh);
    return mesh;
  };
  const right = make('right-cover-contact');
  const left = make('left-cover-contact');
  left.rotation.z = Math.PI;
  let signature = '', projectedWidth = 0, disposed = false;

  function rebuild(config, dims, angle) {
    projectedWidth = dims.coverWidth * Math.cos(angle);
    const width = projectedWidth + PADDING * 2;
    const height = dims.coverHeight + PADDING * 2;
    const halfWidth = projectedWidth / 2, halfHeight = dims.coverHeight / 2;
    const radius = Math.min(config.cornerRadius / MM, halfWidth, halfHeight);
    const image = context.createImageData(SIZE, SIZE);
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const px = ((x + .5) / SIZE - .5) * width;
      const py = ((y + .5) / SIZE - .5) * height;
      const qx = Math.abs(px) - halfWidth + radius;
      const qy = Math.abs(py) - halfHeight + radius;
      const distance = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
      const outside = Math.max(0, distance);
      const edge = .72 * Math.exp(-outside * outside / (2 * PENUMBRA * PENUMBRA)) + .28 * Math.exp(-outside / .012);
      const interior = Math.exp(-Math.max(0, -distance) / .055);
      // Outer cover edges touch the desk; the raised spine must not acquire a
      // broad black halo. Height falloff is in scene units, not texture pixels.
      const gap = Math.max(0, halfWidth - px) * Math.tan(angle);
      const contact = Math.exp(-Math.pow(gap / CONTACT_HEIGHT, 1.6));
      const i = (y * SIZE + x) * 4;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = 255;
      image.data[i + 3] = Math.round(255 * edge * contact * interior);
    }
    context.putImageData(image, 0, 0);
    texture.needsUpdate = true;
    right.scale.set(width, height, 1);
    left.scale.set(width, height, 1);
  }

  return {
    update(config, dims, opened, restAngle) {
      if (disposed) return;
      const angle = Math.max(0, restAngle);
      const nextSignature = [dims.coverWidth, dims.coverHeight, config.cornerRadius, angle].join(':');
      if (nextSignature !== signature) {
        rebuild(config, dims, angle);
        signature = nextSignature;
      }
      const center = dims.coverWidth / 2 + .02;
      const floor = dims.floorZ + .0006;
      const opacity = .18 + .04 * clamp(config.opacity, 0, 1);
      const cosine = Math.cos(angle), sine = Math.sin(angle);
      right.position.set(center * cosine + dims.bottom * sine, 0, floor);
      right.material.opacity = opacity;

      const coverAngle = (1 - opened) * (Math.PI + angle) - opened * angle;
      const coverCos = Math.cos(coverAngle), coverSin = Math.sin(coverAngle);
      const externalZ = dims.bottom - dims.hinge;
      const outerX = dims.coverWidth + .02;
      const outerHeight = dims.hinge + outerX * coverSin + externalZ * coverCos - dims.floorZ;
      const heightFade = Math.exp(-Math.pow(Math.max(0, outerHeight) / CONTACT_HEIGHT, 1.6));
      const openingFade = clamp((opened - .8) / .2, 0, 1);
      left.position.set(-center * coverCos + externalZ * coverSin, 0, floor);
      // Only the last part of opening approaches the table. Transform and fade
      // the existing quad; there is no per-frame canvas draw or GPU allocation.
      left.scale.x = (dims.coverWidth * Math.abs(coverCos) + PADDING * 2);
      left.material.opacity = opacity * heightFade * openingFade;
      left.visible = left.material.opacity > .001;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      parent.remove(left, right);
      left.material.dispose(); right.material.dispose();
      geometry.dispose(); texture.dispose();
    },
  };
}
