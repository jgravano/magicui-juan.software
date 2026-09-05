export const MAX_DEVICE_PIXEL_RATIO = 2;
export const MIN_CANVAS_WIDTH = 320;
export const MIN_CANVAS_HEIGHT = 480;
export const MOBILE_BREAKPOINT = 720;

export const DESKTOP_SPHERE_WIDTH_RATIO = 0.70;
export const DESKTOP_SPHERE_HEIGHT_RATIO = 0.76;
export const MOBILE_SPHERE_WIDTH_RATIO = 0.88;
export const MOBILE_SPHERE_HEIGHT_RATIO = 0.64;

export const SOURCE_CENTER_X = 0.5;
export const SOURCE_CENTER_Y = 0.505;
export const SOURCE_RADIUS_X = 0.36;
export const SOURCE_RADIUS_Y = 0.36;
export const MESH_SEGMENTS = 96;

export const PRESS_STIFFNESS = 145;
export const PRESS_DAMPING = 9.2;
export const RELEASE_STIFFNESS = 76;
export const RELEASE_DAMPING = 4.2;
export const CONTACT_FOLLOW_SPEED = 18;
export const HOVER_FOLLOW_SPEED = 12;
export const MAX_FRAME_DELTA_SECONDS = 0.1;

export const PINCH_TRAVEL_FOR_FULL_SQUEEZE = 0.52;
export const PINCH_TRAVEL_FOR_FULL_STRETCH = 0.46;
export const PINCH_MAX_SQUEEZE = 1.12;
export const PINCH_MAX_STRETCH = 0.72;
export const PINCH_PRESS_STIFFNESS = 118;
export const PINCH_PRESS_DAMPING = 12;
export const PINCH_RELEASE_STIFFNESS = 58;
export const PINCH_RELEASE_DAMPING = 4.1;
export const PINCH_RELEASE_REBOUND_SPEED = 2.2;
export const PINCH_RELEASE_WOBBLE_IMPULSE = 1.8;

export const DRAG_PULL_GAIN = 0.72;
export const DRAG_MAX_OFFSET = 0.62;
export const DRAG_FOLLOW_STIFFNESS = 190;
export const DRAG_FOLLOW_DAMPING = 17;
export const DRAG_RELEASE_STIFFNESS = 70;
export const DRAG_RELEASE_DAMPING = 4.4;
export const DRAG_RELEASE_WOBBLE_IMPULSE = 2.4;

export const SHADOW_FOLLOW_STIFFNESS = 34;
export const SHADOW_FOLLOW_DAMPING = 8.4;
export const SHADOW_DRAG_FOLLOW = 0.62;

export const PULSE_STIFFNESS = 88;
export const PULSE_DAMPING = 5.6;
export const PULSE_IMPULSE = 4.8;
export const PULSE_MAX_AMOUNT = 0.62;

export const DOUBLE_TAP_MAX_DELAY_MS = 330;
export const TAP_MAX_DURATION_MS = 280;
export const TAP_MOVE_TOLERANCE = 0.14;
export const TAP_POSITION_TOLERANCE = 0.38;

export const INITIAL_PRESS_STRENGTH = 0.66;
export const HOLD_PRESS_GAIN = 0.4;
export const HOLD_PRESS_DURATION_SECONDS = 0.65;
export const MIN_PRESSURE_SCALE = 0.92;
export const MAX_PRESSURE_SCALE = 1.12;

export const WOBBLE_STIFFNESS = 42;
export const WOBBLE_DAMPING = 3.6;
export const WOBBLE_RELEASE_IMPULSE = 2.7;

// Fixed integration keeps the same material response at 30–144 Hz.
export const PHYSICS_STEP_SECONDS = 1 / 240;
export const BODY_STIFFNESS = 95;
export const BODY_DAMPING = 5.8;
export const MAX_WOBBLE_SPEED = 6;
export const MAX_PULSE_SPEED = 8;
export const MAX_WOBBLE_AMOUNT = 0.9;
