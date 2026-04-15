// @ts-nocheck
import { personMaskToTargets, type MirrorTargetPoint } from "@/lib/creative/adapters/personMaskToTargets";
import { createWebcamProvider } from "@/lib/creative/camera/webcam";
import {
  computeCoverSourceRect,
  createCanvasDimensions,
  resizeCanvasToViewport,
} from "@/lib/creative/core/canvas";
import { advanceFrameClock, createFrameClock } from "@/lib/creative/core/frameClock";
import { createCreativeQualityProfile } from "@/lib/creative/core/quality";
import { damp } from "@/lib/creative/math";
import { createMirrorParticles, advanceMirrorParticles } from "@/lib/creative/particles/engine";
import type { MirrorParticle, MirrorParticleSimulationConfig } from "@/lib/creative/particles/types";
import {
  createFrameProcessor,
  type FrameProcessingSnapshot,
} from "@/lib/creative/processing/frameProcessing";
import { createPersonSegmentationProvider } from "@/lib/creative/segmentation/personSegmentation";
import {
  createSegmentationRefiner,
  type RefinedSegmentationSnapshot,
} from "@/lib/creative/segmentation/refineMask";
import {
  MIRROR_CAMERA_MIRROR_X,
  MIRROR_DEBUG_PANEL_HEIGHT,
  MIRROR_DEBUG_PANEL_WIDTH,
  MIRROR_MAX_FRAME_DELTA_SECONDS,
  MIRROR_MIN_CANVAS_HEIGHT,
  MIRROR_MIN_CANVAS_WIDTH,
} from "@/lib/mirror/constants";
import { renderParticleBackground } from "@/lib/mirror/renderers/particleBackground";
import { renderPhase4Baseline } from "@/lib/mirror/renderers/phase4Baseline";
import type {
  MirrorController,
  MirrorDebugStage,
  MirrorDebugState,
  MirrorPhase4Metrics,
  MirrorProcessingMetrics,
  MirrorSegmentationMetrics,
  MirrorUIState,
} from "@/lib/mirror/types";

type CreateMirrorControllerPayload = {
  canvas: HTMLCanvasElement;
  debug?: Partial<MirrorDebugState>;
  onStateChange?: (state: MirrorUIState) => void;
};

type SegmentationDebugSnapshot = {
  refined: RefinedSegmentationSnapshot;
  inferenceMs: number;
};

type MaskLike = {
  width: number;
  height: number;
  data: ArrayLike<number>;
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

const drawMaskCover = (payload: {
  context: CanvasRenderingContext2D;
  maskCanvas: HTMLCanvasElement;
  video: HTMLVideoElement;
  targetWidth: number;
  targetHeight: number;
  mirrorX: boolean;
}) => {
  const { context, maskCanvas, video, targetWidth, targetHeight, mirrorX } = payload;
  const videoCover = computeCoverSourceRect(
    video.videoWidth,
    video.videoHeight,
    targetWidth,
    targetHeight,
  );

  const scaleX = maskCanvas.width / Math.max(1, video.videoWidth);
  const scaleY = maskCanvas.height / Math.max(1, video.videoHeight);

  const sx = videoCover.sx * scaleX;
  const sy = videoCover.sy * scaleY;
  const sWidth = videoCover.sWidth * scaleX;
  const sHeight = videoCover.sHeight * scaleY;

  context.save();

  if (mirrorX) {
    context.translate(targetWidth, 0);
    context.scale(-1, 1);
  }

  context.drawImage(maskCanvas, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
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

const stageNotice = (stage: MirrorDebugStage) => {
  if (stage === 1) {
    return "Phase 1: camera baseline (mirrored full-frame, low latency).";
  }

  if (stage === 2) {
    return "Phase 2: frame processing baseline (source/luminance/motion maps).";
  }

  if (stage === 3) {
    return "Phase 3: person silhouette baseline (confidence + temporal smoothing + cleanup).";
  }

  return "Phase 4: draw-on-top baseline (mask -> targets -> anchored particles).";
};

const computeAttachmentError = (particles: MirrorParticle[], targets: MirrorTargetPoint[]) => {
  if (targets.length === 0 || particles.length === 0) {
    return 0;
  }

  let samples = 0;
  let accumDistance = 0;

  for (let index = 0; index < particles.length; index += 1) {
    const particle = particles[index];
    const targetIndex =
      particle && particle.slotIndex >= 0 && particle.slotIndex < targets.length
        ? particle.slotIndex
        : targets.length <= 1 || particles.length <= 1
          ? 0
          : Math.floor((index * (targets.length - 1)) / Math.max(1, particles.length - 1));
    const target = targets[targetIndex];

    if (!particle || !target || !target.active || particle.life < 0.08) {
      continue;
    }

    accumDistance += Math.hypot(target.x - particle.position.x, target.y - particle.position.y);
    samples += 1;
  }

  return samples > 0 ? accumDistance / samples : 0;
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
  const segmentation = createPersonSegmentationProvider();
  const segmentationRefiner = createSegmentationRefiner({
    riseAlpha: 0.62,
    fallAlpha: 0.34,
    softThresholdOn: 0.56,
    softThresholdOff: 0.4,
  });

  const mirrorPreviewCanvas = document.createElement("canvas");
  mirrorPreviewCanvas.width = qualityProfile.processingWidth;
  mirrorPreviewCanvas.height = qualityProfile.processingHeight;
  const mirrorPreviewContext = mirrorPreviewCanvas.getContext("2d", {
    alpha: false,
  });

  const phase4PreviewCanvas = document.createElement("canvas");
  phase4PreviewCanvas.width = qualityProfile.processingWidth;
  phase4PreviewCanvas.height = qualityProfile.processingHeight;
  const phase4PreviewContext = phase4PreviewCanvas.getContext("2d", {
    alpha: false,
  });

  const phase4ParticleConfig: MirrorParticleSimulationConfig = {
    targetFollowStrength: 21.5,
    returnStrength: 8.4,
    targetVelocityMatch: 4.6,
    snapbackDistance: 22,
    snapbackStrength: 0.44,
    friction: 4.7,
    maxSpeed: 1700,
    inactiveVelocityDamping: 10.5,
    lifeInSpeed: 8.8,
    lifeOutSpeed: 2.7,
  };

  const debug: MirrorDebugState = {
    enabled: payload.debug?.enabled ?? false,
    stage: payload.debug?.stage ?? 1,
  };

  let running = false;
  let animationFrameId = 0;
  let previousTimestampMs = 0;
  let lastProcessingTimestampMs = 0;
  let lastSegmentationTimestampMs = 0;
  let renderFps = 0;
  let context: CanvasRenderingContext2D | null = null;
  let notice: string | null = null;
  let latestProcessingSnapshot: FrameProcessingSnapshot | null = null;
  let latestSegmentationSnapshot: SegmentationDebugSnapshot | null = null;
  let previousTargetMask: MaskLike | null = null;
  let phase4Targets: MirrorTargetPoint[] = [];
  let phase4Particles: MirrorParticle[] = [];
  let phase4TargetBuildMs = 0;
  let phase4Metrics: MirrorPhase4Metrics | null = null;
  let lastUiSignature = "";
  let lastUiEmitMs = 0;

  const resetPhase4Particles = () => {
    phase4Particles = createMirrorParticles(
      qualityProfile.particleCount,
      Math.max(1, dimensions.width),
      Math.max(1, dimensions.height),
    );
  };

  const drawPhase4Preview = () => {
    if (!phase4PreviewContext) {
      return;
    }

    const previewWidth = phase4PreviewCanvas.width;
    const previewHeight = phase4PreviewCanvas.height;

    phase4PreviewContext.fillStyle = "#05070a";
    phase4PreviewContext.fillRect(0, 0, previewWidth, previewHeight);

    for (const target of phase4Targets) {
      if (!target.active) {
        continue;
      }

      const x = (target.x / Math.max(1, dimensions.width)) * previewWidth;
      const y = (target.y / Math.max(1, dimensions.height)) * previewHeight;

      phase4PreviewContext.fillStyle = `rgba(134, 168, 238, ${0.18 + target.weight * 0.45})`;
      phase4PreviewContext.beginPath();
      phase4PreviewContext.arc(x, y, 1, 0, Math.PI * 2);
      phase4PreviewContext.fill();
    }

    for (const particle of phase4Particles) {
      if (particle.life < 0.08) {
        continue;
      }

      const x = (particle.position.x / Math.max(1, dimensions.width)) * previewWidth;
      const y = (particle.position.y / Math.max(1, dimensions.height)) * previewHeight;

      phase4PreviewContext.fillStyle = `rgba(212, 226, 255, ${0.1 + particle.life * 0.7})`;
      phase4PreviewContext.beginPath();
      phase4PreviewContext.arc(x, y, 1, 0, Math.PI * 2);
      phase4PreviewContext.fill();
    }
  };

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

  const toSegmentationMetrics = (
    snapshot: SegmentationDebugSnapshot | null,
  ): MirrorSegmentationMetrics | null => {
    if (!snapshot) {
      return null;
    }

    return {
      width: snapshot.refined.width,
      height: snapshot.refined.height,
      inferenceMs: snapshot.inferenceMs,
      postProcessMs: snapshot.refined.metrics.postProcessMs,
      foregroundRatio: snapshot.refined.metrics.foregroundRatio,
      noiseRatio: snapshot.refined.metrics.noiseRatio,
      stabilityDelta: snapshot.refined.metrics.stabilityDelta,
    };
  };

  const emitState = (force = false) => {
    const nowMs = performance.now();

    if (!force && nowMs - lastUiEmitMs < 120) {
      return;
    }

    const nextState: MirrorUIState = {
      cameraStatus: webcam.status,
      segmentationStatus: segmentation.status,
      notice,
      renderFps,
      debug,
      processing: toProcessingMetrics(latestProcessingSnapshot),
      segmentation: toSegmentationMetrics(latestSegmentationSnapshot),
      phase4: phase4Metrics,
    };

    const signature = [
      nextState.cameraStatus,
      nextState.segmentationStatus,
      nextState.notice ?? "",
      nextState.debug.enabled ? "1" : "0",
      nextState.debug.stage,
      Math.round(nextState.renderFps),
      nextState.processing ? `${nextState.processing.width}x${nextState.processing.height}` : "none",
      nextState.processing ? Math.round(nextState.processing.processingMs * 10) : 0,
      nextState.processing ? Math.round(nextState.processing.motionMean * 1000) : 0,
      nextState.processing ? Math.round(nextState.processing.motionPeak * 1000) : 0,
      nextState.segmentation ? `${nextState.segmentation.width}x${nextState.segmentation.height}` : "none",
      nextState.segmentation ? Math.round(nextState.segmentation.inferenceMs * 10) : 0,
      nextState.segmentation ? Math.round(nextState.segmentation.postProcessMs * 10) : 0,
      nextState.segmentation ? Math.round(nextState.segmentation.foregroundRatio * 1000) : 0,
      nextState.segmentation ? Math.round(nextState.segmentation.noiseRatio * 1000) : 0,
      nextState.segmentation ? Math.round(nextState.segmentation.stabilityDelta * 1000) : 0,
      nextState.phase4 ? nextState.phase4.targetCount : 0,
      nextState.phase4 ? nextState.phase4.activeParticles : 0,
      nextState.phase4 ? Math.round(nextState.phase4.meanAttachmentError) : 0,
      nextState.phase4 ? Math.round(nextState.phase4.targetBuildMs * 10) : 0,
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
    if (!context) {
      return;
    }

    resizeCanvasToViewport({
      canvas: payload.canvas,
      context,
      dimensions,
      maxDevicePixelRatio: qualityProfile.maxDevicePixelRatio,
      minWidth: MIRROR_MIN_CANVAS_WIDTH,
      minHeight: MIRROR_MIN_CANVAS_HEIGHT,
    });

    resetPhase4Particles();
  };

  const drawNoCameraFrame = () => {
    if (!context) {
      return;
    }

    context.fillStyle = "#000";
    context.fillRect(0, 0, dimensions.width, dimensions.height);

    context.fillStyle = "rgba(255, 255, 255, 0.72)";
    context.font = '12px "JetBrains Mono", ui-monospace, monospace';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      "camera unavailable",
      dimensions.width * 0.5,
      dimensions.height * 0.5,
    );
  };

  const ensureSegmentationReady = () => {
    if (segmentation.status === "ready" || segmentation.status === "loading") {
      return;
    }

    void segmentation.initialize().then(() => {
      if (segmentation.status === "ready") {
        if (debug.enabled && (debug.stage === 3 || debug.stage === 4)) {
          setNotice(stageNotice(debug.stage));
        }
      } else if (segmentation.status === "error") {
        setNotice(segmentation.errorMessage ?? "Segmentation failed to initialize.");
      }

      emitState(true);
    });
  };

  const rebuildPhase4Targets = (refined: RefinedSegmentationSnapshot) => {
    if (webcam.status !== "ready") {
      return;
    }

    const targetBuildStart = performance.now();
    const nextMask: MaskLike = {
      width: refined.width,
      height: refined.height,
      data: refined.smoothData,
    };

    phase4Targets = personMaskToTargets({
      mask: nextMask,
      activeMask: {
        width: refined.width,
        height: refined.height,
        data: refined.binaryMask,
      },
      previousMask: previousTargetMask,
      outputWidth: dimensions.width,
      outputHeight: dimensions.height,
      sourceWidth: webcam.video.videoWidth,
      sourceHeight: webcam.video.videoHeight,
      mirrorX: MIRROR_CAMERA_MIRROR_X,
      sampleStep: Math.max(1, qualityProfile.segmentationSampleStep),
      threshold: 0.5,
      maxPoints: qualityProfile.maxParticleTargets,
      jitter: 0,
      motionInfluence: 0.16,
    });

    phase4TargetBuildMs = performance.now() - targetBuildStart;

    previousTargetMask = {
      width: refined.width,
      height: refined.height,
      data: new Float32Array(refined.smoothData),
    };
  };

  const updateSegmentation = (timestampMs: number) => {
    if (segmentation.status !== "ready" || webcam.status !== "ready") {
      return;
    }

    const intervalMs = 1000 / qualityProfile.segmentationFps;
    if (timestampMs - lastSegmentationTimestampMs < intervalMs) {
      return;
    }

    lastSegmentationTimestampMs = timestampMs;
    const inferenceStart = performance.now();
    const mask = segmentation.segmentVideoFrame(webcam.video, timestampMs);
    const inferenceMs = performance.now() - inferenceStart;

    if (!mask) {
      return;
    }

    const refined = segmentationRefiner.refine(mask);
    latestSegmentationSnapshot = {
      refined,
      inferenceMs,
    };

    if (debug.stage === 4) {
      rebuildPhase4Targets(refined);
    }
  };

  const updatePhase4 = () => {
    if (phase4Particles.length === 0) {
      resetPhase4Particles();
    }

    advanceMirrorParticles({
      particles: phase4Particles,
      targets: phase4Targets,
      boundsWidth: dimensions.width,
      boundsHeight: dimensions.height,
      elapsedSeconds: frameClock.elapsedSeconds,
      deltaSeconds: frameClock.deltaSeconds,
      config: phase4ParticleConfig,
    });

    const activeTargetCount = phase4Targets.reduce(
      (count, target) => count + (target.active ? 1 : 0),
      0,
    );

    const activeParticles = phase4Particles.reduce(
      (count, particle) => count + (particle.life > 0.08 ? 1 : 0),
      0,
    );

    phase4Metrics = {
      targetCount: activeTargetCount,
      activeParticles,
      meanAttachmentError: computeAttachmentError(phase4Particles, phase4Targets),
      subjectPresent: activeTargetCount > Math.max(24, qualityProfile.maxParticleTargets * 0.02),
      targetBuildMs: phase4TargetBuildMs,
    };

    drawPhase4Preview();
  };

  const drawDebugLayer = () => {
    if (!context || !debug.enabled || webcam.status !== "ready") {
      return;
    }

    const padding = 14;
    const panelW = MIRROR_DEBUG_PANEL_WIDTH;
    const panelH = MIRROR_DEBUG_PANEL_HEIGHT;

    if (debug.stage === 1) {
      if (mirrorPreviewContext) {
        mirrorPreviewContext.clearRect(0, 0, mirrorPreviewCanvas.width, mirrorPreviewCanvas.height);
        drawVideoCover({
          context: mirrorPreviewContext,
          video: webcam.video,
          width: mirrorPreviewCanvas.width,
          height: mirrorPreviewCanvas.height,
          mirrorX: true,
        });
      }

      const rightX = dimensions.width - panelW - padding;
      drawDebugPanel({
        context,
        x: rightX,
        y: padding,
        width: panelW,
        height: panelH,
        label: "raw feed",
        source: webcam.video,
      });

      drawDebugPanel({
        context,
        x: rightX,
        y: padding + panelH + 10,
        width: panelW,
        height: panelH,
        label: "mirrored feed",
        source: mirrorPreviewContext ? mirrorPreviewCanvas : webcam.video,
      });
      return;
    }

    if (debug.stage === 2) {
      const snapshot = latestProcessingSnapshot;
      const panelY = padding;
      const firstX = dimensions.width - panelW * 3 - padding * 2 - 20;

      drawDebugPanel({
        context,
        x: firstX,
        y: panelY,
        width: panelW,
        height: panelH,
        label: "downsample source",
        source: snapshot?.sourceCanvas ?? null,
      });

      drawDebugPanel({
        context,
        x: firstX + panelW + 10,
        y: panelY,
        width: panelW,
        height: panelH,
        label: "luminance",
        source: snapshot?.luminanceCanvas ?? null,
      });

      drawDebugPanel({
        context,
        x: firstX + (panelW + 10) * 2,
        y: panelY,
        width: panelW,
        height: panelH,
        label: "motion map",
        source: snapshot?.motionCanvas ?? null,
      });

      return;
    }

    const segmentationSnapshot = latestSegmentationSnapshot?.refined;
    const panelY = padding;
    const firstX = dimensions.width - panelW * 3 - padding * 2 - 20;

    if (debug.stage === 3) {
      drawDebugPanel({
        context,
        x: firstX,
        y: panelY,
        width: panelW,
        height: panelH,
        label: "raw confidence",
        source: segmentationSnapshot?.rawCanvas ?? null,
      });

      drawDebugPanel({
        context,
        x: firstX + panelW + 10,
        y: panelY,
        width: panelW,
        height: panelH,
        label: "smoothed",
        source: segmentationSnapshot?.smoothCanvas ?? null,
      });

      drawDebugPanel({
        context,
        x: firstX + (panelW + 10) * 2,
        y: panelY,
        width: panelW,
        height: panelH,
        label: "binary silhouette",
        source: segmentationSnapshot?.binaryCanvas ?? null,
      });

      return;
    }

    drawDebugPanel({
      context,
      x: firstX,
      y: panelY,
      width: panelW,
      height: panelH,
      label: "raw confidence",
      source: segmentationSnapshot?.rawCanvas ?? null,
    });

    drawDebugPanel({
      context,
      x: firstX + panelW + 10,
      y: panelY,
      width: panelW,
      height: panelH,
      label: "binary silhouette",
      source: segmentationSnapshot?.binaryCanvas ?? null,
    });

    drawDebugPanel({
      context,
      x: firstX + (panelW + 10) * 2,
      y: panelY,
      width: panelW,
      height: panelH,
      label: "targets + particles",
      source: phase4PreviewCanvas,
    });
  };

  const drawSegmentationOverlay = () => {
    if (!context || !latestSegmentationSnapshot || webcam.status !== "ready") {
      return;
    }

    context.save();
    context.globalAlpha = 0.44;
    context.globalCompositeOperation = "screen";
    drawMaskCover({
      context,
      maskCanvas: latestSegmentationSnapshot.refined.binaryCanvas,
      video: webcam.video,
      targetWidth: dimensions.width,
      targetHeight: dimensions.height,
      mirrorX: MIRROR_CAMERA_MIRROR_X,
    });
    context.restore();
  };

  const drawPhase4Overlay = () => {
    if (!context) {
      return;
    }

    const activeTargetCount = phase4Targets.reduce(
      (count, target) => count + (target.active ? 1 : 0),
      0,
    );
    const subjectPresence = Math.min(
      1,
      activeTargetCount / Math.max(1, qualityProfile.maxParticleTargets * 0.36),
    );
    renderParticleBackground({
      context,
      dimensions,
      elapsedSeconds: frameClock.elapsedSeconds,
      subjectPresence,
    });

    renderPhase4Baseline({
      context,
      dimensions,
      particles: phase4Particles,
      elapsedSeconds: frameClock.elapsedSeconds,
    });
  };

  const drawFrame = (timestampMs: number) => {
    if (!context) {
      return;
    }

    if (webcam.status !== "ready" || webcam.video.videoWidth <= 0) {
      drawNoCameraFrame();
      return;
    }

    const isPhase4View = debug.enabled && debug.stage === 4;
    if (!isPhase4View) {
      drawVideoCover({
        context,
        video: webcam.video,
        width: dimensions.width,
        height: dimensions.height,
        mirrorX: MIRROR_CAMERA_MIRROR_X,
      });
    }

    const shouldRunProcessing = debug.enabled && debug.stage === 2;
    if (shouldRunProcessing) {
      const intervalMs = 1000 / qualityProfile.processingFps;
      if (timestampMs - lastProcessingTimestampMs >= intervalMs) {
        const snapshot = frameProcessor.process(webcam.video, timestampMs, MIRROR_CAMERA_MIRROR_X);
        if (snapshot) {
          latestProcessingSnapshot = snapshot;
        }

        lastProcessingTimestampMs = timestampMs;
      }
    }

    const shouldRunSegmentation = debug.enabled && (debug.stage === 3 || debug.stage === 4);
    if (shouldRunSegmentation) {
      ensureSegmentationReady();
      updateSegmentation(timestampMs);
    }

    if (debug.enabled && debug.stage === 3) {
      drawSegmentationOverlay();
    }

    if (debug.enabled && debug.stage === 4) {
      updatePhase4();
      drawPhase4Overlay();
    }

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

    context = payload.canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });

    if (!context) {
      setNotice("Canvas 2D is unavailable in this browser.");
      return;
    }

    running = true;
    resize();
    window.addEventListener("resize", resize);

    await webcam.start();

    if (webcam.status === "error") {
      setNotice(webcam.errorMessage ?? "Camera access was denied.");
    } else {
      if (debug.enabled && (debug.stage === 3 || debug.stage === 4)) {
        ensureSegmentationReady();
      }
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
    segmentation.dispose();
  };

  const setDebugEnabled = (enabled: boolean) => {
    debug.enabled = enabled;

    if (!enabled) {
      latestProcessingSnapshot = null;
      latestSegmentationSnapshot = null;
      phase4Targets = [];
      phase4Metrics = null;
      previousTargetMask = null;
      setNotice(webcam.status === "error" ? webcam.errorMessage ?? "Camera access was denied." : null);
      return;
    }

    if (webcam.status === "error") {
      setNotice(webcam.errorMessage ?? "Camera access was denied.");
      return;
    }

    if (debug.stage === 3 || debug.stage === 4) {
      ensureSegmentationReady();
    }

    setNotice(stageNotice(debug.stage));
  };

  const toggleDebugEnabled = () => {
    setDebugEnabled(!debug.enabled);
  };

  const setDebugStage = (stage: MirrorDebugStage) => {
    debug.stage = stage;

    if (stage === 1) {
      latestProcessingSnapshot = null;
      latestSegmentationSnapshot = null;
      phase4Targets = [];
      phase4Metrics = null;
      previousTargetMask = null;
    }

    if (stage === 2) {
      latestSegmentationSnapshot = null;
      phase4Targets = [];
      phase4Metrics = null;
      previousTargetMask = null;
    }

    if (stage === 3) {
      phase4Targets = [];
      phase4Metrics = null;
      previousTargetMask = null;
      ensureSegmentationReady();
    }

    if (stage === 4) {
      ensureSegmentationReady();
    }

    if (debug.enabled && webcam.status !== "error") {
      setNotice(stageNotice(stage));
    }

    emitState(true);
  };

  resetPhase4Particles();
  emitState(true);

  return {
    start,
    stop,
    setDebugEnabled,
    toggleDebugEnabled,
    setDebugStage,
  };
};
