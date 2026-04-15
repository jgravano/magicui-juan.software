import type { CanvasDimensions } from "@/lib/creative/core/canvas";
import type { MirrorParticle } from "@/lib/creative/particles/types";

type RenderParticleMirrorPayload = {
  context: CanvasRenderingContext2D;
  dimensions: CanvasDimensions;
  particles: MirrorParticle[];
  motionEnergy: number;
};

export const renderParticleMirror = (payload: RenderParticleMirrorPayload) => {
  const { context, dimensions, particles, motionEnergy } = payload;
  const { width, height } = dimensions;

  context.save();
  context.fillStyle = "rgba(0, 0, 0, 0.30)";
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = "lighter";

  context.lineCap = "round";

  for (const particle of particles) {
    if (particle.life < 0.015) {
      continue;
    }

    const travel = Math.hypot(
      particle.position.x - particle.previousPosition.x,
      particle.position.y - particle.previousPosition.y,
    );

    if (travel < 0.05) {
      continue;
    }

    const trailAlpha = Math.min(0.42, 0.08 + particle.life * 0.38);
    context.strokeStyle = `rgba(206, 224, 255, ${trailAlpha})`;
    context.lineWidth = 0.8 + particle.life * 0.7;
    context.beginPath();
    context.moveTo(particle.previousPosition.x, particle.previousPosition.y);
    context.lineTo(particle.position.x, particle.position.y);
    context.stroke();
  }

  for (const particle of particles) {
    if (particle.life < 0.01) {
      continue;
    }

    const glowAlpha = particle.alpha * (0.25 + particle.life * 0.75) * (1 + motionEnergy * 0.55);
    const glowRadius = particle.radius * (1 + particle.life * 0.8);

    context.fillStyle = `rgba(224, 236, 255, ${glowAlpha})`;
    context.beginPath();
    context.arc(particle.position.x, particle.position.y, glowRadius, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
};
