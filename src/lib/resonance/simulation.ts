import {
  CURSOR_BASE_RADIUS,
  CURSOR_MAX_RADIUS_BOOST,
  CURSOR_OPACITY_HIDDEN,
  CURSOR_OPACITY_RESPONSE,
  CURSOR_OPACITY_VISIBLE,
  CURSOR_SPEED_FOR_MAX_RADIUS,
  CURSOR_SPRING_DAMPING,
  CURSOR_SPRING_STIFFNESS,
  MAX_FRAME_DELTA_SECONDS,
  PARTICLE_FRICTION,
  PARTICLE_DAMAGE_ACCUMULATION,
  PARTICLE_DAMAGE_FRICTION_REDUCTION,
  PARTICLE_DAMAGE_RECOVERY,
  PARTICLE_DAMAGE_RETURN_REDUCTION,
  PARTICLE_MAGNET_DEAD_ZONE,
  PARTICLE_MAGNET_PUSH_BASE_MULTIPLIER,
  PARTICLE_MAGNET_PUSH_SPEED_MULTIPLIER,
  PARTICLE_MAGNET_PULL_STRENGTH,
  PARTICLE_MAGNET_PUSH_STRENGTH,
  PARTICLE_MAGNET_RADIUS,
  PARTICLE_MAX_SPEED,
  PARTICLE_MOTION_INTENSITY_BOOST,
  PARTICLE_MOTION_INTENSITY_SPEED,
  PARTICLE_RETURN_STRENGTH,
  PARTICLE_SNAPBACK_DISTANCE,
  PARTICLE_SNAPBACK_STRENGTH,
  PULSE_END_RADIUS,
  PULSE_IRREGULARITY_BASE,
  PULSE_IRREGULARITY_ID_MULTIPLIER,
  PULSE_IRREGULARITY_RANGE,
  PULSE_LIFETIME_SECONDS,
  PULSE_DIRECTIONAL_PUSH_BACK_REDUCTION,
  PULSE_DIRECTIONAL_PUSH_BONUS,
  PULSE_DIRECTION_SEED_GOLDEN_ANGLE,
  PULSE_DIRECTION_SEED_TIME_FACTOR,
  PULSE_RANDOM_DIRECTION_THRESHOLD,
  PULSE_PUSH_BAND_WIDTH,
  PULSE_PUSH_STRENGTH,
  PULSE_PUSH_TRAIL_BOOST,
  PULSE_SWIRL_STRENGTH,
  PULSE_SWIRL_LIFE_MIN,
  PULSE_SWIRL_LIFE_RANGE,
  PULSE_START_RADIUS,
  PULSE_TURBULENCE_FREQUENCY,
  PULSE_TURBULENCE_PHASE_MULTIPLIER,
  PULSE_TURBULENCE_PUSH_VARIATION,
  PULSE_TURBULENCE_STRENGTH,
  PULSE_TURBULENCE_TIME_SPEED,
} from "./constants";
import type {
  CanvasDimensions,
  CursorState,
  FrameClock,
  InputState,
  Particle,
  Pulse,
} from "./types";
import { clamp, inverseLerp, lerp } from "./utils";

export const createFrameClock = (): FrameClock => ({
  elapsedSeconds: 0,
  deltaSeconds: 0,
});

export const advanceFrameClock = (frameClock: FrameClock, rawDeltaSeconds: number) => {
  const safeDeltaSeconds = Math.min(Math.max(rawDeltaSeconds, 0), MAX_FRAME_DELTA_SECONDS);

  frameClock.deltaSeconds = safeDeltaSeconds;
  frameClock.elapsedSeconds += safeDeltaSeconds;
};

export const createCursorState = (dimensions: CanvasDimensions): CursorState => ({
  position: {
    x: dimensions.width * 0.5,
    y: dimensions.height * 0.5,
  },
  velocity: { x: 0, y: 0 },
  opacity: 0,
  radius: CURSOR_BASE_RADIUS,
});

const advanceSpringAxis = (
  position: number,
  velocity: number,
  target: number,
  deltaSeconds: number,
) => {
  const displacement = target - position;
  const acceleration =
    displacement * CURSOR_SPRING_STIFFNESS - velocity * CURSOR_SPRING_DAMPING;
  const nextVelocity = velocity + acceleration * deltaSeconds;
  const nextPosition = position + nextVelocity * deltaSeconds;

  return {
    position: nextPosition,
    velocity: nextVelocity,
  };
};

export const advanceCursorState = (
  cursorState: CursorState,
  inputState: InputState,
  deltaSeconds: number,
) => {
  const springX = advanceSpringAxis(
    cursorState.position.x,
    cursorState.velocity.x,
    inputState.pointer.x,
    deltaSeconds,
  );
  const springY = advanceSpringAxis(
    cursorState.position.y,
    cursorState.velocity.y,
    inputState.pointer.y,
    deltaSeconds,
  );

  cursorState.position.x = springX.position;
  cursorState.position.y = springY.position;
  cursorState.velocity.x = springX.velocity;
  cursorState.velocity.y = springY.velocity;

  const targetOpacity = inputState.isPointerInside
    ? CURSOR_OPACITY_VISIBLE
    : CURSOR_OPACITY_HIDDEN;
  const opacityBlend = 1 - Math.exp(-CURSOR_OPACITY_RESPONSE * deltaSeconds);
  cursorState.opacity = lerp(cursorState.opacity, targetOpacity, opacityBlend);

  const speedRatio = inverseLerp(inputState.speed, 0, CURSOR_SPEED_FOR_MAX_RADIUS);
  cursorState.radius = CURSOR_BASE_RADIUS + speedRatio * CURSOR_MAX_RADIUS_BOOST;
};

export const advanceParticlesState = (
  particles: Particle[],
  inputState: InputState,
  cursorState: CursorState,
  pulses: Pulse[],
  deltaSeconds: number,
) => {
  const isMagnetActive = inputState.isPointerInside;
  const motionRatio = clamp(inputState.speed / PARTICLE_MOTION_INTENSITY_SPEED, 0, 1);
  const magnetIntensity = 1 + motionRatio * PARTICLE_MOTION_INTENSITY_BOOST;

  for (const particle of particles) {
    const toOriginX = particle.origin.x - particle.position.x;
    const toOriginY = particle.origin.y - particle.position.y;
    const displacementDistance = Math.hypot(toOriginX, toOriginY);

    let magnetForceX = 0;
    let magnetForceY = 0;
    let pulseForceX = 0;
    let pulseForceY = 0;

    if (isMagnetActive) {
      const toCursorX = cursorState.position.x - particle.position.x;
      const toCursorY = cursorState.position.y - particle.position.y;
      const distance = Math.hypot(toCursorX, toCursorY);

      if (distance > 0.0001 && distance < PARTICLE_MAGNET_RADIUS) {
        const normalizedX = toCursorX / distance;
        const normalizedY = toCursorY / distance;
        const influence = 1 - distance / PARTICLE_MAGNET_RADIUS;
        const influenceSquared = influence * influence;

        if (distance > PARTICLE_MAGNET_DEAD_ZONE) {
          const pull = PARTICLE_MAGNET_PULL_STRENGTH * influenceSquared * magnetIntensity;
          magnetForceX = normalizedX * pull;
          magnetForceY = normalizedY * pull;
        } else {
          const pushFactor = 1 - distance / PARTICLE_MAGNET_DEAD_ZONE;
          const push =
            PARTICLE_MAGNET_PUSH_STRENGTH *
            pushFactor *
            (PARTICLE_MAGNET_PUSH_BASE_MULTIPLIER +
              motionRatio * PARTICLE_MAGNET_PUSH_SPEED_MULTIPLIER);
          magnetForceX = -normalizedX * push;
          magnetForceY = -normalizedY * push;
        }
      }
    }

    for (const pulse of pulses) {
      const fromPulseX = particle.position.x - pulse.origin.x;
      const fromPulseY = particle.position.y - pulse.origin.y;
      const distance = Math.hypot(fromPulseX, fromPulseY);

      if (distance < 0.0001) {
        continue;
      }

      const pulseProgress = clamp(pulse.ageSeconds / pulse.lifeSeconds, 0, 1);
      const pulseRadius = pulse.startRadius + (pulse.endRadius - pulse.startRadius) * pulseProgress;
      const directionX = fromPulseX / distance;
      const directionY = fromPulseY / distance;
      const angle = Math.atan2(directionY, directionX);
      const turbulenceWave = Math.sin(
        angle * PULSE_TURBULENCE_FREQUENCY +
          pulse.turbulencePhase +
          pulseProgress * PULSE_TURBULENCE_TIME_SPEED,
      );
      const turbulenceOffset =
        turbulenceWave * PULSE_PUSH_BAND_WIDTH * PULSE_TURBULENCE_STRENGTH * pulse.irregularity;
      const effectiveRadius = pulseRadius + turbulenceOffset;
      const bandDistance = Math.abs(distance - effectiveRadius);

      if (bandDistance > PULSE_PUSH_BAND_WIDTH) {
        continue;
      }

      const alignment = directionX * pulse.direction.x + directionY * pulse.direction.y;
      const forwardBonus = Math.max(0, alignment) * PULSE_DIRECTIONAL_PUSH_BONUS;
      const backReduction = Math.max(0, -alignment) * PULSE_DIRECTIONAL_PUSH_BACK_REDUCTION;
      const directionalFactor = 1 + forwardBonus - backReduction;
      const bandStrength = 1 - bandDistance / PULSE_PUSH_BAND_WIDTH;
      const lifeFade = 1 - pulseProgress;
      const trailingBoost = pulseProgress > 0.35 ? PULSE_PUSH_TRAIL_BOOST : 0;
      // Small turbulence and swirl break the "perfect circle" feel of shockwaves.
      const turbulenceBoost = 1 + turbulenceWave * PULSE_TURBULENCE_PUSH_VARIATION * pulse.irregularity;
      const push =
        PULSE_PUSH_STRENGTH *
        bandStrength *
        (lifeFade + trailingBoost) *
        directionalFactor *
        turbulenceBoost;
      const tangentX = -directionY;
      const tangentY = directionX;
      const swirl =
        PULSE_SWIRL_STRENGTH *
        bandStrength *
        pulse.irregularity *
        turbulenceWave *
        (PULSE_SWIRL_LIFE_MIN + lifeFade * PULSE_SWIRL_LIFE_RANGE);

      pulseForceX += directionX * push;
      pulseForceY += directionY * push;
      pulseForceX += tangentX * swirl;
      pulseForceY += tangentY * swirl;
    }

    const interactionMagnitude = Math.hypot(magnetForceX + pulseForceX, magnetForceY + pulseForceY);
    // Damage is a temporary "fracture" memory: stressed particles return slower.
    const damageGain = interactionMagnitude * PARTICLE_DAMAGE_ACCUMULATION * deltaSeconds;
    particle.damage = clamp(particle.damage + damageGain, 0, 1);
    particle.damage *= Math.exp(-PARTICLE_DAMAGE_RECOVERY * deltaSeconds);

    const returnStrength =
      PARTICLE_RETURN_STRENGTH * (1 - particle.damage * PARTICLE_DAMAGE_RETURN_REDUCTION);
    const returnForceX = toOriginX * returnStrength;
    const returnForceY = toOriginY * returnStrength;
    const snapbackExcess = Math.max(0, displacementDistance - PARTICLE_SNAPBACK_DISTANCE);
    const snapbackForce =
      displacementDistance > 0.0001 ? snapbackExcess * PARTICLE_SNAPBACK_STRENGTH : 0;
    const snapbackForceX =
      displacementDistance > 0.0001 ? (toOriginX / displacementDistance) * snapbackForce : 0;
    const snapbackForceY =
      displacementDistance > 0.0001 ? (toOriginY / displacementDistance) * snapbackForce : 0;

    const accelerationX = returnForceX + snapbackForceX + magnetForceX + pulseForceX;
    const accelerationY = returnForceY + snapbackForceY + magnetForceY + pulseForceY;

    particle.velocity.x += accelerationX * deltaSeconds;
    particle.velocity.y += accelerationY * deltaSeconds;

    const frictionFactor = Math.exp(
      -PARTICLE_FRICTION * (1 - particle.damage * PARTICLE_DAMAGE_FRICTION_REDUCTION) * deltaSeconds,
    );
    particle.velocity.x *= frictionFactor;
    particle.velocity.y *= frictionFactor;

    const speed = Math.hypot(particle.velocity.x, particle.velocity.y);
    if (speed > PARTICLE_MAX_SPEED) {
      const speedScale = PARTICLE_MAX_SPEED / speed;
      particle.velocity.x *= speedScale;
      particle.velocity.y *= speedScale;
    }

    particle.previousPosition.x = particle.position.x;
    particle.previousPosition.y = particle.position.y;
    particle.position.x += particle.velocity.x * deltaSeconds;
    particle.position.y += particle.velocity.y * deltaSeconds;
  }
};

export const spawnPulsesFromInput = (pulses: Pulse[], inputState: InputState) => {
  for (const click of inputState.frameClicks) {
    if (!click.isInside) {
      continue;
    }

    const clickSpeed = Math.hypot(click.velocity.x, click.velocity.y);
    const randomAngle =
      ((click.id * PULSE_DIRECTION_SEED_GOLDEN_ANGLE) % (Math.PI * 2)) +
      click.timestampSeconds * PULSE_DIRECTION_SEED_TIME_FACTOR;
    const fallbackDirection = {
      x: Math.cos(randomAngle),
      y: Math.sin(randomAngle),
    };
    const direction =
      clickSpeed > PULSE_RANDOM_DIRECTION_THRESHOLD
        ? { x: click.velocity.x / clickSpeed, y: click.velocity.y / clickSpeed }
        : fallbackDirection;
    const irregularity =
      PULSE_IRREGULARITY_BASE +
      (((click.id * PULSE_IRREGULARITY_ID_MULTIPLIER) % 100) / 100) * PULSE_IRREGULARITY_RANGE;

    pulses.push({
      id: click.id,
      origin: { x: click.position.x, y: click.position.y },
      direction,
      turbulencePhase: randomAngle * PULSE_TURBULENCE_PHASE_MULTIPLIER,
      irregularity,
      ageSeconds: 0,
      lifeSeconds: PULSE_LIFETIME_SECONDS,
      startRadius: PULSE_START_RADIUS,
      endRadius: PULSE_END_RADIUS,
    });
  }
};

export const advancePulsesState = (pulses: Pulse[], deltaSeconds: number) => {
  for (let index = pulses.length - 1; index >= 0; index -= 1) {
    const pulse = pulses[index];
    pulse.ageSeconds += deltaSeconds;

    if (pulse.ageSeconds >= pulse.lifeSeconds) {
      pulses.splice(index, 1);
    }
  }
};
