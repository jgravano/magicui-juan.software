export type LupaInputState = {
  targetUvX: number;
  targetUvY: number;
};

export type LupaLensState = {
  uvX: number;
  uvY: number;
  velocityUvX: number;
  velocityUvY: number;
  radiusPx: number;
};

export type LupaRenderPayload = {
  lensUvX: number;
  lensUvY: number;
  lensRadiusPx: number;
  magnification: number;
  edgeDistortion: number;
  chromaticAberrationPx: number;
  frameWidthPx: number;
  shadowSoftnessPx: number;
};
