import type { CameraStatus } from "@/lib/creative/camera/types";
import type { SegmentationStatus } from "@/lib/creative/segmentation/types";

export type MeltPhase = "booting" | "learning" | "ready" | "melting" | "gone" | "error";

export type MeltUIState = {
  phase: MeltPhase;
  cameraStatus: CameraStatus;
  segmentationStatus: SegmentationStatus;
  coverage: number;
  renderFps: number;
  foregroundRatio: number;
  debugEnabled: boolean;
  notice: string | null;
};

export type MeltController = {
  start: () => Promise<void>;
  stop: () => void;
  trigger: () => void;
  resetEffect: () => void;
  relearnBackground: () => void;
  toggleDebug: () => void;
};
