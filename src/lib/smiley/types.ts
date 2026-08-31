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

export type SmileyInteractionState = {
  amount: number;
  velocity: number;
  contact: Vector2;
  targetContact: Vector2;
  hover: number;
  hoverTarget: number;
  hoverPoint: Vector2;
  targetHoverPoint: Vector2;
  isPressed: boolean;
  heldSeconds: number;
  pressureScale: number;
  wobble: number;
  wobbleVelocity: number;
};
