import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../public/cuaderno-object/vendor/three.module.min.js';
import {createBinding} from '../public/cuaderno-object/binding.js';
import {defaults, dimensions} from '../public/cuaderno-object/builder-model.js';
import {holeLayout} from '../public/cuaderno-object/design-tools.js';

const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-6, message);

test('instanced single and double rings preserve every hole position and physical radius', () => {
  const group = new THREE.Group(), material = new THREE.MeshPhysicalMaterial();
  const binding = createBinding(group, material), matrix = new THREE.Matrix4();
  try {
    for (const type of ['single', 'double']) for (const loops of [8, 24]) for (const pages of [32, 240]) {
      const config = {...defaults, binding: type, loops, pages};
      const dims = dimensions(config), layout = holeLayout(config, dims);
      const mesh = binding.rebuild(config, dims), offsets = type === 'double' ? [-.023, .023] : [0];
      assert.equal(group.children.length, 1, 'rings must share one draw');
      assert.equal(mesh.count, loops * offsets.length);
      assert.ok(mesh.castShadow && mesh.receiveShadow);
      assert.equal(mesh.material, material);
      let index = 0;
      for (const y of layout.y) for (const offset of offsets) {
        mesh.getMatrixAt(index++, matrix);
        close(matrix.elements[12], 0);
        close(matrix.elements[13], y + offset, 'wire must align with its paper hole');
        close(matrix.elements[14], 0);
      }
      const curve = mesh.geometry.parameters.path;
      close(curve.getPoint(0).x, dims.radiusX);
      close(curve.getPoint(.25).z, dims.centerZ + dims.radiusZ);
      close(curve.getPoint(.5).x, -dims.radiusX);
      close(curve.getPoint(.75).z, dims.centerZ - dims.radiusZ);
      assert.equal(mesh.geometry.parameters.radius, config.wire);
      assert.ok(mesh.geometry.index.count / 3 < 96 * 12 * 2 * .5, 'ring tessellation should cost less than half the original');
    }
  } finally { binding.dispose(); material.dispose(); }
});

test('spiral retains pitch, endpoints and open-ended topology', () => {
  const group = new THREE.Group(), material = new THREE.MeshPhysicalMaterial();
  const binding = createBinding(group, material);
  try {
    for (const loops of [8, 24]) {
      const config = {...defaults, binding: 'spiral', loops};
      const dims = dimensions(config), layout = holeLayout(config, dims);
      const mesh = binding.rebuild(config, dims), curve = mesh.geometry.parameters.path;
      assert.equal(group.children.length, 1);
      assert.equal(mesh.geometry.parameters.closed, false);
      assert.equal(mesh.geometry.parameters.radius, config.wire);
      for (let i = 0; i < loops; i++) {
        const point = curve.getPoint(i / (loops - 1));
        close(point.x, dims.radiusX);
        close(point.y, layout.y[i]);
        close(point.z, dims.centerZ);
      }
    }
  } finally { binding.dispose(); material.dispose(); }
});

test('rebuilding disposes old ring resources without disposing the shared material', () => {
  const group = new THREE.Group(), material = new THREE.MeshPhysicalMaterial();
  const binding = createBinding(group, material);
  let geometriesDisposed = 0, instancesDisposed = 0, materialDisposed = 0;
  material.addEventListener('dispose', () => materialDisposed++);
  const first = binding.rebuild(defaults, dimensions(defaults));
  first.geometry.addEventListener('dispose', () => geometriesDisposed++);
  first.addEventListener('dispose', () => instancesDisposed++);
  const spiralConfig = {...defaults, binding: 'spiral'};
  const second = binding.rebuild(spiralConfig, dimensions(spiralConfig));
  second.geometry.addEventListener('dispose', () => geometriesDisposed++);
  assert.equal(first.parent, null);
  assert.equal(geometriesDisposed, 1);
  assert.equal(instancesDisposed, 1);
  binding.dispose(); binding.dispose();
  assert.equal(geometriesDisposed, 2);
  assert.equal(group.children.length, 0);
  assert.equal(materialDisposed, 0);
  material.dispose();
});
