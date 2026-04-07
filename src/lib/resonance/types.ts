export type Vector2 = {
  x: number;
  y: number;
};

export type CanvasDimensions = {
  width: number;
  height: number;
  dpr: number;
};

export type FrameClock = {
  elapsedSeconds: number;
  deltaSeconds: number;
};

export type PointerClick = {
  id: number;
  position: Vector2;
  velocity: Vector2;
  timestampSeconds: number;
  isInside: boolean;
};

export type InputState = {
  pointer: Vector2;
  previousPointer: Vector2;
  velocity: Vector2;
  speed: number;
  isPointerInside: boolean;
  isPointerDown: boolean;
  clickCount: number;
  lastClick: PointerClick | null;
  queuedClicks: PointerClick[];
  frameClicks: PointerClick[];
};

export type CursorState = {
  position: Vector2;
  velocity: Vector2;
  opacity: number;
  radius: number;
};

export type Particle = {
  id: number;
  origin: Vector2;
  position: Vector2;
  previousPosition: Vector2;
  velocity: Vector2;
  damage: number;
  radius: number;
  alpha: number;
  twinklePhase: number;
};

export type Pulse = {
  id: number;
  origin: Vector2;
  direction: Vector2;
  turbulencePhase: number;
  irregularity: number;
  ageSeconds: number;
  lifeSeconds: number;
  startRadius: number;
  endRadius: number;
};
