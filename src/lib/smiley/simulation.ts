import {
  CONTACT_FOLLOW_SPEED,
  HOLD_PRESS_DURATION_SECONDS,
  HOLD_PRESS_GAIN,
  HOVER_FOLLOW_SPEED,
  INITIAL_PRESS_STRENGTH,
  MAX_FRAME_DELTA_SECONDS,
  PRESS_DAMPING,
  PRESS_STIFFNESS,
  RELEASE_DAMPING,
  RELEASE_STIFFNESS,
  WOBBLE_DAMPING,
  WOBBLE_RELEASE_IMPULSE,
  WOBBLE_STIFFNESS,
} from "@/lib/smiley/constants";
import type { SmileyInteractionState, Vector2 } from "@/lib/smiley/types";

const blend = (current: number, target: number, speed: number, deltaSeconds: number) => (
  current + (target - current) * (1 - Math.exp(-speed * deltaSeconds))
);

const clampPointToSphere = (point: Vector2): Vector2 => {
  const length = Math.hypot(point.x, point.y);

  if (length <= 0.96) {
    return point;
  }

  return {
    x: (point.x / length) * 0.96,
    y: (point.y / length) * 0.96,
  };
};

export const createSmileyInteractionState = (): SmileyInteractionState => ({
  amount: 0,
  velocity: 0,
  contact: { x: 0, y: 0 },
  targetContact: { x: 0, y: 0 },
  hover: 0,
  hoverTarget: 0,
  hoverPoint: { x: 0, y: 0 },
  targetHoverPoint: { x: 0, y: 0 },
  isPressed: false,
  heldSeconds: 0,
  pressureScale: 1,
  wobble: 0,
  wobbleVelocity: 0,
});

export const beginSmileyPress = (
  state: SmileyInteractionState,
  point: Vector2,
  pressureScale: number,
) => {
  const contact = clampPointToSphere(point);

  state.isPressed = true;
  state.heldSeconds = 0;
  state.pressureScale = pressureScale;
  state.velocity += 2.4 * pressureScale;
  state.targetContact = contact;
  state.targetHoverPoint = contact;
  state.hoverTarget = 1;

  if (Math.abs(state.amount) < 0.02) {
    state.contact = contact;
  }
};

export const moveSmileyPress = (
  state: SmileyInteractionState,
  point: Vector2,
  pressureScale: number,
) => {
  const contact = clampPointToSphere(point);
  state.targetContact = contact;
  state.targetHoverPoint = contact;
  state.pressureScale = pressureScale;
};

export const endSmileyPress = (state: SmileyInteractionState) => {
  if (!state.isPressed) {
    return;
  }

  state.isPressed = false;
  state.heldSeconds = 0;
  state.wobbleVelocity += Math.max(state.amount, 0.22) * WOBBLE_RELEASE_IMPULSE;
};

export const setSmileyHover = (
  state: SmileyInteractionState,
  point: Vector2 | null,
) => {
  state.hoverTarget = point ? 1 : 0;

  if (point) {
    state.targetHoverPoint = clampPointToSphere(point);
  }
};

export const advanceSmileyInteraction = (
  state: SmileyInteractionState,
  rawDeltaSeconds: number,
  reduceMotion: boolean,
) => {
  const deltaSeconds = Math.min(rawDeltaSeconds, MAX_FRAME_DELTA_SECONDS);

  if (state.isPressed) {
    state.heldSeconds += deltaSeconds;
  }

  const holdProgress = Math.min(state.heldSeconds / HOLD_PRESS_DURATION_SECONDS, 1);
  const targetAmount = state.isPressed
    ? (INITIAL_PRESS_STRENGTH + holdProgress * HOLD_PRESS_GAIN) * state.pressureScale
    : 0;
  const stiffness = state.isPressed ? PRESS_STIFFNESS : RELEASE_STIFFNESS;
  const damping = reduceMotion
    ? RELEASE_DAMPING * 3
    : state.isPressed
      ? PRESS_DAMPING
      : RELEASE_DAMPING;

  state.velocity += (targetAmount - state.amount) * stiffness * deltaSeconds;
  state.velocity *= Math.exp(-damping * deltaSeconds);
  state.amount += state.velocity * deltaSeconds;
  state.amount = Math.max(-0.3, Math.min(1.08, state.amount));

  if (!state.isPressed && Math.abs(state.amount) < 0.0005 && Math.abs(state.velocity) < 0.002) {
    state.amount = 0;
    state.velocity = 0;
  }

  state.contact.x = blend(
    state.contact.x,
    state.targetContact.x,
    CONTACT_FOLLOW_SPEED,
    deltaSeconds,
  );
  state.contact.y = blend(
    state.contact.y,
    state.targetContact.y,
    CONTACT_FOLLOW_SPEED,
    deltaSeconds,
  );
  state.hover = blend(state.hover, state.hoverTarget, HOVER_FOLLOW_SPEED, deltaSeconds);
  state.hoverPoint.x = blend(
    state.hoverPoint.x,
    state.targetHoverPoint.x,
    HOVER_FOLLOW_SPEED,
    deltaSeconds,
  );
  state.hoverPoint.y = blend(
    state.hoverPoint.y,
    state.targetHoverPoint.y,
    HOVER_FOLLOW_SPEED,
    deltaSeconds,
  );

  if (reduceMotion) {
    state.wobble = blend(state.wobble, 0, 18, deltaSeconds);
    state.wobbleVelocity = 0;
    return;
  }

  state.wobbleVelocity += -state.wobble * WOBBLE_STIFFNESS * deltaSeconds;
  state.wobbleVelocity *= Math.exp(-WOBBLE_DAMPING * deltaSeconds);
  state.wobble += state.wobbleVelocity * deltaSeconds;

  if (Math.abs(state.wobble) < 0.0004 && Math.abs(state.wobbleVelocity) < 0.002) {
    state.wobble = 0;
    state.wobbleVelocity = 0;
  }
};
