import type { MirrorTargetPoint } from "@/lib/creative/adapters/personMaskToTargets";

export type MirrorParticle = {
  id: number;
  slotIndex: number;
  origin: { x: number; y: number };
  position: { x: number; y: number };
  previousPosition: { x: number; y: number };
  velocity: { x: number; y: number };
  radius: number;
  alpha: number;
  life: number;
  energy: number;
  twinklePhase: number;
};

export type MirrorParticleSimulationConfig = {
  targetFollowStrength: number;
  returnStrength: number;
  targetVelocityMatch: number;
  snapbackDistance: number;
  snapbackStrength: number;
  friction: number;
  maxSpeed: number;
  inactiveVelocityDamping: number;
  lifeInSpeed: number;
  lifeOutSpeed: number;
};

export type AdvanceMirrorParticlesPayload = {
  particles: MirrorParticle[];
  targets: MirrorTargetPoint[];
  boundsWidth: number;
  boundsHeight: number;
  elapsedSeconds: number;
  deltaSeconds: number;
  config: MirrorParticleSimulationConfig;
};
