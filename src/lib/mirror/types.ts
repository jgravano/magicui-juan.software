import type { CameraStatus } from "@/lib/creative/camera/types";
import type { FrameProcessingSnapshot } from "@/lib/creative/processing/frameProcessing";

export type MirrorDebugStage = 1 | 2 | 3 | 4;

export type MirrorDebugState = {
  enabled: boolean;
  stage: MirrorDebugStage;
};

export type MirrorProcessingMetrics = Pick<
  FrameProcessingSnapshot,
  "width" | "height" | "processingMs" | "luminanceMean" | "motionMean" | "motionPeak"
>;

export type MirrorLiquidMetrics = {
  shaderReady: boolean;
  motionEnergy: number;
  renderMs: number;
};

export type MirrorUIState = {
  cameraStatus: CameraStatus;
  notice: string | null;
  renderFps: number;
  debug: MirrorDebugState;
  processing: MirrorProcessingMetrics | null;
  liquid: MirrorLiquidMetrics | null;
  particlePaused: boolean;
};

export type MirrorController = {
  start: () => Promise<void>;
  stop: () => void;
  setDebugEnabled: (enabled: boolean) => void;
  toggleDebugEnabled: () => void;
  setDebugStage: (stage: MirrorDebugStage) => void;
  setPointerUv: (x: number, y: number) => void;
  clearPointerUv: () => void;
  registerPointerImpact: (x: number, y: number) => void;
};
