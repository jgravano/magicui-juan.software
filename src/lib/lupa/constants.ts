export const LUPA_MIN_CANVAS_WIDTH = 1;
export const LUPA_MIN_CANVAS_HEIGHT = 1;
export const LUPA_MAX_DEVICE_PIXEL_RATIO = 2;
export const LUPA_MAX_FRAME_DELTA_SECONDS = 1 / 24;

export const LUPA_HINT_DURATION_MS = 2200;

export const LUPA_LENS_ZOOM = 1.6;
export const LUPA_LENS_SMOOTHING_LAMBDA = 16;
export const LUPA_LENS_RADIUS_RATIO = 0.16;
export const LUPA_LENS_RADIUS_MIN_PX = 108;
export const LUPA_LENS_RADIUS_MAX_PX = 232;

// Lower base text scale so paper is mostly unreadable without the lens.
export const LUPA_TYPOGRAPHY_SCALE = 0.72;

// Render a rotating subset from the full dictionary by stitching random slices.
export const LUPA_DICTIONARY_FRAGMENT_COUNT = 5;
export const LUPA_DICTIONARY_FRAGMENT_MIN_RATIO = 0.012;
export const LUPA_DICTIONARY_FRAGMENT_MAX_RATIO = 0.035;
export const LUPA_DICTIONARY_FRAGMENT_MIN_SIZE = 6;
export const LUPA_DICTIONARY_FRAGMENT_MAX_SIZE = 260;
export const LUPA_DICTIONARY_REFRESH_SHARD_COUNT = 4;

// Backwards-compatible aliases for legacy modules under `src/lib/lupa/*`.
export const LUPA_LENS_MAGNIFICATION = LUPA_LENS_ZOOM;
export const LUPA_LENS_RADIUS_VIEWPORT_RATIO = LUPA_LENS_RADIUS_RATIO;
export const LUPA_LENS_SPRING_STIFFNESS = 120;
export const LUPA_LENS_SPRING_DAMPING = 24;
