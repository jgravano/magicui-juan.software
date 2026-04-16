import type { CanvasDimensions } from "@/lib/creative/core/canvas";
import { clamp } from "@/lib/creative/math";
import {
  LUPA_LENS_RADIUS_MAX_PX,
  LUPA_LENS_RADIUS_MIN_PX,
  LUPA_LENS_RADIUS_VIEWPORT_RATIO,
  LUPA_LENS_SPRING_DAMPING,
  LUPA_LENS_SPRING_STIFFNESS,
} from "@/lib/lupa/constants";
import type { LupaInputState, LupaLensState } from "@/lib/lupa/types";

export const createLupaLensState = (): LupaLensState => ({
  uvX: 0.5,
  uvY: 0.5,
  velocityUvX: 0,
  velocityUvY: 0,
  radiusPx: 140,
});

export const resizeLupaLensRadius = (
  lensState: LupaLensState,
  dimensions: CanvasDimensions,
) => {
  const responsiveRadius = Math.min(dimensions.width, dimensions.height) * LUPA_LENS_RADIUS_VIEWPORT_RATIO;

  lensState.radiusPx = clamp(
    responsiveRadius,
    LUPA_LENS_RADIUS_MIN_PX,
    LUPA_LENS_RADIUS_MAX_PX,
  );
};

const integrateLensAxis = (
  position: number,
  velocity: number,
  target: number,
  deltaSeconds: number,
) => {
  const displacement = target - position;
  const acceleration =
    displacement * LUPA_LENS_SPRING_STIFFNESS - velocity * LUPA_LENS_SPRING_DAMPING;
  const nextVelocity = velocity + acceleration * deltaSeconds;
  const nextPosition = position + nextVelocity * deltaSeconds;

  return {
    position: clamp(nextPosition, 0, 1),
    velocity: nextVelocity,
  };
};

export const advanceLupaLensState = (
  lensState: LupaLensState,
  inputState: LupaInputState,
  deltaSeconds: number,
) => {
  const x = integrateLensAxis(
    lensState.uvX,
    lensState.velocityUvX,
    inputState.targetUvX,
    deltaSeconds,
  );
  const y = integrateLensAxis(
    lensState.uvY,
    lensState.velocityUvY,
    inputState.targetUvY,
    deltaSeconds,
  );

  lensState.uvX = x.position;
  lensState.uvY = y.position;
  lensState.velocityUvX = x.velocity;
  lensState.velocityUvY = y.velocity;
};
