export type Vector2 = {
  x: number;
  y: number;
};

export type SmileyLayout = {
  centerX: number;
  centerY: number;
  radiusPixels: number;
  viewportWidth: number;
  viewportHeight: number;
};

export type SmileyPressSlot = 0 | 1;

export type SmileyPressState = {
  amount: number;
  velocity: number;
  contact: Vector2;
  targetContact: Vector2;
  pointer: Vector2;
  isPressed: boolean;
  heldSeconds: number;
  pressureScale: number;
};

export type SmileyPinchState = {
  active: boolean;
  amount: number;
  startDistance: number;
  targetAmount: number;
  velocity: number;
};

export type SmileyDragState = {
  active: boolean;
  anchor: Vector2;
  offset: Vector2;
  targetOffset: Vector2;
  velocity: Vector2;
};

export type SmileyPulseState = {
  amount: number;
  point: Vector2;
  velocity: number;
};

export type SmileyShadowState = {
  offset: Vector2;
  velocity: Vector2;
};

export type SmileyInteractionState = {
  accumulator: number;
  body: SmileyShadowState;
  presses: [SmileyPressState, SmileyPressState];
  pinch: SmileyPinchState;
  drag: SmileyDragState;
  pulse: SmileyPulseState;
  shadow: SmileyShadowState;
  hover: number;
  hoverTarget: number;
  hoverPoint: Vector2;
  targetHoverPoint: Vector2;
  wobble: number;
  wobbleVelocity: number;
};
