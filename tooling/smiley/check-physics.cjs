// Run with node tooling/smiley/check-physics.cjs (no browser dependencies).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const cache = {};
function load(name) {
  if (cache[name]) return cache[name];
  const source = fs.readFileSync(path.join(__dirname, '../../src/lib/smiley', name + '.ts'), 'utf8');
  const exports = {};
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { exports, require: id => load(id.split('/').pop()), Math, Number });
  return cache[name] = exports;
}
const sim = load('simulation');
function tick(state, seconds, fps = 60, reduced = false) {
  for (let i = 0; i < Math.round(seconds * fps); i++) sim.advanceSmileyInteraction(state, 1 / fps, reduced);
}
function gesture(fps) {
  const state = sim.createSmileyInteractionState();
  sim.beginSmileyPress(state, 0, { x: .3, y: .2 }, 1);
  tick(state, .5, fps);
  sim.moveSmileyPress(state, 0, { x: 2, y: 1 }, 1);
  tick(state, .5, fps);
  sim.endSmileyPress(state, 0);
  tick(state, .5, fps);
  return state;
}
const reference = gesture(60);
for (const fps of [30, 120, 144]) {
  const state = gesture(fps);
  assert.ok(Math.abs(state.drag.offset.x - reference.drag.offset.x) < 1e-10, `refresh ${fps}`);
  assert.ok(Math.abs(state.wobble - reference.wobble) < 1e-10);
}
const state = sim.createSmileyInteractionState();
sim.beginSmileyPress(state, 0, { x: 0, y: 0 }, 1);
sim.moveSmileyPress(state, 0, { x: 1, y: 0 }, 1);
const edge = state.drag.targetOffset.x;
sim.moveSmileyPress(state, 0, { x: 3, y: 0 }, 1);
assert.ok(state.drag.targetOffset.x > edge, 'pull continues beyond silhouette');
assert.ok(state.drag.targetOffset.x < .62, 'progressive resistance remains bounded');
tick(state, 1);
sim.endSmileyPress(state, 0);
let crossed = false;
for (let i = 0; i < 120; i++) {
  sim.advanceSmileyInteraction(state, 1 / 60, false);
  crossed ||= state.drag.offset.x < 0;
}
assert.ok(crossed, 'release overshoots');
tick(state, 10);
assert.ok(Math.abs(state.drag.offset.x) < .001 && Math.abs(state.body.offset.x) < .001, 'settles');
for (let i = 0; i < 1000; i++) {
  sim.beginSmileyPress(state, 0, { x: .5, y: .2 }, 1);
  sim.beginSmileyPress(state, 1, { x: -.5, y: -.2 }, 1);
  sim.moveSmileyPress(state, 1, { x: -3, y: 2 }, 1);
  sim.triggerSmileyPulse(state, { x: 0, y: 0 });
  sim.advanceSmileyInteraction(state, 1 / 60, false);
  sim.endSmileyPress(state, 0);
  sim.endSmileyPress(state, 1);
}
assert.ok(Number.isFinite(state.wobble) && Math.abs(state.wobble) < 2);
tick(state, 15);
assert.ok(Math.abs(state.wobble) < .001 && Math.abs(state.pinch.amount) < .001);
sim.triggerSmileyPulse(state, { x: 0, y: 0 });
tick(state, 1, 60, true);
assert.equal(state.pulse.velocity, 0);
assert.equal(state.wobbleVelocity, 0);
console.log('PASS: refresh invariance, elastic travel, release overshoot, settling, repeated pinch/pulse stress, reduced motion');
