import type { CanvasDimensions } from "@/lib/creative/core/canvas";
import { clamp } from "@/lib/creative/math";
import type { MirrorParticle } from "@/lib/creative/particles/types";

type RenderPhase4BaselinePayload = {
  context: CanvasRenderingContext2D;
  dimensions: CanvasDimensions;
  particles: MirrorParticle[];
  elapsedSeconds: number;
};

export const renderPhase4Baseline = (payload: RenderPhase4BaselinePayload) => {
  const { context, particles, elapsedSeconds } = payload;

  context.save();
  context.globalCompositeOperation = "lighter";
  context.lineCap = "round";
  context.strokeStyle = "rgba(188, 208, 255, 1)";

  for (const particle of particles) {
    if (particle.life < 0.05) {
      continue;
    }

    const dx = particle.position.x - particle.previousPosition.x;
    const dy = particle.position.y - particle.previousPosition.y;
    const trailLength = Math.hypot(dx, dy);
    if (trailLength < 0.04) {
      continue;
    }

    const clampedTrailLength = Math.min(trailLength, 18);
    const trailAlpha = clamp((clampedTrailLength / 18) * (0.1 + particle.life * 0.16), 0, 0.26);
    context.globalAlpha = trailAlpha;
    context.lineWidth = 0.72 + particle.energy * 0.38;
    context.beginPath();
    context.moveTo(particle.previousPosition.x, particle.previousPosition.y);
    context.lineTo(particle.position.x, particle.position.y);
    context.stroke();
  }

  context.fillStyle = "rgba(210, 224, 255, 1)";

  for (const particle of particles) {
    if (particle.life < 0.02) {
      continue;
    }

    const twinkleWave = Math.sin(elapsedSeconds * 0.45 + particle.twinklePhase);
    const twinkleNormalized = (twinkleWave + 1) * 0.5;
    const twinkleFactor = 0.72 + twinkleNormalized * (1.16 - 0.72);
    const twinkleBoost = 1 + 0.2 * twinkleNormalized;
    const displacement = Math.hypot(
      particle.position.x - particle.origin.x,
      particle.position.y - particle.origin.y,
    );
    const reaction = clamp(displacement / 96, 0, 1);
    const reactionAlpha = 1 + reaction * 0.65;
    const reactionSize = 1 + reaction * 0.58;
    const energyAlpha = 1 + particle.energy * 0.2;
    const energySize = 1 + particle.energy * 0.12;

    context.globalAlpha = particle.alpha * particle.life * twinkleFactor * reactionAlpha * energyAlpha;
    context.beginPath();
    context.arc(
      particle.position.x,
      particle.position.y,
      particle.radius * twinkleBoost * reactionSize * energySize,
      0,
      Math.PI * 2,
    );
    context.fill();
  }

  context.globalAlpha = 1;
  context.restore();
};
