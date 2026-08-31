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
  isPressed: boolean;
  heldSeconds: number;
  pressureScale: number;
};

export type SmileyInteractionState = {
  presses: [SmileyPressState, SmileyPressState];
  hover: number;
  hoverTarget: number;
  hoverPoint: Vector2;
  targetHoverPoint: Vector2;
  wobble: number;
  wobbleVelocity: number;
};
