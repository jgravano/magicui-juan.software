// Ink is device-local and never becomes part of a design preset or Studio draft.
export const INK_LIMITS = Object.freeze({
  pages: 512,
  strokesPerPage: 512,
  strokes: 4096,
  pointsPerStroke: 8192,
  points: 60000,
  serializedCharacters: 2400000,
});
export const LEGACY_INK_KEY = 'taco-ink-v1';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const record = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));

export function inkStorageKey(designKey) {
  if (typeof designKey !== 'string' || !designKey || designKey.length > 200) throw new TypeError('Invalid ink design key');
  return `taco-ink-v2:${encodeURIComponent(designKey)}`;
}

// Shared designs get their own notebook. The normal public 001 uses "public:001"
// instead, so publishing a visual refinement does not hide existing handwriting.
export function inkDesignKey(preset) {
  if (typeof preset !== 'string') throw new TypeError('A shared preset must be a string');
  let first = 2166136261, second = 5381;
  for (let i = 0; i < preset.length; i++) {
    first = Math.imul(first ^ preset.charCodeAt(i), 16777619);
    second = Math.imul(second, 33) ^ preset.charCodeAt(i);
  }
  return `preset:${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0).toString(16).padStart(8, '0')}`;
}

export function inkCounts(ink) {
  let points = 0, strokes = 0;
  for (const page of Object.values(ink)) {
    strokes += page.length;
    for (const stroke of page) points += stroke.length;
  }
  return { points, strokes };
}

export function canAddInkStroke(ink, page, counts = inkCounts(ink)) {
  return Number.isInteger(page) && page > 0 && page <= INK_LIMITS.pages &&
    (ink[page]?.length || 0) < INK_LIMITS.strokesPerPage &&
    counts.strokes < INK_LIMITS.strokes && counts.points < INK_LIMITS.points;
}

// Pass a running total during a gesture rather than traversing the notebook for
// each coalesced Pencil sample. Reaching a limit ends the stroke, never evicts one.
export function canAddInkPoint(stroke, totalPoints) {
  return stroke.length < INK_LIMITS.pointsPerStroke && totalPoints < INK_LIMITS.points;
}

/**
 * Accepts the original page -> stroke -> [x,y] structure and Pencil points
 * [x,y,pressure,tiltX,tiltY]. Invalid entries are reported; valid strokes survive.
 * Oversized documents are rejected as a whole, never returned as a silent crop.
 */
export function normalizeInk(value) {
  const empty = status => ({ ink: {}, status, points: 0, strokes: 0 });
  if (!record(value)) return empty('invalid');
  const entries = Object.entries(value);
  if (entries.length > INK_LIMITS.pages) return empty('limit');
  const ink = {};
  let sanitized = false, points = 0, strokes = 0;
  for (const [page, sourceStrokes] of entries) {
    if (!/^[1-9]\d{0,2}$/.test(page) || Number(page) > INK_LIMITS.pages || !Array.isArray(sourceStrokes)) {
      sanitized = true;
      continue;
    }
    if (sourceStrokes.length > INK_LIMITS.strokesPerPage) return empty('limit');
    const pageStrokes = [];
    for (const sourceStroke of sourceStrokes) {
      if (!Array.isArray(sourceStroke) || sourceStroke.length === 0) { sanitized = true; continue; }
      if (sourceStroke.length > INK_LIMITS.pointsPerStroke) return empty('limit');
      const stroke = [];
      for (const point of sourceStroke) {
        if (!Array.isArray(point) || point.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
          sanitized = true;
          continue;
        }
        // Two-coordinate legacy strokes have uniform pressure and no tilt.
        const normalized = [clamp(point[0], 0, 1024), clamp(point[1], 0, 1024)];
        if (normalized[0] !== point[0] || normalized[1] !== point[1]) sanitized = true;
        for (let i = 2; i < 5; i++) {
          const fallback = i === 2 ? .5 : 0;
          const raw = point[i] === undefined ? fallback : point[i];
          if (!Number.isFinite(raw)) sanitized = true;
          const next = Number.isFinite(raw) ? clamp(raw, i === 2 ? 0 : -90, i === 2 ? 1 : 90) : fallback;
          if (next !== raw) sanitized = true;
          normalized.push(next);
        }
        if (point.length > 5) sanitized = true;
        stroke.push(normalized);
        if (++points > INK_LIMITS.points) return empty('limit');
      }
      if (!stroke.length) continue;
      pageStrokes.push(stroke);
      if (++strokes > INK_LIMITS.strokes) return empty('limit');
    }
    if (pageStrokes.length) ink[page] = pageStrokes;
  }
  return { ink, status: sanitized ? 'sanitized' : 'valid', points, strokes };
}

function parse(raw, designKey, legacy = false) {
  if (raw.length > INK_LIMITS.serializedCharacters) return { ink: {}, status: 'limit' };
  let value;
  try { value = JSON.parse(raw); } catch { return { ink: {}, status: 'invalid' }; }
  if (legacy) return normalizeInk(value);
  if (!record(value) || value.version !== 2 || value.designKey !== designKey) return { ink: {}, status: 'invalid' };
  return normalizeInk(value.ink);
}

export function loadInk(storage, designKey, { migrateLegacy = false } = {}) {
  try {
    const raw = storage.getItem(inkStorageKey(designKey));
    if (raw !== null) {
      const result = parse(raw, designKey);
      return { ...result, status: result.status === 'valid' ? 'loaded' : result.status, legacy: false };
    }
    // Opt-in only for the old standalone Studio; public 001 never owned that ink.
    const old = migrateLegacy ? storage.getItem(LEGACY_INK_KEY) : null;
    if (old !== null) {
      const result = parse(old, designKey, true);
      return { ...result, status: result.status === 'valid' ? 'migrated' : result.status, legacy: true };
    }
    return { ink: {}, status: 'empty', legacy: false, points: 0, strokes: 0 };
  } catch {
    return { ink: {}, status: 'unavailable', legacy: false, points: 0, strokes: 0 };
  }
}

export function saveInk(storage, designKey, ink) {
  const normalized = normalizeInk(ink);
  if (normalized.status !== 'valid') return { ok: false, reason: normalized.status };
  // Round serialized input only; the live gesture retains full sample precision.
  const packed = {};
  for (const [page, strokes] of Object.entries(normalized.ink)) packed[page] = strokes.map(stroke => stroke.map(point => point.map((n, i) => {
    const scale = i < 2 ? 100 : i === 2 ? 1000 : 10;
    return Math.round(n * scale) / scale;
  })));
  const raw = JSON.stringify({ version: 2, designKey, ink: packed });
  if (raw.length > INK_LIMITS.serializedCharacters) return { ok: false, reason: 'limit' };
  try {
    const key = inkStorageKey(designKey), previous = storage.getItem(key);
    // A bad or oversized existing record must not be replaced by an empty load.
    // Keep it intact so the user's previous drawing remains recoverable.
    if (previous !== null && parse(previous, designKey).status !== 'valid') return { ok: false, reason: 'existing-data' };
    storage.setItem(key, raw);
    return { ok: true, reason: null };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
