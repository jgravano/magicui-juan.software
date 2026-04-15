import type { MirrorTargetPoint } from "@/lib/creative/adapters/personMaskToTargets";
import { clamp, randomBetween } from "@/lib/creative/math";
import type { AdvanceMirrorParticlesPayload, MirrorParticle } from "@/lib/creative/particles/types";

const confineAxis = (value: number, velocity: number, max: number) => {
  if (max <= 0) {
    return {
      value,
      velocity,
    };
  }

  if (value < 0.5) {
    return {
      value: 0.5,
      velocity: Math.abs(velocity) * 0.22,
    };
  }

  if (value > max - 0.5) {
    return {
      value: max - 0.5,
      velocity: -Math.abs(velocity) * 0.22,
    };
  }

  return {
    value,
    velocity,
  };
};

const isActiveTarget = (target: MirrorTargetPoint | null | undefined) =>
  Boolean(target && target.active);

export const createMirrorParticles = (
  count: number,
  width: number,
  height: number,
): MirrorParticle[] => {
  const particles: MirrorParticle[] = [];
  const aspect = width > 0 && height > 0 ? width / height : 1;
  const columns = Math.max(1, Math.floor(Math.sqrt(count * aspect)));
  const rows = Math.max(1, Math.ceil(count / columns));
  const stepX = width / Math.max(1, columns);
  const stepY = height / Math.max(1, rows);

  let index = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (index >= count) {
        break;
      }

      const centerX = (column + 0.5) * stepX;
      const centerY = (row + 0.5) * stepY;
      const x = centerX + randomBetween(-stepX * 0.25, stepX * 0.25);
      const y = centerY + randomBetween(-stepY * 0.25, stepY * 0.25);

      particles.push({
        id: index + 1,
        slotIndex: -1,
        origin: { x, y },
        position: { x, y },
        previousPosition: { x, y },
        velocity: { x: 0, y: 0 },
        radius: randomBetween(0.62, 1.34),
        alpha: randomBetween(0.24, 0.62),
        life: 0,
        energy: 0,
        twinklePhase: randomBetween(0, Math.PI * 2),
      });

      index += 1;
    }
  }

  return particles;
};

export const advanceMirrorParticles = (payload: AdvanceMirrorParticlesPayload) => {
  const { particles, targets, boundsWidth, boundsHeight, deltaSeconds, config } = payload;

  const particleCount = particles.length;
  const targetCount = targets.length;

  for (let index = 0; index < particleCount; index += 1) {
    const particle = particles[index];
    if (!particle) {
      continue;
    }

    particle.previousPosition.x = particle.position.x;
    particle.previousPosition.y = particle.position.y;

    if (targetCount > 0) {
      if (particle.slotIndex < 0 || particle.slotIndex >= targetCount) {
        particle.slotIndex =
          targetCount <= 1 || particleCount <= 1
            ? 0
            : Math.floor((index * (targetCount - 1)) / Math.max(1, particleCount - 1));
      }

      const target = targets[particle.slotIndex] ?? null;
      if (target && isActiveTarget(target)) {
        const previousOriginX = particle.origin.x;
        const previousOriginY = particle.origin.y;
        const confidence = clamp(target.confidence, 0, 1);
        particle.origin.x = target.x;
        particle.origin.y = target.y;

        const safeDelta = Math.max(0.0001, deltaSeconds);
        const targetVelocityX = (particle.origin.x - previousOriginX) / safeDelta;
        const targetVelocityY = (particle.origin.y - previousOriginY) / safeDelta;
        const toOriginX = particle.origin.x - particle.position.x;
        const toOriginY = particle.origin.y - particle.position.y;
        const displacementDistance = Math.hypot(toOriginX, toOriginY);
        const followStrength =
          config.targetFollowStrength *
          (0.74 + confidence * 0.26) *
          (0.84 + target.weight * 0.16);
        const velocityDamping = config.returnStrength * (0.88 + confidence * 0.12);
        const springForceX = toOriginX * followStrength - particle.velocity.x * velocityDamping;
        const springForceY = toOriginY * followStrength - particle.velocity.y * velocityDamping;
        const snapExcess = Math.max(0, displacementDistance - config.snapbackDistance);
        const snapForce = snapExcess * config.snapbackStrength;
        const snapForceX =
          displacementDistance > 0.0001 ? (toOriginX / displacementDistance) * snapForce : 0;
        const snapForceY =
          displacementDistance > 0.0001 ? (toOriginY / displacementDistance) * snapForce : 0;

        particle.velocity.x += (springForceX + snapForceX) * deltaSeconds;
        particle.velocity.y += (springForceY + snapForceY) * deltaSeconds;

        const velocityBlend = 1 - Math.exp(-config.targetVelocityMatch * deltaSeconds);
        particle.velocity.x += (targetVelocityX - particle.velocity.x) * velocityBlend;
        particle.velocity.y += (targetVelocityY - particle.velocity.y) * velocityBlend;

        const lifeTarget = 0.24 + confidence * 0.76;
        const lifeBlend = 1 - Math.exp(-config.lifeInSpeed * deltaSeconds);
        particle.life += (lifeTarget - particle.life) * lifeBlend;
        particle.life = clamp(particle.life, 0, 1);

        const speedSignal = clamp(
          Math.hypot(particle.velocity.x, particle.velocity.y) / Math.max(1, config.maxSpeed),
          0,
          1,
        );
        const energyTarget = clamp(confidence * 0.42 + speedSignal * 0.58, 0, 1);
        const energyBlend = 1 - Math.exp(-6.8 * deltaSeconds);
        particle.energy += (energyTarget - particle.energy) * energyBlend;
        particle.energy = clamp(particle.energy, 0, 1);
      } else {
        particle.velocity.x *= Math.exp(-config.inactiveVelocityDamping * deltaSeconds);
        particle.velocity.y *= Math.exp(-config.inactiveVelocityDamping * deltaSeconds);
        particle.life = clamp(particle.life - config.lifeOutSpeed * deltaSeconds, 0, 1);
        particle.energy = clamp(
          particle.energy - config.lifeOutSpeed * 0.34 * deltaSeconds,
          0,
          1,
        );
      }
    } else {
      particle.velocity.x *= Math.exp(-config.inactiveVelocityDamping * deltaSeconds);
      particle.velocity.y *= Math.exp(-config.inactiveVelocityDamping * deltaSeconds);

      particle.life = clamp(particle.life - config.lifeOutSpeed * deltaSeconds, 0, 1);
      particle.energy = clamp(
        particle.energy - config.lifeOutSpeed * 0.32 * deltaSeconds,
        0,
        1,
      );
    }

    const friction = Math.exp(-config.friction * deltaSeconds);
    particle.velocity.x *= friction;
    particle.velocity.y *= friction;

    const speed = Math.hypot(particle.velocity.x, particle.velocity.y);
    if (speed > config.maxSpeed) {
      const speedScale = config.maxSpeed / speed;
      particle.velocity.x *= speedScale;
      particle.velocity.y *= speedScale;
    }

    particle.position.x += particle.velocity.x * deltaSeconds;
    particle.position.y += particle.velocity.y * deltaSeconds;

    const confinedX = confineAxis(particle.position.x, particle.velocity.x, boundsWidth);
    particle.position.x = confinedX.value;
    particle.velocity.x = confinedX.velocity;

    const confinedY = confineAxis(particle.position.y, particle.velocity.y, boundsHeight);
    particle.position.y = confinedY.value;
    particle.velocity.y = confinedY.velocity;
  }
};
