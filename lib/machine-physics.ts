/**
 * Simple spring physics for snap-back and assembly animations.
 * Runs at 60fps assumption (dt = 1/60).
 */
export interface SpringState {
  value: number;
  velocity: number;
}

export function springStep(
  current: number,
  target: number,
  velocity: number,
  stiffness = 180,
  damping = 12,
): SpringState {
  const dt = 1 / 60;
  const force = stiffness * (target - current);
  const dampingForce = -damping * velocity;
  const acceleration = force + dampingForce;
  const newVelocity = velocity + acceleration * dt;
  const newValue = current + newVelocity * dt;
  return { value: newValue, velocity: newVelocity };
}

/**
 * Returns true when the spring has settled (close enough to target with low velocity).
 */
export function springSettled(
  current: number,
  target: number,
  velocity: number,
  threshold = 0.5,
): boolean {
  return Math.abs(current - target) < threshold && Math.abs(velocity) < threshold;
}

/**
 * Clamp a value to [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
