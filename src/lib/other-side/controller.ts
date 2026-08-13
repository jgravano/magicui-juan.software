import { createWebcamProvider } from "@/lib/creative/camera/webcam";
import { computeCoverSourceRect } from "@/lib/creative/core/canvas";
import { createCreativeQualityProfile } from "@/lib/creative/core/quality";
import { clamp } from "@/lib/creative/math";
import { createPersonSegmentationProvider } from "@/lib/creative/segmentation/personSegmentation";
import { createSegmentationRefiner } from "@/lib/creative/segmentation/refineMask";
import { createOtherSideHandTracker } from "@/lib/other-side/handFrameTracker";
import { createParticleWorldRenderer } from "@/lib/other-side/particleWorldRenderer";
import type {
  OtherSideController,
  OtherSidePoint,
  OtherSideRegion,
  OtherSideTrackedHand,
  OtherSideUIState,
} from "@/lib/other-side/types";

type CreateOtherSideControllerPayload = {
  canvas: HTMLCanvasElement;
  onStateChange?: (state: OtherSideUIState) => void;
};

const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [17, 0],
] as const;

const HAND_COLORS = ["#b8ceff", "#8fa8ff"] as const;
const MIN_REGION_SIZE = 0.075;
const TRACKING_INTERVAL_MS = 1000 / 30;

const resizeDisplayCanvas = (
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  dpr: number,
) => {
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
};

const resizeWorkingCanvas = (canvas: HTMLCanvasElement, width: number, height: number) => {
  if (canvas.width === width && canvas.height === height) return;
  canvas.width = width;
  canvas.height = height;
};

const drawMirroredVideo = (
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
) => {
  const source = computeCoverSourceRect(video.videoWidth, video.videoHeight, width, height);

  context.save();
  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(
    video,
    source.sx,
    source.sy,
    source.sWidth,
    source.sHeight,
    0,
    0,
    width,
    height,
  );
  context.restore();
};

const drawMirroredMask = (payload: {
  context: CanvasRenderingContext2D;
  mask: HTMLCanvasElement;
  video: HTMLVideoElement;
  width: number;
  height: number;
}) => {
  const { context, mask, video, width, height } = payload;
  const source = computeCoverSourceRect(video.videoWidth, video.videoHeight, width, height);
  const scaleX = mask.width / Math.max(1, video.videoWidth);
  const scaleY = mask.height / Math.max(1, video.videoHeight);

  context.save();
  context.fillStyle = "#000";
  context.fillRect(0, 0, width, height);
  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(
    mask,
    source.sx * scaleX,
    source.sy * scaleY,
    source.sWidth * scaleX,
    source.sHeight * scaleY,
    0,
    0,
    width,
    height,
  );
  context.restore();
};

const mapCameraPointToView = (
  point: OtherSidePoint,
  video: HTMLVideoElement,
  viewWidth: number,
  viewHeight: number,
): OtherSidePoint => {
  const source = computeCoverSourceRect(
    video.videoWidth,
    video.videoHeight,
    viewWidth,
    viewHeight,
  );

  return {
    x: ((1 - point.x) * video.videoWidth - source.sx) / source.sWidth,
    y: (point.y * video.videoHeight - source.sy) / source.sHeight,
    z: point.z,
  };
};

const mapHandToView = (
  hand: OtherSideTrackedHand,
  video: HTMLVideoElement,
  viewWidth: number,
  viewHeight: number,
): OtherSideTrackedHand => ({
  ...hand,
  landmarks: hand.landmarks.map((point) =>
    mapCameraPointToView(point, video, viewWidth, viewHeight),
  ),
  anchor: hand.anchor
    ? mapCameraPointToView(hand.anchor, video, viewWidth, viewHeight)
    : null,
});

const regionFromAnchors = (first: OtherSidePoint, second: OtherSidePoint): OtherSideRegion | null => {
  const left = clamp(Math.min(first.x, second.x), 0.015, 0.985);
  const right = clamp(Math.max(first.x, second.x), 0.015, 0.985);
  const top = clamp(Math.min(first.y, second.y), 0.02, 0.98);
  const bottom = clamp(Math.max(first.y, second.y), 0.02, 0.98);
  const width = right - left;
  const height = bottom - top;

  if (width < MIN_REGION_SIZE || height < MIN_REGION_SIZE) return null;

  return { x: left, y: top, width, height };
};

const smoothRegion = (current: OtherSideRegion | null, target: OtherSideRegion): OtherSideRegion => {
  if (!current) return target;

  const amount = 0.48;
  return {
    x: current.x + (target.x - current.x) * amount,
    y: current.y + (target.y - current.y) * amount,
    width: current.width + (target.width - current.width) * amount,
    height: current.height + (target.height - current.height) * amount,
  };
};

export const createOtherSideController = (
  payload: CreateOtherSideControllerPayload,
): OtherSideController => {
  const quality = createCreativeQualityProfile();
  const webcam = createWebcamProvider();
  const handTracker = createOtherSideHandTracker();
  const segmentation = createPersonSegmentationProvider();
  const segmentationRefiner = createSegmentationRefiner({
    riseAlpha: 0.5,
    fallAlpha: 0.28,
    softThresholdOn: 0.54,
    softThresholdOff: 0.38,
  });
  const context = payload.canvas.getContext("2d", { alpha: false });
  const liveFrame = document.createElement("canvas");
  const liveContext = liveFrame.getContext("2d", {
    alpha: false,
  });
  const personMaskFrame = document.createElement("canvas");
  const personMaskContext = personMaskFrame.getContext("2d", { alpha: false });
  const particleWorld = createParticleWorldRenderer();

  let running = false;
  let animationFrameId = 0;
  let phase: OtherSideUIState["phase"] = "booting";
  let notice: string | null = null;
  let viewWidth = 1;
  let viewHeight = 1;
  let dpr = 1;
  let trackedHands: OtherSideTrackedHand[] = [];
  let activeHandles = 0;
  let frameActive = false;
  let region: OtherSideRegion | null = null;
  let previousFrameMs = 0;
  let lastTrackingMs = 0;
  let lastSegmentationMs = 0;
  let hasPersonMask = false;
  let renderFps = 0;
  let lastUiSignature = "";
  let lastUiEmitMs = 0;

  const emitState = (force = false) => {
    const nowMs = performance.now();
    if (!force && nowMs - lastUiEmitMs < 120) return;

    const state: OtherSideUIState = {
      phase,
      cameraStatus: webcam.status,
      handTrackingStatus: handTracker.status,
      handsVisible: trackedHands.length,
      activeHandles,
      frameActive,
      renderFps,
      notice,
    };
    const signature = [
      state.phase,
      state.cameraStatus,
      state.handTrackingStatus,
      state.handsVisible,
      state.activeHandles,
      state.frameActive ? 1 : 0,
      Math.round(state.renderFps),
      state.notice ?? "",
    ].join("|");

    if (!force && signature === lastUiSignature) return;
    lastUiSignature = signature;
    lastUiEmitMs = nowMs;
    payload.onStateChange?.(state);
  };

  const resize = () => {
    viewWidth = Math.max(320, window.innerWidth);
    viewHeight = Math.max(480, window.innerHeight);
    dpr = clamp(window.devicePixelRatio || 1, 1, quality.maxDevicePixelRatio);
    resizeDisplayCanvas(payload.canvas, viewWidth, viewHeight, dpr);

    const longEdge = quality.tier === "high" ? 720 : quality.tier === "medium" ? 600 : 480;
    const aspect = viewWidth / viewHeight;
    const workingWidth =
      aspect >= 1 ? longEdge : Math.max(1, Math.round(longEdge * aspect));
    const workingHeight =
      aspect >= 1 ? Math.max(1, Math.round(longEdge / aspect)) : longEdge;
    resizeWorkingCanvas(liveFrame, workingWidth, workingHeight);
    resizeWorkingCanvas(personMaskFrame, workingWidth, workingHeight);
    particleWorld.resize(workingWidth, workingHeight);
    hasPersonMask = false;

    region = null;
  };

  const updateHands = (timestampMs: number) => {
    if (
      handTracker.status !== "ready" ||
      webcam.status !== "ready" ||
      timestampMs - lastTrackingMs < TRACKING_INTERVAL_MS
    ) {
      return;
    }

    lastTrackingMs = timestampMs;
    const frame = handTracker.processVideoFrame(webcam.video, timestampMs);
    trackedHands = frame.hands.map((hand) =>
      mapHandToView(hand, webcam.video, viewWidth, viewHeight),
    );

    // Index fingertips are direct handles. Pinching and pointing remain detected,
    // but the frame never waits on a brittle gesture classifier.
    const anchors = trackedHands
      .map((hand) => hand.landmarks[8] ?? hand.anchor)
      .filter((anchor): anchor is OtherSidePoint => Boolean(anchor));
    activeHandles = Math.min(2, anchors.length);

    if (anchors.length >= 2) {
      const targetRegion = regionFromAnchors(anchors[0], anchors[1]);
      if (targetRegion) {
        region = smoothRegion(region, targetRegion);
        frameActive = true;
      } else {
        frameActive = false;
        region = null;
      }
    } else {
      frameActive = false;
      region = null;
    }

  };

  const updateSegmentation = (timestampMs: number) => {
    if (
      segmentation.status !== "ready" ||
      webcam.status !== "ready" ||
      !personMaskContext ||
      timestampMs - lastSegmentationMs < 1000 / Math.min(24, quality.segmentationFps)
    ) {
      return;
    }

    lastSegmentationMs = timestampMs;
    const mask = segmentation.segmentVideoFrame(webcam.video, timestampMs);
    if (!mask) return;

    const refined = segmentationRefiner.refine(mask);
    drawMirroredMask({
      context: personMaskContext,
      mask: refined.smoothCanvas,
      video: webcam.video,
      width: personMaskFrame.width,
      height: personMaskFrame.height,
    });
    hasPersonMask = true;
  };

  const drawHand = (hand: OtherSideTrackedHand, index: number) => {
    if (!context || hand.landmarks.length < 21) return;
    const color = HAND_COLORS[index % HAND_COLORS.length];

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    for (const [fromIndex, toIndex] of HAND_CONNECTIONS) {
      const from = hand.landmarks[fromIndex];
      const to = hand.landmarks[toIndex];
      context.moveTo(from.x * viewWidth, from.y * viewHeight);
      context.lineTo(to.x * viewWidth, to.y * viewHeight);
    }
    context.globalAlpha = 0.48;
    context.lineWidth = 6;
    context.strokeStyle = "#030507";
    context.stroke();
    context.globalAlpha = 0.98;
    context.lineWidth = 2.5;
    context.strokeStyle = color;
    context.stroke();

    context.globalAlpha = 1;
    context.fillStyle = color;
    context.strokeStyle = "rgba(3, 5, 7, 0.72)";
    context.lineWidth = 1.5;
    for (const landmark of hand.landmarks) {
      context.beginPath();
      context.arc(landmark.x * viewWidth, landmark.y * viewHeight, 3.25, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    }

    const anchor = hand.landmarks[8];
    if (anchor) {
      context.globalAlpha = 0.62;
      context.lineWidth = 6;
      context.strokeStyle = "#030507";
      context.beginPath();
      context.arc(anchor.x * viewWidth, anchor.y * viewHeight, 11, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = 1;
      context.lineWidth = 3;
      context.strokeStyle = color;
      context.beginPath();
      context.arc(anchor.x * viewWidth, anchor.y * viewHeight, 11, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.arc(anchor.x * viewWidth, anchor.y * viewHeight, 3.5, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  };

  const drawRegion = () => {
    if (!context || !region) return;
    const x = region.x * viewWidth;
    const y = region.y * viewHeight;
    const width = region.width * viewWidth;
    const height = region.height * viewHeight;

    if (particleWorld.ready) {
      context.save();
      context.beginPath();
      context.rect(x, y, width, height);
      context.clip();
      context.drawImage(particleWorld.canvas, 0, 0, viewWidth, viewHeight);
      context.restore();
    }

    context.save();
    const cornerLength = clamp(Math.min(width, height) * 0.13, 18, 42);
    const corners = [
      { x, y, dx: 1, dy: 1, color: HAND_COLORS[0] },
      { x: x + width, y, dx: -1, dy: 1, color: HAND_COLORS[1] },
      { x: x + width, y: y + height, dx: -1, dy: -1, color: HAND_COLORS[0] },
      { x, y: y + height, dx: 1, dy: -1, color: HAND_COLORS[1] },
    ];

    context.lineWidth = 4;
    context.lineCap = "square";
    for (const corner of corners) {
      context.strokeStyle = corner.color;
      context.beginPath();
      context.moveTo(corner.x + corner.dx * cornerLength, corner.y);
      context.lineTo(corner.x, corner.y);
      context.lineTo(corner.x, corner.y + corner.dy * cornerLength);
      context.stroke();
    }
    context.restore();
  };

  const render = (timestampMs: number) => {
    if (!running || !context || !liveContext) return;

    if (previousFrameMs > 0) {
      const instantFps = 1000 / Math.max(1, timestampMs - previousFrameMs);
      renderFps = renderFps === 0 ? instantFps : renderFps + (instantFps - renderFps) * 0.08;
    }
    previousFrameMs = timestampMs;

    if (webcam.status === "ready" && webcam.video.videoWidth > 0) {
      drawMirroredVideo(liveContext, webcam.video, liveFrame.width, liveFrame.height);
      updateSegmentation(timestampMs);
      updateHands(timestampMs);
      if (region && hasPersonMask) {
        particleWorld.render(liveFrame, personMaskFrame, timestampMs);
      }
      if (handTracker.status === "error") {
        phase = "error";
        notice = handTracker.errorMessage;
      }
      if (segmentation.status === "error") {
        phase = "error";
        notice = segmentation.errorMessage;
      }
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = "#050608";
    context.fillRect(0, 0, viewWidth, viewHeight);
    if (webcam.status === "ready") {
      context.drawImage(liveFrame, 0, 0, viewWidth, viewHeight);
    }
    drawRegion();
    trackedHands.forEach(drawHand);
    emitState();

    animationFrameId = window.requestAnimationFrame(render);
  };

  const controller: OtherSideController = {
    start: async () => {
      if (running) return;
      running = true;
      phase = "booting";
      notice = null;
      resize();
      window.addEventListener("resize", resize);
      emitState(true);

      await Promise.all([
        webcam.start(),
        handTracker.initialize(),
        segmentation.initialize(),
      ]);
      if (!running) {
        webcam.stop();
        handTracker.dispose();
        segmentation.dispose();
        return;
      }

      if (
        webcam.status === "ready" &&
        handTracker.status === "ready" &&
        segmentation.status === "ready"
      ) {
        if (particleWorld.ready) {
          phase = "ready";
        } else {
          phase = "error";
          notice = particleWorld.errorMessage;
        }
      } else {
        phase = "error";
        notice =
          webcam.errorMessage ??
          handTracker.errorMessage ??
          segmentation.errorMessage ??
          "Camera unavailable.";
      }
      emitState(true);
      animationFrameId = window.requestAnimationFrame(render);
    },
    stop: () => {
      running = false;
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      webcam.stop();
      handTracker.dispose();
      segmentation.dispose();
      particleWorld.dispose();
    },
  };

  return controller;
};
