import {
  BACKGROUND_BASE_COLOR,
  BACKGROUND_BREATH_FREQUENCY,
  BACKGROUND_DRIFT_DISTANCE,
  BACKGROUND_GLOW_INNER,
  BACKGROUND_GLOW_OUTER,
  BACKGROUND_GLOW_RADIUS_BASE,
  BACKGROUND_GLOW_RADIUS_VARIATION,
  BACKGROUND_VIGNETTE_EDGE,
  COMPOSITION_BOTTOM_SHADE_ALPHA,
  COMPOSITION_GRAIN_ALPHA,
  COMPOSITION_TOP_SHADE_ALPHA,
  CURSOR_CORE_COLOR,
  CURSOR_GLOW_COLOR,
  CURSOR_GLOW_RADIUS_MULTIPLIER,
  CURSOR_SPARK_COLOR,
  CURSOR_SPARK_OFFSET_MULTIPLIER,
  CURSOR_SPARK_RADIUS_MULTIPLIER,
  CURSOR_TRAIL_COLOR,
  CURSOR_TRAIL_MAX_LENGTH,
  CURSOR_TRAIL_MIN_LENGTH,
  CURSOR_TRAIL_SPEED_SCALE,
  CURSOR_TRAIL_WIDTH,
  PARTICLE_COLOR,
  PARTICLE_DAMAGE_ALPHA_BOOST,
  PARTICLE_DAMAGE_SIZE_BOOST,
  PARTICLE_REACTION_ALPHA_BOOST,
  PARTICLE_REACTION_OFFSET_SCALE,
  PARTICLE_REACTION_SIZE_BOOST,
  PARTICLE_TRAIL_ALPHA,
  PARTICLE_TRAIL_MAX_LENGTH,
  PARTICLE_TRAIL_WIDTH,
  PARTICLE_TWINKLE_AMPLITUDE,
  PARTICLE_TWINKLE_FREQUENCY,
  PARTICLE_TWINKLE_MAX_MULTIPLIER,
  PARTICLE_TWINKLE_MIN_MULTIPLIER,
} from "./constants";
import type { CanvasDimensions, CursorState, FrameClock, Particle } from "./types";
import { clamp } from "./utils";

let cachedNoisePattern: CanvasPattern | null = null;

const getNoisePattern = (context: CanvasRenderingContext2D) => {
  if (cachedNoisePattern) {
    return cachedNoisePattern;
  }

  const noiseCanvas = document.createElement("canvas");
  noiseCanvas.width = 128;
  noiseCanvas.height = 128;
  const noiseContext = noiseCanvas.getContext("2d");

  if (!noiseContext) {
    return null;
  }

  const imageData = noiseContext.createImageData(noiseCanvas.width, noiseCanvas.height);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const value = Math.floor(Math.random() * 255);
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
    data[index + 3] = 255;
  }

  noiseContext.putImageData(imageData, 0, 0);
  cachedNoisePattern = context.createPattern(noiseCanvas, "repeat");

  return cachedNoisePattern;
};

type RenderBackgroundPayload = {
  dimensions: CanvasDimensions;
  frameClock: FrameClock;
};

export const renderResonanceBackground = (
  context: CanvasRenderingContext2D,
  payload: RenderBackgroundPayload,
) => {
  const { width, height } = payload.dimensions;
  const { elapsedSeconds } = payload.frameClock;

  context.fillStyle = BACKGROUND_BASE_COLOR;
  context.fillRect(0, 0, width, height);

  const breath = 0.5 + 0.5 * Math.sin(elapsedSeconds * BACKGROUND_BREATH_FREQUENCY);
  const driftX = Math.sin(elapsedSeconds * 0.19) * BACKGROUND_DRIFT_DISTANCE;
  const driftY = Math.cos(elapsedSeconds * 0.14) * BACKGROUND_DRIFT_DISTANCE;

  const centerX = width * 0.5 + driftX;
  const centerY = height * 0.5 + driftY;
  const radius =
    Math.max(width, height) *
    (BACKGROUND_GLOW_RADIUS_BASE + BACKGROUND_GLOW_RADIUS_VARIATION * breath);

  const glowGradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  glowGradient.addColorStop(0, BACKGROUND_GLOW_INNER);
  glowGradient.addColorStop(1, BACKGROUND_GLOW_OUTER);

  context.fillStyle = glowGradient;
  context.fillRect(0, 0, width, height);

  const vignetteGradient = context.createRadialGradient(
    width * 0.5,
    height * 0.5,
    Math.min(width, height) * 0.35,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.8,
  );
  vignetteGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignetteGradient.addColorStop(1, BACKGROUND_VIGNETTE_EDGE);

  context.fillStyle = vignetteGradient;
  context.fillRect(0, 0, width, height);
};

type RenderParticlesPayload = {
  particles: Particle[];
  frameClock: FrameClock;
};

export const renderResonanceParticles = (
  context: CanvasRenderingContext2D,
  payload: RenderParticlesPayload,
) => {
  const { particles, frameClock } = payload;

  context.save();
  context.globalCompositeOperation = "lighter";
  context.strokeStyle = "rgba(188, 208, 255, 1)";

  for (const particle of particles) {
    const trailDx = particle.position.x - particle.previousPosition.x;
    const trailDy = particle.position.y - particle.previousPosition.y;
    const trailLength = Math.hypot(trailDx, trailDy);

    if (trailLength < 0.04) {
      continue;
    }

    const clampedTrailLength = Math.min(trailLength, PARTICLE_TRAIL_MAX_LENGTH);
    const trailAlpha = PARTICLE_TRAIL_ALPHA * (clampedTrailLength / PARTICLE_TRAIL_MAX_LENGTH);
    context.globalAlpha = trailAlpha;
    context.lineWidth = PARTICLE_TRAIL_WIDTH;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(particle.previousPosition.x, particle.previousPosition.y);
    context.lineTo(particle.position.x, particle.position.y);
    context.stroke();
  }

  context.fillStyle = PARTICLE_COLOR;

  for (const particle of particles) {
    const twinkleWave = Math.sin(
      frameClock.elapsedSeconds * PARTICLE_TWINKLE_FREQUENCY + particle.twinklePhase,
    );
    const twinkleNormalized = (twinkleWave + 1) * 0.5;
    const twinkleFactor =
      PARTICLE_TWINKLE_MIN_MULTIPLIER +
      twinkleNormalized * (PARTICLE_TWINKLE_MAX_MULTIPLIER - PARTICLE_TWINKLE_MIN_MULTIPLIER);
    const twinkleBoost = 1 + PARTICLE_TWINKLE_AMPLITUDE * twinkleNormalized;
    const displacement = Math.hypot(
      particle.position.x - particle.origin.x,
      particle.position.y - particle.origin.y,
    );
    const reactionAmount = clamp(displacement / PARTICLE_REACTION_OFFSET_SCALE, 0, 1);
    const reactionAlpha = 1 + reactionAmount * PARTICLE_REACTION_ALPHA_BOOST;
    const reactionSize = 1 + reactionAmount * PARTICLE_REACTION_SIZE_BOOST;
    const damageAlpha = 1 + particle.damage * PARTICLE_DAMAGE_ALPHA_BOOST;
    const damageSize = 1 + particle.damage * PARTICLE_DAMAGE_SIZE_BOOST;

    context.globalAlpha = particle.alpha * twinkleFactor * reactionAlpha * damageAlpha;
    context.beginPath();
    context.arc(
      particle.position.x,
      particle.position.y,
      particle.radius * twinkleBoost * reactionSize * damageSize,
      0,
      Math.PI * 2,
    );
    context.fill();
  }

  context.restore();
};

type RenderCompositionPayload = {
  dimensions: CanvasDimensions;
  frameClock: FrameClock;
};

export const renderResonanceComposition = (
  context: CanvasRenderingContext2D,
  payload: RenderCompositionPayload,
) => {
  const { width, height } = payload.dimensions;
  const { elapsedSeconds } = payload.frameClock;

  context.save();

  const topShade = context.createLinearGradient(0, 0, 0, height * 0.46);
  topShade.addColorStop(0, `rgba(0, 0, 0, ${COMPOSITION_TOP_SHADE_ALPHA})`);
  topShade.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = topShade;
  context.fillRect(0, 0, width, height);

  const bottomShade = context.createLinearGradient(0, height, 0, height * 0.4);
  bottomShade.addColorStop(0, `rgba(0, 0, 0, ${COMPOSITION_BOTTOM_SHADE_ALPHA})`);
  bottomShade.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = bottomShade;
  context.fillRect(0, 0, width, height);

  const noisePattern = getNoisePattern(context);
  if (noisePattern) {
    context.globalAlpha = COMPOSITION_GRAIN_ALPHA;
    context.translate(Math.sin(elapsedSeconds * 0.5) * 16, Math.cos(elapsedSeconds * 0.4) * 16);
    context.fillStyle = noisePattern;
    context.fillRect(-32, -32, width + 64, height + 64);
  }

  context.restore();
};

type RenderCursorPayload = {
  dimensions: CanvasDimensions;
  cursorState: CursorState;
};

export const renderResonanceCursor = (
  context: CanvasRenderingContext2D,
  payload: RenderCursorPayload,
) => {
  const { width, height } = payload.dimensions;
  const { position, velocity, opacity, radius } = payload.cursorState;

  if (opacity < 0.01) {
    return;
  }

  if (position.x < 0 || position.y < 0 || position.x > width || position.y > height) {
    return;
  }

  context.save();
  context.globalCompositeOperation = "lighter";
  context.globalAlpha = opacity;

  const speed = Math.hypot(velocity.x, velocity.y);
  const hasDirection = speed > 0.001;
  const directionX = hasDirection ? velocity.x / speed : 0;
  const directionY = hasDirection ? velocity.y / speed : 0;
  const trailLength = clamp(
    speed * CURSOR_TRAIL_SPEED_SCALE,
    CURSOR_TRAIL_MIN_LENGTH,
    CURSOR_TRAIL_MAX_LENGTH,
  );

  const glowRadius = radius * CURSOR_GLOW_RADIUS_MULTIPLIER;
  const glowGradient = context.createRadialGradient(
    position.x,
    position.y,
    0,
    position.x,
    position.y,
    glowRadius,
  );
  glowGradient.addColorStop(0, CURSOR_GLOW_COLOR);
  glowGradient.addColorStop(1, "rgba(136, 164, 255, 0)");
  context.fillStyle = glowGradient;
  context.beginPath();
  context.arc(position.x, position.y, glowRadius, 0, Math.PI * 2);
  context.fill();

  if (hasDirection) {
    const tailX = position.x - directionX * trailLength;
    const tailY = position.y - directionY * trailLength;
    const trailGradient = context.createLinearGradient(position.x, position.y, tailX, tailY);
    trailGradient.addColorStop(0, CURSOR_TRAIL_COLOR);
    trailGradient.addColorStop(1, "rgba(184, 206, 255, 0)");

    context.strokeStyle = trailGradient;
    context.lineCap = "round";
    context.lineWidth = CURSOR_TRAIL_WIDTH;
    context.beginPath();
    context.moveTo(position.x, position.y);
    context.lineTo(tailX, tailY);
    context.stroke();
  }

  if (hasDirection) {
    const sparkX = position.x + directionX * radius * CURSOR_SPARK_OFFSET_MULTIPLIER;
    const sparkY = position.y + directionY * radius * CURSOR_SPARK_OFFSET_MULTIPLIER;
    context.fillStyle = CURSOR_SPARK_COLOR;
    context.beginPath();
    context.arc(sparkX, sparkY, radius * CURSOR_SPARK_RADIUS_MULTIPLIER, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = CURSOR_CORE_COLOR;
  context.beginPath();
  context.arc(position.x, position.y, radius * 0.7, 0, Math.PI * 2);
  context.fill();

  context.restore();
};
