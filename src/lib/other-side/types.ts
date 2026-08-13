import type { CameraStatus } from "@/lib/creative/camera/types";

export type OtherSidePhase = "booting" | "ready" | "error";
export type OtherSideHandTrackingStatus = "idle" | "loading" | "ready" | "error";

export type OtherSidePoint = {
  x: number;
  y: number;
  z: number;
};

export type OtherSideTrackedHand = {
  landmarks: OtherSidePoint[];
  anchor: OtherSidePoint | null;
  gesture: "none" | "pinch" | "point";
};

export type OtherSideRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OtherSideUIState = {
  phase: OtherSidePhase;
  cameraStatus: CameraStatus;
  handTrackingStatus: OtherSideHandTrackingStatus;
  handsVisible: number;
  activeHandles: number;
  frameActive: boolean;
  renderFps: number;
  notice: string | null;
};

export type OtherSideController = {
  start: () => Promise<void>;
  stop: () => void;
};
