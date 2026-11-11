import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeInkPoint, inkWidth, drawInkSegment, finishInkStroke, renderInkStroke} from '../public/cuaderno-object/ink-renderer.js';

function context() {
  const commands = [];
  const ctx = {commands};
  Object.defineProperty(ctx, 'globalCompositeOperation', {set(value) { commands.push(['composite', value]); }});
  for (const name of ['save', 'restore', 'beginPath', 'closePath', 'fill', 'moveTo', 'lineTo', 'arc', 'translate', 'scale']) {
    ctx[name] = (...args) => { assert.ok(args.every(value => typeof value !== 'number' || Number.isFinite(value))); commands.push([name, ...args]); };
  }
  return ctx;
}

test('legacy handwriting remains a medium-pressure stroke; zero pressure is retained', () => {
  assert.deepEqual(normalizeInkPoint([123, 456]), [123, 456, .5, 0, 0]);
  assert.deepEqual(normalizeInkPoint([123, 456, 0, 140, -100]), [123, 456, 0, 90, -90]);
  assert.equal(normalizeInkPoint([NaN, 20]), null);
  assert.equal(normalizeInkPoint(null), null);
});

test('pressure grows the fine nib monotonically, with restrained tilt influence', () => {
  const widths = [0, .1, .3, .6, 1].map(pressure => inkWidth([10, 20, pressure]));
  assert.ok(widths.every((width, index) => width > 0 && (index === 0 || width > widths[index - 1])));
  assert.ok(widths.at(-1) < 4.2);
  assert.ok(inkWidth([10, 20, .5, 80, 80]) < inkWidth([10, 20, .5]) * 1.06);
});

test('incremental coalesced samples and saved-stroke replay generate identical marks', () => {
  const stroke = [[10, 20, .08], [12, 24, .3, 20, 10], [16, 31, .8, 25, 15], [22, 35, .4], [26, 35, .06]];
  const live = context(), replay = context(), growing = [];
  for (const point of stroke) { growing.push(point); drawInkSegment(live, growing, growing.length - 1); }
  finishInkStroke(live, growing);
  renderInkStroke(replay, stroke);
  assert.deepEqual(live.commands, replay.commands);
});

test('stationary taps and corrupt samples produce no nonfinite geometry', () => {
  const ctx = context();
  renderInkStroke(ctx, [[30, 30], [30, 30], [30, 30, 0]]);
  renderInkStroke(ctx, [[30, 30], [Infinity, 50], [40, 40]]);
  assert.equal(drawInkSegment(ctx, [[30, 30]], -1), false);
  assert.equal(drawInkSegment(ctx, [[30, 30]], 2), false);
  assert.ok(ctx.commands.some(([name]) => name === 'arc'));
});

test('paper aspect corrects the nib footprint without moving texture-space marks', () => {
  const square = context(), portrait = context();
  renderInkStroke(square, [[100, 200, .5]]);
  renderInkStroke(portrait, [[100, 200, .5]], {aspectRatio: 2, mirrorX: true});
  const squareDot = square.commands.find(([name]) => name === 'arc');
  const portraitDot = portrait.commands.find(([name]) => name === 'arc');
  assert.deepEqual(portrait.commands.filter(([name]) => name === 'scale'), [['scale', -1, 1], ['scale', 1, .5]]);
  assert.equal(portraitDot[1], squareDot[1]);
  assert.equal(portraitDot[2] * .5, squareDot[2]);
  assert.equal(portraitDot[3], squareDot[3]);
  const invalid = context();
  renderInkStroke(invalid, [[100, 200]], {aspectRatio: 0});
  assert.equal(invalid.commands.some(([name]) => name === 'scale'), false);
});

test('live ink can preserve punched-hole transparency while fresh replay remains source-over', () => {
  const live = context(), replay = context();
  renderInkStroke(live, [[10, 20], [20, 30]], {preserveAlpha: true});
  renderInkStroke(replay, [[10, 20], [20, 30]]);
  assert.ok(live.commands.filter(([name]) => name === 'composite').every(([, value]) => value === 'source-atop'));
  assert.ok(replay.commands.filter(([name]) => name === 'composite').every(([, value]) => value === 'source-over'));
});
