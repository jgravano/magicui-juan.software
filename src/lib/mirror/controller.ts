import { createWebcamProvider } from "@/lib/creative/camera/webcam";
import {
  computeCoverSourceRect,
  createCanvasDimensions,
} from "@/lib/creative/core/canvas";
import { advanceFrameClock, createFrameClock } from "@/lib/creative/core/frameClock";
import { createCreativeQualityProfile } from "@/lib/creative/core/quality";
import { clamp, damp } from "@/lib/creative/math";
import {
  createFrameProcessor,
  type FrameProcessingSnapshot,
} from "@/lib/creative/processing/frameProcessing";
import {
  MIRROR_CAMERA_MIRROR_X,
  MIRROR_DEBUG_PANEL_HEIGHT,
  MIRROR_DEBUG_PANEL_WIDTH,
  MIRROR_MAX_FRAME_DELTA_SECONDS,
  MIRROR_MIN_CANVAS_HEIGHT,
  MIRROR_MIN_CANVAS_WIDTH,
} from "@/lib/mirror/constants";
import { createLiquidMetalRenderer, type LiquidMetalRenderer } from "@/lib/mirror/renderers/liquidMetal";
import type {
  MirrorController,
  MirrorDebugStage,
  MirrorDebugState,
  MirrorLiquidMetrics,
  MirrorProcessingMetrics,
  MirrorUIState,
} from "@/lib/mirror/types";

type CreateMirrorControllerPayload = {
  canvas: HTMLCanvasElement;
  debugCanvas?: HTMLCanvasElement;
  debug?: Partial<MirrorDebugState>;
  onStateChange?: (state: MirrorUIState) => void;
};

type MirrorInteractionImpact = {
  x: number;
  y: number;
  startTimeSeconds: number;
  strength: number;
};

const MIRROR_INTERACTION_MAX_IMPACTS = 8;
const MIRROR_INTERACTION_IMPACT_MAX_AGE_SECONDS = 1.2;

const stageNotice = (stage: MirrorDebugStage) => {
  if (stage === 1) {
    return "Layer 1: base object (no camera dependency).";
  }

  if (stage === 2) {
    return "Layer 2: material pass (chrome body + highlights).";
  }

  if (stage === 3) {
    return "Layer 3: integrated reflection (camera as surface information).";
  }

  return "Layer 4: polish/tuning.";
};

const resizeCanvasElement = (
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  dpr: number,
) => {
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
};

const drawVideoCover = (payload: {
  context: CanvasRenderingContext2D;
  video: HTMLVideoElement;
  width: number;
  height: number;
  mirrorX: boolean;
}) => {
  const { context, video, width, height, mirrorX } = payload;
  const source = computeCoverSourceRect(video.videoWidth, video.videoHeight, width, height);

  context.save();
  if (mirrorX) {
    context.translate(width, 0);
    context.scale(-1, 1);
  }
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

const drawDebugPanel = (payload: {
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  source: CanvasImageSource | null;
}) => {
  const { context, x, y, width, height, label, source } = payload;

  context.save();
  context.fillStyle = "rgba(0, 0, 0, 0.68)";
  context.fillRect(x, y, width, height);
  context.strokeStyle = "rgba(255, 255, 255, 0.24)";
  context.lineWidth = 1;
  context.strokeRect(x, y, width, height);
  context.fillStyle = "rgba(255, 255, 255, 0.82)";
  context.font = '10px "JetBrains Mono", ui-monospace, monospace';
  context.textBaseline = "top";
  context.fillText(label, x + 8, y + 7);

  if (source) {
    context.imageSmoothingEnabled = false;
    context.drawImage(source, x + 8, y + 24, width - 16, height - 32);
  }

  context.restore();
};

export const createMirrorController = (payload: CreateMirrorControllerPayload): MirrorController => {
  const qualityProfile = createCreativeQualityProfile();
  const dimensions = createCanvasDimensions(MIRROR_MIN_CANVAS_WIDTH, MIRROR_MIN_CANVAS_HEIGHT, 1);
  const frameClock = createFrameClock();
  const webcam = createWebcamProvider();
  const frameProcessor = createFrameProcessor({
    width: qualityProfile.processingWidth,
    height: qualityProfile.processingHeight,
  });

  const debug: MirrorDebugState = {
    enabled: payload.debug?.enabled ?? false,
    stage: payload.debug?.stage ?? 1,
  };

  let running = false;
  let animationFrameId = 0;
  let previousTimestampMs = 0;
  let lastProcessingTimestampMs = 0;
  let renderFps = 0;
  let notice: string | null = null;
  let motionEnergy = 0;
  let liquidRenderMs = 0;
  let latestProcessingSnapshot: FrameProcessingSnapshot | null = null;
  let liquidMetrics: MirrorLiquidMetrics | null = null;
  let lastUiSignature = "";
  let lastUiEmitMs = 0;
  let meltProgress = 0;
  let meltTarget = 0;
  let interactionImpacts: MirrorInteractionImpact[] = [];
  const interactionImpactsBuffer = new Float32Array(MIRROR_INTERACTION_MAX_IMPACTS * 4);
  const pointerTarget = {
    x: 0.5,
    y: 0.5,
    active: false,
  };
  const pointerState = {
    x: 0.5,
    y: 0.5,
    strength: 0,
  };

  let gl: WebGL2RenderingContext | null = null;
  let liquidRenderer: LiquidMetalRenderer | null = null;
  let debugContext: CanvasRenderingContext2D | null = null;
  const mirroredPreviewCanvas = document.createElement("canvas");
  mirroredPreviewCanvas.width = qualityProfile.processingWidth;
  mirroredPreviewCanvas.height = qualityProfile.processingHeight;
  const mirroredPreviewContext = mirroredPreviewCanvas.getContext("2d", {
    alpha: false,
  });

  const toProcessingMetrics = (
    snapshot: FrameProcessingSnapshot | null,
  ): MirrorProcessingMetrics | null => {
    if (!snapshot) {
      return null;
    }

    return {
      width: snapshot.width,
      height: snapshot.height,
      processingMs: snapshot.processingMs,
      luminanceMean: snapshot.luminanceMean,
      motionMean: snapshot.motionMean,
      motionPeak: snapshot.motionPeak,
    };
  };

  const emitState = (force = false) => {
    const nowMs = performance.now();
    if (!force && nowMs - lastUiEmitMs < 120) {
      return;
    }

    const nextState: MirrorUIState = {
      cameraStatus: webcam.status,
      notice,
      renderFps,
      debug,
      processing: toProcessingMetrics(latestProcessingSnapshot),
      liquid: liquidMetrics,
      particlePaused: true,
    };

    const signature = [
      nextState.cameraStatus,
      nextState.notice ?? "",
      nextState.debug.enabled ? "1" : "0",
      nextState.debug.stage,
      Math.round(nextState.renderFps),
      nextState.processing ? `${nextState.processing.width}x${nextState.processing.height}` : "none",
      nextState.processing ? Math.round(nextState.processing.processingMs * 10) : 0,
      nextState.processing ? Math.round(nextState.processing.motionMean * 1000) : 0,
      nextState.processing ? Math.round(nextState.processing.motionPeak * 1000) : 0,
      nextState.liquid ? Math.round(nextState.liquid.motionEnergy * 1000) : 0,
      nextState.liquid ? Math.round(nextState.liquid.renderMs * 10) : 0,
    ].join("|");

    if (!force && signature === lastUiSignature) {
      return;
    }

    lastUiSignature = signature;
    lastUiEmitMs = nowMs;
    payload.onStateChange?.(nextState);
  };

  const setNotice = (nextNotice: string | null) => {
    notice = nextNotice;
    emitState(true);
  };

  const resize = () => {
    const viewportWidth = Math.max(window.innerWidth, MIRROR_MIN_CANVAS_WIDTH);
    const viewportHeight = Math.max(window.innerHeight, MIRROR_MIN_CANVAS_HEIGHT);
    const dpr = clamp(window.devicePixelRatio || 1, 1, qualityProfile.maxDevicePixelRatio);

    dimensions.width = viewportWidth;
    dimensions.height = viewportHeight;
    dimensions.dpr = dpr;

    resizeCanvasElement(payload.canvas, viewportWidth, viewportHeight, dpr);
    gl?.viewport(0, 0, payload.canvas.width, payload.canvas.height);
    liquidRenderer?.resize();

    if (payload.debugCanvas && debugContext) {
      resizeCanvasElement(payload.debugCanvas, viewportWidth, viewportHeight, dpr);
      debugContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  };

  const clearDebugCanvas = () => {
    if (!payload.debugCanvas || !debugContext) {
      return;
    }

    debugContext.save();
    debugContext.setTransform(1, 0, 0, 1, 0, 0);
    debugContext.clearRect(0, 0, payload.debugCanvas.width, payload.debugCanvas.height);
    debugContext.restore();
  };

  const drawDebugLayer = () => {
    if (!debug.enabled || !debugContext || !payload.debugCanvas) {
      clearDebugCanvas();
      return;
    }

    clearDebugCanvas();
    const hasLiveVideo = webcam.status === "ready" && webcam.video.videoWidth > 0;

    const context = debugContext;
    const padding = 14;
    const panelW = MIRROR_DEBUG_PANEL_WIDTH;
    const panelH = MIRROR_DEBUG_PANEL_HEIGHT;
    const firstX = dimensions.width - panelW * 3 - padding * 2 - 20;
    const panelY = padding;

    if (debug.stage === 1) {
      const rightX = dimensions.width - panelW - padding;

      drawDebugPanel({
        context,
        x: rightX,
        y: padding,
        width: panelW,
        height: panelH,
        label: "object baseline",
        source: payload.canvas,
      });

      if (hasLiveVideo && mirroredPreviewContext) {
        mirroredPreviewContext.clearRect(0, 0, mirroredPreviewCanvas.width, mirroredPreviewCanvas.height);
        drawVideoCover({
          context: mirroredPreviewContext,
          video: webcam.video,
          width: mirroredPreviewCanvas.width,
          height: mirroredPreviewCanvas.height,
          mirrorX: true,
        });
      }

      drawDebugPanel({
        context,
        x: rightX,
        y: padding + panelH + 10,
        width: panelW,
        height: panelH,
        label: hasLiveVideo ? "camera (optional)" : "camera unavailable",
        source: hasLiveVideo ? mirroredPreviewCanvas : null,
      });
      return;
    }

    if (!hasLiveVideo) {
      return;
    }

    drawDebugPanel({
      context,
      x: firstX,
      y: panelY,
      width: panelW,
      height: panelH,
      label: "downsample source",
      source: latestProcessingSnapshot?.sourceCanvas ?? null,
    });

    drawDebugPanel({
      context,
      x: firstX + panelW + 10,
      y: panelY,
      width: panelW,
      height: panelH,
      label: debug.stage === 2 ? "luminance map" : "surface driver",
      source: latestProcessingSnapshot?.luminanceCanvas ?? null,
    });

    drawDebugPanel({
      context,
      x: firstX + (panelW + 10) * 2,
      y: panelY,
      width: panelW,
      height: panelH,
      label: debug.stage === 4 ? "material driver" : "motion driver",
      source: latestProcessingSnapshot?.motionCanvas ?? null,
    });
  };

  const updateProcessing = (timestampMs: number) => {
    if (webcam.status !== "ready" || webcam.video.videoWidth <= 0) {
      return;
    }

    const intervalMs = 1000 / qualityProfile.processingFps;
    if (timestampMs - lastProcessingTimestampMs < intervalMs) {
      return;
    }

    lastProcessingTimestampMs = timestampMs;
    const snapshot = frameProcessor.process(webcam.video, timestampMs, MIRROR_CAMERA_MIRROR_X);
    if (snapshot) {
      latestProcessingSnapshot = snapshot;
    }
  };

  const drawFrame = (timestampMs: number) => {
    if (!liquidRenderer) {
      return;
    }

    const hasLiveVideo = webcam.status === "ready" && webcam.video.videoWidth > 0;

    if (hasLiveVideo) {
      updateProcessing(timestampMs);
    } else {
      latestProcessingSnapshot = null;
    }

    const motionTarget = latestProcessingSnapshot
      ? clamp(latestProcessingSnapshot.motionMean * 1.65 + latestProcessingSnapshot.motionPeak * 0.35, 0, 1)
      : 0;
    motionEnergy = damp(motionEnergy, motionTarget, 7.2, frameClock.deltaSeconds);
    pointerState.x = damp(pointerState.x, pointerTarget.x, 24, frameClock.deltaSeconds);
    pointerState.y = damp(pointerState.y, pointerTarget.y, 24, frameClock.deltaSeconds);
    pointerState.strength = damp(
      pointerState.strength,
      pointerTarget.active ? 1 : 0,
      24,
      frameClock.deltaSeconds,
    );

    meltProgress = damp(meltProgress, meltTarget, 5.5, frameClock.deltaSeconds);

    interactionImpacts = interactionImpacts.filter((impact) => {
      return frameClock.elapsedSeconds - impact.startTimeSeconds <= MIRROR_INTERACTION_IMPACT_MAX_AGE_SECONDS;
    });
    interactionImpactsBuffer.fill(0);
    const interactionImpactCount = Math.min(
      interactionImpacts.length,
      MIRROR_INTERACTION_MAX_IMPACTS,
    );

    for (let index = 0; index < interactionImpactCount; index += 1) {
      const impact = interactionImpacts[index];
      const offset = index * 4;
      interactionImpactsBuffer[offset] = impact.x;
      interactionImpactsBuffer[offset + 1] = impact.y;
      interactionImpactsBuffer[offset + 2] = Math.max(
        0,
        frameClock.elapsedSeconds - impact.startTimeSeconds,
      );
      interactionImpactsBuffer[offset + 3] = impact.strength;
    }

    const activeStage: MirrorDebugStage = debug.enabled ? debug.stage : 4;

    liquidRenderMs = liquidRenderer.render({
      video: hasLiveVideo ? webcam.video : null,
      elapsedSeconds: frameClock.elapsedSeconds,
      stage: activeStage,
      motionMean: latestProcessingSnapshot?.motionMean ?? 0,
      motionPeak: latestProcessingSnapshot?.motionPeak ?? 0,
      motionEnergy,
      meltProgress,
      meltOffsetY: 0,
      mouseUvX: pointerState.x,
      mouseUvY: pointerState.y,
      mouseStrength: pointerState.strength,
      interactionImpacts: interactionImpactsBuffer,
      interactionImpactCount,
      luminanceCanvas: latestProcessingSnapshot?.luminanceCanvas ?? null,
      motionCanvas: latestProcessingSnapshot?.motionCanvas ?? null,
    });

    liquidMetrics = {
      shaderReady: true,
      motionEnergy,
      renderMs: liquidRenderMs,
    };

    drawDebugLayer();
  };

  const frame = (timestampMs: number) => {
    if (!running) {
      return;
    }

    const rawDeltaSeconds =
      previousTimestampMs > 0 ? (timestampMs - previousTimestampMs) / 1000 : 0;
    previousTimestampMs = timestampMs;

    advanceFrameClock(frameClock, rawDeltaSeconds, MIRROR_MAX_FRAME_DELTA_SECONDS);

    if (frameClock.deltaSeconds > 0) {
      const instantaneousFps = 1 / frameClock.deltaSeconds;
      renderFps = damp(renderFps, instantaneousFps, 8, frameClock.deltaSeconds);
    }

    drawFrame(timestampMs);
    emitState(false);
    animationFrameId = window.requestAnimationFrame(frame);
  };

  const start = async () => {
    if (running) {
      return;
    }

    gl = payload.canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      desynchronized: true,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      premultipliedAlpha: false,
    });

    if (!gl) {
      setNotice("WebGL2 is required for mirror liquid mode.");
      return;
    }

    try {
      liquidRenderer = createLiquidMetalRenderer({ gl });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to initialize liquid renderer.");
      return;
    }

    if (payload.debugCanvas) {
      debugContext = payload.debugCanvas.getContext("2d", {
        alpha: true,
        desynchronized: true,
      });
    }

    running = true;
    resize();
    window.addEventListener("resize", resize);

    await webcam.start();

    if (webcam.status === "error") {
      setNotice(webcam.errorMessage ?? "Camera access was denied.");
    } else {
      setNotice(debug.enabled ? stageNotice(debug.stage) : null);
    }

    previousTimestampMs = performance.now();
    animationFrameId = window.requestAnimationFrame(frame);
    emitState(true);
  };

  const stop = () => {
    if (!running) {
      return;
    }

    running = false;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener("resize", resize);
    webcam.stop();
    liquidRenderer?.dispose();
    liquidRenderer = null;
    gl = null;
    clearDebugCanvas();
  };

  const setDebugEnabled = (enabled: boolean) => {
    debug.enabled = enabled;
    if (!enabled) {
      clearDebugCanvas();
      setNotice(webcam.status === "error" ? webcam.errorMessage ?? "Camera access was denied." : null);
      return;
    }

    if (webcam.status === "error") {
      setNotice(webcam.errorMessage ?? "Camera access was denied.");
      return;
    }

    setNotice(stageNotice(debug.stage));
  };

  const toggleDebugEnabled = () => {
    setDebugEnabled(!debug.enabled);
  };

  const setDebugStage = (stage: MirrorDebugStage) => {
    debug.stage = stage;
    if (debug.enabled && webcam.status !== "error") {
      setNotice(stageNotice(stage));
    }

    emitState(true);
  };

  const setPointerUv = (x: number, y: number) => {
    pointerTarget.x = clamp(x, 0, 1);
    pointerTarget.y = clamp(y, 0, 1);
    pointerTarget.active = true;
  };

  const clearPointerUv = () => {
    pointerTarget.active = false;
  };

  const registerPointerImpact = (x: number, y: number) => {
    const clampedX = clamp(x, 0, 1);
    const clampedY = clamp(y, 0, 1);
    interactionImpacts.unshift({
      x: clampedX,
      y: clampedY,
      startTimeSeconds: frameClock.elapsedSeconds,
      strength: 1,
    });
    if (interactionImpacts.length > MIRROR_INTERACTION_MAX_IMPACTS) {
      interactionImpacts.length = MIRROR_INTERACTION_MAX_IMPACTS;
    }
    meltTarget = clamp(meltTarget + 0.14, 0, 1);

    pointerTarget.x = clampedX;
    pointerTarget.y = clampedY;
    pointerTarget.active = true;
  };

  liquidMetrics = {
    shaderReady: false,
    motionEnergy: 0,
    renderMs: 0,
  };
  emitState(true);

  return {
    start,
    stop,
    setDebugEnabled,
    toggleDebugEnabled,
    setDebugStage,
    setPointerUv,
    clearPointerUv,
    registerPointerImpact,
  };
};
