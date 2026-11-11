import test from 'node:test';
import assert from 'node:assert/strict';
import { INK_LIMITS, LEGACY_INK_KEY, inkStorageKey, inkDesignKey, inkCounts, canAddInkStroke, canAddInkPoint, normalizeInk, loadInk, saveInk } from '../public/cuaderno-object/ink-storage.js';

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), values };
}

test('legacy drawing migrates only on explicit Studio request and remains recoverable', () => {
  const legacy = JSON.stringify({ 2: [[[20, 30], [31, 41]]], 3: [[[100, 200]]] });
  const disk = storage({ [LEGACY_INK_KEY]: legacy, 'taco-builder-001-v1': 'keep the design' });
  assert.equal(loadInk(disk, 'public:001').status, 'empty');
  const loaded = loadInk(disk, 'studio:standalone', { migrateLegacy: true });
  assert.equal(loaded.status, 'migrated');
  assert.deepEqual(loaded.ink[2][0], [[20, 30, .5, 0, 0], [31, 41, .5, 0, 0]]);
  assert.ok(saveInk(disk, 'studio:standalone', loaded.ink).ok);
  assert.deepEqual(loadInk(disk, 'studio:standalone').ink, loaded.ink);
  assert.equal(disk.getItem(LEGACY_INK_KEY), legacy);
  assert.equal(disk.getItem('taco-builder-001-v1'), 'keep the design');
  assert.equal(loadInk(disk, 'public:001').status, 'empty');
});

test('pressure, tilt, separate pages, and single-point dots survive reloads', () => {
  const ink = { 1: [[[0, 1024, 0, -90, 90]]], 2: [[[10.125, 20.987, .1234, -12.34, 9.87], [50, 80, 1, 5, -4]]] };
  const disk = storage();
  assert.ok(saveInk(disk, 'public:001', ink).ok);
  const loaded = loadInk(disk, 'public:001');
  assert.equal(loaded.status, 'loaded');
  assert.deepEqual(loaded.ink, { 1: [[[0, 1024, 0, -90, 90]]], 2: [[[10.13, 20.99, .123, -12.3, 9.9], [50, 80, 1, 5, -4]]] });
  assert.equal(ink[2][0][0][0], 10.125, 'saving must not mutate live samples');
  assert.deepEqual(inkCounts(loaded.ink), { points: 3, strokes: 2 });
});

test('shared designs and projects never reuse public handwriting', () => {
  const first = inkDesignKey('á first'), other = inkDesignKey('á second');
  assert.equal(first, inkDesignKey('á first'));
  assert.notEqual(first, other);
  const disk = storage();
  saveInk(disk, 'public:001', { 2: [[[3, 4]]] });
  saveInk(disk, first, { 2: [[[8, 9]]] });
  assert.equal(loadInk(disk, first).ink[2][0][0][0], 8);
  assert.equal(loadInk(disk, 'public:001').ink[2][0][0][0], 3);
  assert.equal(loadInk(disk, other).status, 'empty');
  assert.equal(loadInk(disk, 'project:another').status, 'empty');
});

test('malformed storage is bounded and cannot pollute objects or discard valid strokes silently', () => {
  const hostile = JSON.parse('{"__proto__":{"polluted":true},"-1":[],"2":[null,[],[[2,3],["4",5],[8,9,2,120,-100]]],"3":[[[20,30,null]]]}');
  const result = normalizeInk(hostile);
  assert.equal(result.status, 'sanitized');
  assert.deepEqual(result.ink, { 2: [[[2, 3, .5, 0, 0], [8, 9, 1, 90, -90]]], 3: [[[20, 30, .5, 0, 0]]] });
  assert.equal({}.polluted, undefined);
  const disk = storage({ [inkStorageKey('public:001')]: '{bad json' });
  assert.equal(loadInk(disk, 'public:001').status, 'invalid');
  assert.deepEqual(saveInk(disk, 'public:001', {}), { ok: false, reason: 'existing-data' });
  assert.equal(disk.getItem(inkStorageKey('public:001')), '{bad json');
});

test('unsupported envelopes and wrong design identities never load as legacy', () => {
  for (const envelope of [{ version: 3, designKey: 'public:001', ink: {} }, { version: 2, designKey: 'another', ink: {} }]) {
    const disk = storage({ [inkStorageKey('public:001')]: JSON.stringify(envelope), [LEGACY_INK_KEY]: '{"2":[[[1,2]]]}' });
    assert.equal(loadInk(disk, 'public:001', { migrateLegacy: true }).status, 'invalid');
  }
});

test('limits stop new marks without evicting saved handwriting', () => {
  const disk = storage();
  const initial = { 2: [[[1, 2]]] };
  saveInk(disk, 'public:001', initial);
  const previous = disk.getItem(inkStorageKey('public:001'));
  const oversized = { 2: [Array.from({ length: INK_LIMITS.pointsPerStroke + 1 }, () => [1, 2])] };
  assert.equal(normalizeInk(oversized).status, 'limit');
  assert.deepEqual(saveInk(disk, 'public:001', oversized), { ok: false, reason: 'limit' });
  assert.equal(disk.getItem(inkStorageKey('public:001')), previous);
  assert.equal(canAddInkPoint(Array(INK_LIMITS.pointsPerStroke), 0), false);
  assert.equal(canAddInkPoint([], INK_LIMITS.points), false);
  assert.equal(canAddInkStroke({ 2: Array(INK_LIMITS.strokesPerPage).fill([[1, 2]]) }, 2), false);
  assert.equal(canAddInkStroke(initial, 2), true);
  const total = { 2: Array.from({ length: 8 }, () => Array.from({ length: 8000 }, () => [1, 2])) };
  assert.equal(normalizeInk(total).status, 'limit');
});

test('storage denial and quota exhaustion keep in-memory input untouched', () => {
  const ink = { 2: [[[10, 20, .7, 30, -20]]] }, copy = structuredClone(ink);
  const unavailable = { getItem() { throw new Error('SecurityError'); } };
  assert.equal(loadInk(unavailable, 'public:001').status, 'unavailable');
  const full = { getItem() { return null; }, setItem() { throw new Error('QuotaExceededError'); } };
  assert.deepEqual(saveInk(full, 'public:001', ink), { ok: false, reason: 'unavailable' });
  assert.deepEqual(ink, copy);
});
