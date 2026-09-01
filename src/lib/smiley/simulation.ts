import {
  CONTACT_FOLLOW_SPEED,
  DRAG_FOLLOW_DAMPING,
  DRAG_FOLLOW_STIFFNESS,
  DRAG_MAX_OFFSET,
  DRAG_PULL_GAIN,
  DRAG_RELEASE_DAMPING,
  DRAG_RELEASE_STIFFNESS,
  DRAG_RELEASE_WOBBLE_IMPULSE,
  HOLD_PRESS_DURATION_SECONDS,
  HOLD_PRESS_GAIN,
  HOVER_FOLLOW_SPEED,
  INITIAL_PRESS_STRENGTH,
  MAX_FRAME_DELTA_SECONDS,
  PINCH_MAX_SQUEEZE,
  PINCH_MAX_STRETCH,
  PINCH_PRESS_DAMPING,
  PINCH_PRESS_STIFFNESS,
  PINCH_RELEASE_DAMPING,
  PINCH_RELEASE_REBOUND_SPEED,
  PINCH_RELEASE_STIFFNESS,
  PINCH_RELEASE_WOBBLE_IMPULSE,
  PINCH_TRAVEL_FOR_FULL_STRETCH,
  PINCH_TRAVEL_FOR_FULL_SQUEEZE,
  PRESS_DAMPING,
  PRESS_STIFFNESS,
  PULSE_DAMPING,
  PULSE_IMPULSE,
  PULSE_MAX_AMOUNT,
  PULSE_STIFFNESS,
  RELEASE_DAMPING,
  RELEASE_STIFFNESS,
  SHADOW_DRAG_FOLLOW,
  SHADOW_FOLLOW_DAMPING,
  SHADOW_FOLLOW_STIFFNESS,
  WOBBLE_DAMPING,
  WOBBLE_RELEASE_IMPULSE,
  WOBBLE_STIFFNESS,
} from "@/lib/smiley/constants";
import type {
  SmileyInteractionState,
  SmileyPressSlot,
  SmileyPressState,
  Vector2,
} from "@/lib/smiley/types";

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

const clampVectorLength = (vector: Vector2, maximumLength: number): Vector2 => {
  const length = Math.hypot(vector.x, vector.y);

  if (length <= maximumLength) {
    return vector;
  }

  return {
    x: (vector.x / length) * maximumLength,
    y: (vector.y / length) * maximumLength,
  };
};

const createPressState = (): SmileyPressState => ({
  amount: 0,
  velocity: 0,
  contact: { x: 0, y: 0 },
  targetContact: { x: 0, y: 0 },
  isPressed: false,
  heldSeconds: 0,
  pressureScale: 1,
});

const distanceBetweenPresses = (state: SmileyInteractionState) => {
  const [primaryPress, secondaryPress] = state.presses;

  return Math.hypot(
    secondaryPress.targetContact.x - primaryPress.targetContact.x,
    secondaryPress.targetContact.y - primaryPress.targetContact.y,
  );
};

const updatePinchTarget = (state: SmileyInteractionState) => {
  const [primaryPress, secondaryPress] = state.presses;

  if (!primaryPress.isPressed || !secondaryPress.isPressed) {
    state.pinch.active = false;
    state.pinch.targetAmount = 0;
    return;
  }

  const currentDistance = distanceBetweenPresses(state);

  if (!state.pinch.active) {
    state.pinch.active = true;
    state.pinch.startDistance = currentDistance;
    state.pinch.targetAmount = 0;
    return;
  }

  const distanceDelta = state.pinch.startDistance - currentDistance;
  state.pinch.targetAmount = distanceDelta >= 0
    ? Math.min(distanceDelta / PINCH_TRAVEL_FOR_FULL_SQUEEZE, PINCH_MAX_SQUEEZE)
    : Math.max(distanceDelta / PINCH_TRAVEL_FOR_FULL_STRETCH, -PINCH_MAX_STRETCH);
};

const updateDragTarget = (state: SmileyInteractionState) => {
  const activePress = state.presses.find((press) => press.isPressed);
  const activePressCount = Number(state.presses[0].isPressed)
    + Number(state.presses[1].isPressed);

  if (!activePress || activePressCount !== 1) {
    state.drag.active = false;
    state.drag.targetOffset.x = 0;
    state.drag.targetOffset.y = 0;
    return;
  }

  if (!state.drag.active) {
    state.drag.active = true;
    state.drag.anchor.x = activePress.targetContact.x;
    state.drag.anchor.y = activePress.targetContact.y;
    state.drag.targetOffset.x = 0;
    state.drag.targetOffset.y = 0;
    return;
  }

  const targetOffset = clampVectorLength({
    x: (activePress.targetContact.x - state.drag.anchor.x) * DRAG_PULL_GAIN,
    y: (activePress.targetContact.y - state.drag.anchor.y) * DRAG_PULL_GAIN,
  }, DRAG_MAX_OFFSET);

  state.drag.targetOffset.x = targetOffset.x;
  state.drag.targetOffset.y = targetOffset.y;
};

export const createSmileyInteractionState = (): SmileyInteractionState => ({
  presses: [createPressState(), createPressState()],
  pinch: {
    active: false,
    amount: 0,
    startDistance: 0,
    targetAmount: 0,
    velocity: 0,
  },
  drag: {
    active: false,
    anchor: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    targetOffset: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
  },
  pulse: {
    amount: 0,
    point: { x: 0, y: 0 },
    velocity: 0,
  },
  shadow: {
    offset: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
  },
  hover: 0,
  hoverTarget: 0,
  hoverPoint: { x: 0, y: 0 },
  targetHoverPoint: { x: 0, y: 0 },
  wobble: 0,
  wobbleVelocity: 0,
});

export const beginSmileyPress = (
  state: SmileyInteractionState,
  slot: SmileyPressSlot,
  point: Vector2,
  pressureScale: number,
) => {
  const press = state.presses[slot];
  const contact = clampPointToSphere(point);

  press.isPressed = true;
  press.heldSeconds = 0;
  press.pressureScale = pressureScale;
  press.velocity += 2.4 * pressureScale;
  press.targetContact = contact;
  state.targetHoverPoint = contact;
  state.hoverTarget = 1;

  if (Math.abs(press.amount) < 0.02) {
    press.contact = contact;
  }

  updatePinchTarget(state);
  updateDragTarget(state);
};

export const moveSmileyPress = (
  state: SmileyInteractionState,
  slot: SmileyPressSlot,
  point: Vector2,
  pressureScale: number,
) => {
  const press = state.presses[slot];
  const contact = clampPointToSphere(point);
  press.targetContact = contact;
  state.targetHoverPoint = contact;
  press.pressureScale = pressureScale;
  updatePinchTarget(state);
  updateDragTarget(state);
};

export const endSmileyPress = (
  state: SmileyInteractionState,
  slot: SmileyPressSlot,
) => {
  const press = state.presses[slot];

  if (!press.isPressed) {
    return;
  }

  const pinchReleaseDisplacement = state.pinch.active ? state.pinch.amount : 0;
  const pinchReleaseAmount = Math.abs(pinchReleaseDisplacement);
  const dragReleaseAmount = state.drag.active
    ? Math.hypot(state.drag.offset.x, state.drag.offset.y)
    : 0;
  press.isPressed = false;
  press.heldSeconds = 0;
  updatePinchTarget(state);
  updateDragTarget(state);

  if (pinchReleaseAmount > 0.02) {
    const existingSpeed = Math.min(
      Math.abs(state.pinch.velocity),
      pinchReleaseAmount * 3.2,
    );
    const reboundSpeed = Math.max(
      existingSpeed,
      pinchReleaseAmount * PINCH_RELEASE_REBOUND_SPEED,
    );

    state.pinch.velocity = -Math.sign(pinchReleaseDisplacement) * reboundSpeed;
  }

  state.wobbleVelocity += Math.max(press.amount, 0.22) * WOBBLE_RELEASE_IMPULSE
    + pinchReleaseAmount * PINCH_RELEASE_WOBBLE_IMPULSE
    + dragReleaseAmount * DRAG_RELEASE_WOBBLE_IMPULSE;
};

export const triggerSmileyPulse = (
  state: SmileyInteractionState,
  point: Vector2,
) => {
  state.pulse.point = clampPointToSphere(point);
  state.pulse.velocity += PULSE_IMPULSE * (1 - Math.min(Math.abs(state.pulse.amount), 0.5) * 0.35);
  state.wobbleVelocity += 0.48;
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

  state.presses.forEach((press) => {
    if (press.isPressed) {
      press.heldSeconds += deltaSeconds;
    }

    const holdProgress = Math.min(press.heldSeconds / HOLD_PRESS_DURATION_SECONDS, 1);
    const targetAmount = press.isPressed
      ? (INITIAL_PRESS_STRENGTH + holdProgress * HOLD_PRESS_GAIN) * press.pressureScale
      : 0;
    const stiffness = press.isPressed ? PRESS_STIFFNESS : RELEASE_STIFFNESS;
    const damping = reduceMotion
      ? RELEASE_DAMPING * 3
      : press.isPressed
        ? PRESS_DAMPING
        : RELEASE_DAMPING;

    press.velocity += (targetAmount - press.amount) * stiffness * deltaSeconds;
    press.velocity *= Math.exp(-damping * deltaSeconds);
    press.amount += press.velocity * deltaSeconds;
    press.amount = Math.max(-0.3, Math.min(1.08, press.amount));

    if (!press.isPressed && Math.abs(press.amount) < 0.0005 && Math.abs(press.velocity) < 0.002) {
      press.amount = 0;
      press.velocity = 0;
    }

    press.contact.x = blend(
      press.contact.x,
      press.targetContact.x,
      CONTACT_FOLLOW_SPEED,
      deltaSeconds,
    );
    press.contact.y = blend(
      press.contact.y,
      press.targetContact.y,
      CONTACT_FOLLOW_SPEED,
      deltaSeconds,
    );
  });

  const pinchIsDriven = state.pinch.active;
  const pinchStiffness = pinchIsDriven
    ? PINCH_PRESS_STIFFNESS
    : PINCH_RELEASE_STIFFNESS;
  const pinchDamping = reduceMotion
    ? PINCH_RELEASE_DAMPING * 3
    : pinchIsDriven
      ? PINCH_PRESS_DAMPING
      : PINCH_RELEASE_DAMPING;

  state.pinch.velocity += (
    state.pinch.targetAmount - state.pinch.amount
  ) * pinchStiffness * deltaSeconds;
  state.pinch.velocity *= Math.exp(-pinchDamping * deltaSeconds);
  state.pinch.amount += state.pinch.velocity * deltaSeconds;
  state.pinch.amount = Math.max(
    -PINCH_MAX_STRETCH * 1.04,
    Math.min(PINCH_MAX_SQUEEZE * 1.04, state.pinch.amount),
  );

  if (
    !state.pinch.active
    && Math.abs(state.pinch.amount) < 0.0005
    && Math.abs(state.pinch.velocity) < 0.002
  ) {
    state.pinch.amount = 0;
    state.pinch.velocity = 0;
  }

  const dragIsDriven = state.drag.active;
  const dragStiffness = dragIsDriven
    ? DRAG_FOLLOW_STIFFNESS
    : DRAG_RELEASE_STIFFNESS;
  const dragDamping = reduceMotion
    ? DRAG_FOLLOW_DAMPING * 2.4
    : dragIsDriven
      ? DRAG_FOLLOW_DAMPING
      : DRAG_RELEASE_DAMPING;

  state.drag.velocity.x += (
    state.drag.targetOffset.x - state.drag.offset.x
  ) * dragStiffness * deltaSeconds;
  state.drag.velocity.y += (
    state.drag.targetOffset.y - state.drag.offset.y
  ) * dragStiffness * deltaSeconds;
  const dragDecay = Math.exp(-dragDamping * deltaSeconds);
  state.drag.velocity.x *= dragDecay;
  state.drag.velocity.y *= dragDecay;
  state.drag.offset.x += state.drag.velocity.x * deltaSeconds;
  state.drag.offset.y += state.drag.velocity.y * deltaSeconds;

  const clampedDragOffset = clampVectorLength(
    state.drag.offset,
    DRAG_MAX_OFFSET * 1.08,
  );
  state.drag.offset.x = clampedDragOffset.x;
  state.drag.offset.y = clampedDragOffset.y;

  if (
    !state.drag.active
    && Math.hypot(state.drag.offset.x, state.drag.offset.y) < 0.0005
    && Math.hypot(state.drag.velocity.x, state.drag.velocity.y) < 0.002
  ) {
    state.drag.offset.x = 0;
    state.drag.offset.y = 0;
    state.drag.velocity.x = 0;
    state.drag.velocity.y = 0;
  }

  const shadowTargetX = state.drag.offset.x * SHADOW_DRAG_FOLLOW;
  const shadowTargetY = state.drag.offset.y * SHADOW_DRAG_FOLLOW;
  state.shadow.velocity.x += (
    shadowTargetX - state.shadow.offset.x
  ) * SHADOW_FOLLOW_STIFFNESS * deltaSeconds;
  state.shadow.velocity.y += (
    shadowTargetY - state.shadow.offset.y
  ) * SHADOW_FOLLOW_STIFFNESS * deltaSeconds;
  const shadowDecay = Math.exp(
    -SHADOW_FOLLOW_DAMPING * (reduceMotion ? 2.2 : 1) * deltaSeconds,
  );
  state.shadow.velocity.x *= shadowDecay;
  state.shadow.velocity.y *= shadowDecay;
  state.shadow.offset.x += state.shadow.velocity.x * deltaSeconds;
  state.shadow.offset.y += state.shadow.velocity.y * deltaSeconds;

  if (reduceMotion) {
    state.pulse.amount = blend(state.pulse.amount, 0, 22, deltaSeconds);
    state.pulse.velocity = 0;
  } else {
    state.pulse.velocity += -state.pulse.amount * PULSE_STIFFNESS * deltaSeconds;
    state.pulse.velocity *= Math.exp(-PULSE_DAMPING * deltaSeconds);
    state.pulse.amount += state.pulse.velocity * deltaSeconds;
    state.pulse.amount = Math.max(
      -PULSE_MAX_AMOUNT * 0.52,
      Math.min(PULSE_MAX_AMOUNT, state.pulse.amount),
    );
  }

  if (Math.abs(state.pulse.amount) < 0.0004 && Math.abs(state.pulse.velocity) < 0.002) {
    state.pulse.amount = 0;
    state.pulse.velocity = 0;
  }

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
