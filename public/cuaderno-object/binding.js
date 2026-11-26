import * as THREE from './vendor/three.module.min.js';
import {holeLayout} from './design-tools.js';

const RING_SEGMENTS = 64;
const SPIRAL_SEGMENTS_PER_TURN = 48;
const WIRE_SEGMENTS = 8;
const DOUBLE_RING_OFFSET = .023;

class Coil extends THREE.Curve {
  constructor(dims, turns = 1, startY = 0, span = 0) {
    super();
    this.dims = dims;
    this.turns = turns;
    this.startY = startY;
    this.span = span;
  }

  getPoint(t, target = new THREE.Vector3()) {
    const angle = t * Math.PI * 2 * this.turns;
    const {radiusX, radiusZ, centerZ} = this.dims;
    return target.set(
      Math.cos(angle) * radiusX,
      this.startY + t * this.span,
      Math.sin(angle) * radiusZ + centerZ,
    );
  }
}

// Repeated rings share one geometry and one draw, including in shadow passes.
// Placement remains independent of geometry so every wire meets its paper hole.
export function createBinding(group, material) {
  let mesh = null;
  const transform = new THREE.Matrix4();

  function clear() {
    if (!mesh) return;
    group.remove(mesh);
    mesh.geometry.dispose();
    mesh.dispose?.();
    mesh = null;
  }

  function rebuild(config, dims) {
    clear();
    const layout = holeLayout(config, dims);

    if (config.binding === 'spiral') {
      const curve = new Coil(dims, config.loops - 1, layout.y[0], layout.y.at(-1) - layout.y[0]);
      const geometry = new THREE.TubeGeometry(curve, config.loops * SPIRAL_SEGMENTS_PER_TURN, config.wire, WIRE_SEGMENTS, false);
      mesh = new THREE.Mesh(geometry, material);
    } else {
      const offsets = config.binding === 'double' ? [-DOUBLE_RING_OFFSET, DOUBLE_RING_OFFSET] : [0];
      const geometry = new THREE.TubeGeometry(new Coil(dims), RING_SEGMENTS, config.wire, WIRE_SEGMENTS, true);
      mesh = new THREE.InstancedMesh(geometry, material, config.loops * offsets.length);
      let index = 0;
      for (const y of layout.y) for (const offset of offsets) {
        mesh.setMatrixAt(index++, transform.makeTranslation(0, y + offset, 0));
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
    }

    mesh.name = 'notebook-binding';
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  return {rebuild, dispose: clear};
}
