import {
  PARTICLE_CLUSTER_MARGIN,
  PARTICLE_CLUSTER_MIN_SIDE,
  PARTICLE_CLUSTER_SIDE_RATIO,
  PARTICLE_GRID_JITTER,
  PARTICLE_GRID_SPACING,
  PARTICLE_MAX_COUNT,
  PARTICLE_MAX_ALPHA,
  PARTICLE_MAX_RADIUS,
  PARTICLE_MIN_ALPHA,
  PARTICLE_MIN_RADIUS,
} from "./constants";
import type { CanvasDimensions, Particle } from "./types";
import { clamp, randomBetween } from "./utils";

export const createParticles = (dimensions: CanvasDimensions): Particle[] => {
  const minDimension = Math.min(dimensions.width, dimensions.height);
  const availableSide = Math.max(80, minDimension - PARTICLE_CLUSTER_MARGIN * 2);
  const minClusterSide = Math.min(PARTICLE_CLUSTER_MIN_SIDE, availableSide);
  const desiredClusterSide = minDimension * PARTICLE_CLUSTER_SIDE_RATIO;
  const clusterSide = clamp(desiredClusterSide, minClusterSide, availableSide);

  let effectiveSpacing = PARTICLE_GRID_SPACING;
  let columns = Math.max(4, Math.floor(clusterSide / effectiveSpacing));
  let rows = Math.max(4, Math.floor(clusterSide / effectiveSpacing));
  let particleCountEstimate = (columns + 1) * (rows + 1);

  if (particleCountEstimate > PARTICLE_MAX_COUNT) {
    const spacingScale = Math.sqrt(particleCountEstimate / PARTICLE_MAX_COUNT);
    effectiveSpacing *= spacingScale;
    columns = Math.max(4, Math.floor(clusterSide / effectiveSpacing));
    rows = Math.max(4, Math.floor(clusterSide / effectiveSpacing));
    particleCountEstimate = (columns + 1) * (rows + 1);
  }

  const stepX = clusterSide / columns;
  const stepY = clusterSide / rows;
  const minX = dimensions.width * 0.5 - clusterSide * 0.5;
  const minY = dimensions.height * 0.5 - clusterSide * 0.5;
  const maxX = minX + clusterSide;
  const maxY = minY + clusterSide;

  const particles: Particle[] = [];
  let nextId = 1;

  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      const baseX = minX + column * stepX;
      const baseY = minY + row * stepY;
      const jitterX = randomBetween(-PARTICLE_GRID_JITTER, PARTICLE_GRID_JITTER);
      const jitterY = randomBetween(-PARTICLE_GRID_JITTER, PARTICLE_GRID_JITTER);
      const x = clamp(baseX + jitterX, minX, maxX);
      const y = clamp(baseY + jitterY, minY, maxY);

      particles.push({
        id: nextId,
        origin: { x, y },
        position: { x, y },
        previousPosition: { x, y },
        velocity: { x: 0, y: 0 },
        damage: 0,
        radius: randomBetween(PARTICLE_MIN_RADIUS, PARTICLE_MAX_RADIUS),
        alpha: randomBetween(PARTICLE_MIN_ALPHA, PARTICLE_MAX_ALPHA),
        twinklePhase: randomBetween(0, Math.PI * 2),
      });
      nextId += 1;
    }
  }

  return particles;
};
