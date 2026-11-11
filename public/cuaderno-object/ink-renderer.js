// Texture-space ink: 1024 px spans the sheet. Midpoint curves make every live
// segment final as soon as its next sample arrives, including coalesced samples.
const DEFAULT_WIDTH = 3.4;
const DEFAULT_COLOR = '#182522';
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const mix = (a, b, t) => a + (b - a) * t;
const paperAspect = options => Number.isFinite(options.aspectRatio) && options.aspectRatio > 0 ? options.aspectRatio : 1;

export function normalizeInkPoint(point) {
  if (!Array.isArray(point) || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) return null;
  return [
    clamp(point[0], 0, 1024), clamp(point[1], 0, 1024),
    Number.isFinite(point[2]) ? clamp(point[2], 0, 1) : .5,
    Number.isFinite(point[3]) ? clamp(point[3], -90, 90) : 0,
    Number.isFinite(point[4]) ? clamp(point[4], -90, 90) : 0,
  ];
}

// A fine ink nib responds mostly to pressure. Tilt changes the footprint gently;
// it never turns into the broad, pale side of a graphite pencil.
export function inkWidth(point, options = {}) {
  const p = normalizeInkPoint(point);
  if (!p) return 0;
  const width = Number.isFinite(options.width) ? clamp(options.width, .5, 12) : DEFAULT_WIDTH;
  const pressure = .34 + .86 * Math.pow(p[2], .65);
  const tilt = Math.min(1, Math.hypot(p[3], p[4]) / 90);
  return width * pressure * (1 + tilt * .055);
}

function sample(stroke, index, options) {
  const point = normalizeInkPoint(stroke[index]);
  if (!point) return null;
  // Local pressure filtering is causal: adding a point cannot change a segment
  // that was already rasterised. Missing pressure in old strokes remains .5.
  const previous = normalizeInkPoint(stroke[index - 1]);
  if (previous) point[2] = mix(previous[2], point[2], .72);
  return {x: point[0], y: point[1] * paperAspect(options), width: inkWidth(point, options)};
}

const midpoint = (a, b) => ({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, width: (a.width + b.width) / 2});

function withInk(ctx, options, draw) {
  ctx.save();
  if (options.mirrorX) {
    ctx.translate(Number.isFinite(options.textureWidth) ? options.textureWidth : 1024, 0);
    ctx.scale(-1, 1);
  }
  // The square texture stretches over a rectangular sheet. Build the nib in
  // physical page space, then undo that stretch while rasterising the texture.
  const aspect = paperAspect(options);
  if (aspect !== 1) ctx.scale(1, 1 / aspect);
  ctx.fillStyle = options.color || DEFAULT_COLOR;
  // Live page textures already contain transparent punched holes. Replay can
  // use source-over before the holes are cut; incremental ink must keep alpha.
  ctx.globalCompositeOperation = options.preserveAlpha ? 'source-atop' : 'source-over';
  draw();
  ctx.restore();
}

function outline(ctx, samples, spread = 0) {
  const first = samples[0], last = samples[samples.length - 1];
  ctx.beginPath();
  samples.forEach((p, index) => {
    const radius = p.radius + spread;
    ctx[index ? 'lineTo' : 'moveTo'](p.x - p.ty * radius, p.y + p.tx * radius);
  });
  const endAngle = Math.atan2(last.ty, last.tx);
  ctx.arc(last.x, last.y, last.radius + spread, endAngle + Math.PI / 2, endAngle - Math.PI / 2, true);
  for (let i = samples.length - 1; i >= 0; i--) {
    const p = samples[i], radius = p.radius + spread;
    ctx.lineTo(p.x + p.ty * radius, p.y - p.tx * radius);
  }
  const startAngle = Math.atan2(first.ty, first.tx);
  ctx.arc(first.x, first.y, first.radius + spread, startAngle - Math.PI / 2, startAngle - Math.PI * 1.5, true);
  ctx.closePath();
  ctx.fill();
}

function curve(ctx, start, control, end) {
  const length = Math.hypot(control.x - start.x, control.y - start.y) + Math.hypot(end.x - control.x, end.y - control.y);
  if (length < .01) return;
  const steps = clamp(Math.ceil(length / 1.35), 2, 128), samples = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, u = 1 - t;
    const x = u * u * start.x + 2 * u * t * control.x + t * t * end.x;
    const y = u * u * start.y + 2 * u * t * control.y + t * t * end.y;
    let tx = 2 * (u * (control.x - start.x) + t * (end.x - control.x));
    let ty = 2 * (u * (control.y - start.y) + t * (end.y - control.y));
    if (Math.hypot(tx, ty) < .0001) { tx = end.x - start.x; ty = end.y - start.y; }
    const norm = Math.hypot(tx, ty) || 1;
    // Subpixel, coordinate-anchored edge variation suggests absorption in paper
    // without speckles, gaps or a crayon texture. Replaying gives identical ink.
    const fibre = Math.sin(x * 2.73 + y * 3.17) * Math.sin(x * 1.13 - y * 2.41) * .025;
    const width = u * u * start.width + 2 * u * t * control.width + t * t * end.width;
    samples.push({x, y, tx: tx / norm, ty: ty / norm, radius: Math.max(.15, width / 2 + fibre)});
  }
  // A narrow absorbed edge under a nearly opaque core keeps strokes dark and
  // crisp while avoiding a hard vector cutout against the paper's own fibres.
  ctx.globalAlpha = .12;
  outline(ctx, samples, .12);
  ctx.globalAlpha = .96;
  outline(ctx, samples);
}

/** Draw one newly appended sample. Call once for each index, in order. */
export function drawInkSegment(ctx, stroke, index, options = {}) {
  if (!Array.isArray(stroke) || !Number.isInteger(index) || index < 0 || index >= stroke.length) return false;
  const point = sample(stroke, index, options);
  if (!point) return false;
  if (index === 0) {
    withInk(ctx, options, () => {
      ctx.globalAlpha = .96;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.width * .34, 0, Math.PI * 2);
      ctx.fill();
    });
    return true;
  }
  const previous = sample(stroke, index - 1, options);
  const before = index > 1 ? sample(stroke, index - 2, options) : null;
  if (!previous || (index > 1 && !before)) return false;
  const start = before ? midpoint(before, previous) : {...previous, width: previous.width * .68};
  const end = midpoint(previous, point);
  withInk(ctx, options, () => curve(ctx, start, previous, end));
  return true;
}

/** Complete the trailing half-segment once, on pointerup. */
export function finishInkStroke(ctx, stroke, options = {}) {
  if (!Array.isArray(stroke) || stroke.length < 2) return false;
  const end = sample(stroke, stroke.length - 1, options);
  const previous = sample(stroke, stroke.length - 2, options);
  if (!end || !previous) return false;
  const start = midpoint(previous, end);
  const tip = {...end, width: end.width * .42};
  withInk(ctx, options, () => curve(ctx, start, {...midpoint(start, end), width: mix(start.width, tip.width, .55)}, tip));
  return true;
}

/** Replay saved pressure-aware or legacy [x,y] strokes onto a fresh page. */
export function renderInkStroke(ctx, stroke, options = {}) {
  if (!Array.isArray(stroke)) return;
  for (let index = 0; index < stroke.length; index++) drawInkSegment(ctx, stroke, index, options);
  finishInkStroke(ctx, stroke, options);
}
