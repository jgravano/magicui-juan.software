import test from 'node:test';
import assert from 'node:assert/strict';
import { createPointerGuard } from '../public/cuaderno-object/pointer-guard.js';

const touch = id => ({ pointerId: id, pointerType: 'touch' });
const pen = id => ({ pointerId: id, pointerType: 'pen' });
const mouse = id => ({ pointerId: id, pointerType: 'mouse' });

test('one finger can manipulate the notebook and two fingers can pinch', () => {
  const guard = createPointerGuard();
  assert.equal(guard.move(touch(1), 0), false, 'an untracked touch is not a gesture');
  assert.deepEqual(guard.down(touch(1), 0), { accepted: true, penTookOver: false });
  assert.deepEqual(guard.down(touch(2), 10), { accepted: true, penTookOver: false });
  assert.ok(guard.move(touch(1), 20));
  assert.ok(guard.move(touch(2), 20));
  assert.ok(guard.end(touch(1), 30));
  assert.ok(guard.move(touch(2), 40));
  assert.ok(guard.end(touch(2), 50));
  assert.equal(guard.end(touch(2), 51), false, 'a duplicate end cannot release another gesture');
});

test('Pencil owns its stroke while palm, mouse and a second pen are ignored', () => {
  const guard = createPointerGuard();
  assert.deepEqual(guard.down(pen(9), 0), { accepted: true, penTookOver: false });
  assert.ok(guard.isPenActive());
  for (const contact of [touch(1), touch(2), mouse(3), pen(4)]) {
    assert.equal(guard.down(contact, 10).accepted, false);
    assert.equal(guard.move(contact, 20), false);
    assert.equal(guard.end(contact, 30), false);
    assert.ok(guard.isPenActive(), 'other pointer ends must not release Pencil');
  }
  assert.ok(guard.move(pen(9), 40));
  assert.ok(guard.end(pen(9), 50));
  assert.equal(guard.isPenActive(), false);
});

test('Pencil cancels earlier fingers and those held contacts cannot revive after cooldown', () => {
  const guard = createPointerGuard();
  guard.down(touch(1), 0);
  guard.down(touch(2), 1);
  assert.deepEqual(guard.down(pen(9), 2), { accepted: true, penTookOver: true });
  assert.equal(guard.move(touch(1), 3), false);
  assert.ok(guard.end(pen(9), 100));
  assert.equal(guard.move(touch(1), 1000), false);
  assert.equal(guard.down(touch(1), 1000).accepted, false);
  assert.equal(guard.end(touch(1), 1001), false);
  assert.equal(guard.end(touch(2), 1001), false);
  assert.equal(guard.down(touch(1), 1002).accepted, true, 'the same id is usable after an actual lift');
});

test('palm cooldown lasts 350ms and contacts rejected in that window stay rejected', () => {
  const guard = createPointerGuard();
  guard.down(pen(9), 0);
  guard.end(pen(9), 100);
  assert.equal(guard.down(touch(1), 449).accepted, false);
  assert.equal(guard.down(touch(2), 450).accepted, true);
  assert.equal(guard.move(touch(1), 600), false);
  assert.equal(guard.end(touch(1), 700), false);
  assert.equal(guard.down(touch(1), 701).accepted, true);
  assert.ok(guard.move(mouse(5), 701), 'mouse hover stays available');
  assert.ok(guard.move(pen(9), 701), 'Pencil hover stays available');
});

test('a new Pencil stroke can start during cooldown; cancellation and blur reset ownership', () => {
  const guard = createPointerGuard();
  guard.down(mouse(1), 0);
  assert.deepEqual(guard.down(pen(9), 10), { accepted: true, penTookOver: true });
  assert.equal(guard.end(mouse(1), 11), false);
  assert.ok(guard.end(pen(9), 12), 'pointercancel uses the same end path');
  assert.equal(guard.down(pen(10), 13).accepted, true);
  assert.ok(guard.isPenActive());
  guard.down(touch(2), 14);
  guard.reset();
  assert.equal(guard.isPenActive(), false);
  assert.equal(guard.end(pen(10), 15), false);
  assert.equal(guard.down(touch(2), 16).accepted, true);
});
