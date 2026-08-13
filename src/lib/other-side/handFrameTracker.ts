import type {
  OtherSideHandTrackingStatus,
  OtherSidePoint,
  OtherSideTrackedHand,
} from "@/lib/other-side/types";

type VisionModule = typeof import("@mediapipe/tasks-vision");
type Landmark = import("@mediapipe/tasks-vision").NormalizedLandmark;

export type OtherSideHandFrame = {
  hands: OtherSideTrackedHand[];
};

export type OtherSideHandTracker = {
  status: OtherSideHandTrackingStatus;
  errorMessage: string | null;
  initialize: () => Promise<void>;
  processVideoFrame: (video: HTMLVideoElement, timestampMs: number) => OtherSideHandFrame;
  dispose: () => void;
};

const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm";
const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_MCP = 5;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const PINKY_MCP = 17;

const OTHER_FINGERS = [
  { pip: 10, tip: 12 },
  { pip: 14, tip: 16 },
  { pip: 18, tip: 20 },
] as const;

const distance = (a: Landmark, b: Landmark, aspect: number) =>
  Math.hypot((a.x - b.x) * aspect, a.y - b.y);

const toPoint = (landmark: Landmark): OtherSidePoint => ({
  x: landmark.x,
  y: landmark.y,
  z: landmark.z,
});

export const createOtherSideHandTracker = (): OtherSideHandTracker => {
  let landmarker: import("@mediapipe/tasks-vision").HandLandmarker | null = null;

  const tracker: OtherSideHandTracker = {
    status: "idle",
    errorMessage: null,
    initialize: async () => {
      if (tracker.status === "loading" || tracker.status === "ready") return;

      tracker.status = "loading";
      tracker.errorMessage = null;

      try {
        const visionTasks = (await import("@mediapipe/tasks-vision")) as VisionModule;
        const fileset = await visionTasks.FilesetResolver.forVisionTasks(WASM_BASE_URL);
        const options: import("@mediapipe/tasks-vision").HandLandmarkerOptions = {
          baseOptions: { modelAssetPath: MODEL_ASSET_PATH, delegate: "GPU" },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.48,
          minHandPresenceConfidence: 0.48,
          minTrackingConfidence: 0.48,
        };

        try {
          landmarker = await visionTasks.HandLandmarker.createFromOptions(fileset, options);
        } catch {
          landmarker = await visionTasks.HandLandmarker.createFromOptions(fileset, {
            ...options,
            baseOptions: { modelAssetPath: MODEL_ASSET_PATH, delegate: "CPU" },
          });
        }
        tracker.status = "ready";
      } catch (error) {
        tracker.status = "error";
        tracker.errorMessage =
          error instanceof Error ? error.message : "Unable to initialize hand tracking.";
      }
    },
    processVideoFrame: (video, timestampMs) => {
      if (
        !landmarker ||
        tracker.status !== "ready" ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        video.videoWidth <= 0
      ) {
        return { hands: [] };
      }

      try {
        const aspect = video.videoWidth / Math.max(1, video.videoHeight);
        const landmarks = landmarker.detectForVideo(video, timestampMs).landmarks;
        const hands = landmarks.map((hand): OtherSideTrackedHand => {
          const palmScale = Math.max(
            0.035,
            (distance(hand[INDEX_MCP], hand[PINKY_MCP], aspect) +
              distance(hand[WRIST], hand[MIDDLE_MCP], aspect)) *
              0.5,
          );
          const pinchRatio = distance(hand[THUMB_TIP], hand[INDEX_TIP], aspect) / palmScale;
          const indexReach = distance(hand[INDEX_TIP], hand[INDEX_MCP], aspect) / palmScale;
          let foldedFingers = 0;

          for (const finger of OTHER_FINGERS) {
            const tipToWrist = distance(hand[finger.tip], hand[WRIST], aspect);
            const pipToWrist = distance(hand[finger.pip], hand[WRIST], aspect);
            if (tipToWrist < pipToWrist * 1.16) foldedFingers += 1;
          }

          const pinching = pinchRatio < 0.54 && indexReach > 0.5;
          const pointing = !pinching && indexReach > 0.76 && foldedFingers >= 2;
          const gesture = pinching ? "pinch" : pointing ? "point" : "none";
          const anchor = pinching
            ? {
                x: (hand[THUMB_TIP].x + hand[INDEX_TIP].x) * 0.5,
                y: (hand[THUMB_TIP].y + hand[INDEX_TIP].y) * 0.5,
                z: (hand[THUMB_TIP].z + hand[INDEX_TIP].z) * 0.5,
              }
            : pointing
              ? toPoint(hand[INDEX_TIP])
              : null;

          return {
            landmarks: hand.map(toPoint),
            anchor,
            gesture,
          };
        });

        return { hands };
      } catch {
        tracker.status = "error";
        tracker.errorMessage = "Hand tracking stopped while reading the camera.";
        return { hands: [] };
      }
    },
    dispose: () => {
      landmarker?.close();
      landmarker = null;
      tracker.status = "idle";
    },
  };

  return tracker;
};
