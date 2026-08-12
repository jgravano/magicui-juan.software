import { createWebcamProvider } from "@/lib/creative/camera/webcam";
import { computeCoverSourceRect } from "@/lib/creative/core/canvas";
import { createCreativeQualityProfile } from "@/lib/creative/core/quality";
import { clamp } from "@/lib/creative/math";
import { createPersonSegmentationProvider } from "@/lib/creative/segmentation/personSegmentation";
import { createSegmentationRefiner } from "@/lib/creative/segmentation/refineMask";
import { createBackgroundMemory } from "@/lib/melt/backgroundMemory";
import {
  MELT_DURATION_SECONDS,
  MELT_MIN_CANVAS_HEIGHT,
  MELT_MIN_CANVAS_WIDTH,
  MELT_READY_COVERAGE,
  MELT_SEGMENTATION_FPS,
  MELT_WORKING_WIDTH,
} from "@/lib/melt/constants";
import type { MeltController, MeltPhase, MeltUIState } from "@/lib/melt/types";

type CreateMeltControllerPayload = {
  canvas: HTMLCanvasElement;
  debugCanvas?: HTMLCanvasElement;
  onStateChange?: (state: MeltUIState) => void;
};

const createCanvas = (alpha = true) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha, willReadFrequently: true });
  if (!context) {
    throw new Error("Canvas 2D is unavailable.");
  }
  return { canvas, context };
};

const drawCover = (payload: {
  context: CanvasRenderingContext2D;
  source: CanvasImageSource;
  sourceWidth: number;
  sourceHeight: number;
  width: number;
  height: number;
  mirrorX?: boolean;
}) => {
  const { context, source, sourceWidth, sourceHeight, width, height, mirrorX = false } = payload;
  const crop = computeCoverSourceRect(sourceWidth, sourceHeight, width, height);

  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, width, height);
  if (mirrorX) {
    context.translate(width, 0);
    context.scale(-1, 1);
  }
  context.drawImage(source, crop.sx, crop.sy, crop.sWidth, crop.sHeight, 0, 0, width, height);
  context.restore();
};

const easeInCubic = (value: number) => value * value * value;

const hash = (value: number) => {
  const raw = Math.sin(value * 91.713 + 17.17) * 43758.5453;
  return raw - Math.floor(raw);
};

export const createMeltController = (payload: CreateMeltControllerPayload): MeltController => {
  const outputContext = payload.canvas.getContext("2d", { alpha: false });
  if (!outputContext) {
    throw new Error("Canvas 2D is unavailable.");
  }

  const debugContext = payload.debugCanvas?.getContext("2d", { alpha: true }) ?? null;
  const quality = createCreativeQualityProfile();
  const webcam = createWebcamProvider({ idealWidth: 1280, idealHeight: 720 });
  const segmentation = createPersonSegmentationProvider();
  const refiner = createSegmentationRefiner({
    riseAlpha: 0.52,
    fallAlpha: 0.26,
    softThresholdOn: 0.52,
    softThresholdOff: 0.34,
  });
  const backgroundMemory = createBackgroundMemory();

  const liveFrame = createCanvas(false);
  const personMask = createCanvas(true);
  const capturedPerson = createCanvas(true);
  const backgroundPlate = createCanvas(false);

  let phase: MeltPhase = "booting";
  let running = false;
  let animationFrameId = 0;
  let lastFrameMs = 0;
  let lastSegmentationMs = 0;
  let meltStartedMs = 0;
  let renderFps = 0;
  let coverage = 0;
  let foregroundRatio = 0;
  let debugEnabled = false;
  let notice: string | null = null;
  let latestMaskReady = false;
  let backgroundReady = false;
  let lastUiEmitMs = 0;
  let lastUiSignature = "";
  let viewportWidth = 1;
  let viewportHeight = 1;
  let dpr = 1;
  let workingWidth = 1;
  let workingHeight = 1;

  const emitState = (force = false) => {
    const now = performance.now();
    if (!force && now - lastUiEmitMs < 120) {
      return;
    }

    const next: MeltUIState = {
      phase,
      cameraStatus: webcam.status,
      segmentationStatus: segmentation.status,
      coverage,
      renderFps,
      foregroundRatio,
      debugEnabled,
      notice,
    };
    const signature = [
      phase,
      webcam.status,
      segmentation.status,
      Math.round(coverage * 1000),
      Math.round(renderFps),
      Math.round(foregroundRatio * 1000),
      debugEnabled ? 1 : 0,
      notice ?? "",
    ].join("|");

    if (!force && signature === lastUiSignature) {
      return;
    }
    lastUiEmitMs = now;
    lastUiSignature = signature;
    payload.onStateChange?.(next);
  };

  const resize = () => {
    const nextViewportWidth = Math.max(window.innerWidth, MELT_MIN_CANVAS_WIDTH);
    const nextViewportHeight = Math.max(window.innerHeight, MELT_MIN_CANVAS_HEIGHT);
    const nextDpr = clamp(window.devicePixelRatio || 1, 1, quality.maxDevicePixelRatio);
    const baseWorkingWidth = MELT_WORKING_WIDTH[quality.tier];
    const nextWorkingWidth = Math.min(baseWorkingWidth, nextViewportWidth);
    const nextWorkingHeight = Math.max(
      1,
      Math.round(nextWorkingWidth * (nextViewportHeight / nextViewportWidth)),
    );
    const workChanged = nextWorkingWidth !== workingWidth || nextWorkingHeight !== workingHeight;

    viewportWidth = nextViewportWidth;
    viewportHeight = nextViewportHeight;
    dpr = nextDpr;
    workingWidth = nextWorkingWidth;
    workingHeight = nextWorkingHeight;

    payload.canvas.width = Math.round(viewportWidth * dpr);
    payload.canvas.height = Math.round(viewportHeight * dpr);
    payload.canvas.style.width = `${viewportWidth}px`;
    payload.canvas.style.height = `${viewportHeight}px`;
    outputContext.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (payload.debugCanvas && debugContext) {
      payload.debugCanvas.width = Math.round(viewportWidth * dpr);
      payload.debugCanvas.height = Math.round(viewportHeight * dpr);
      payload.debugCanvas.style.width = `${viewportWidth}px`;
      payload.debugCanvas.style.height = `${viewportHeight}px`;
      debugContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    if (workChanged) {
      for (const bundle of [liveFrame, personMask, capturedPerson, backgroundPlate]) {
        bundle.canvas.width = workingWidth;
        bundle.canvas.height = workingHeight;
      }
      backgroundMemory.resize(workingWidth, workingHeight);
      coverage = 0;
      backgroundReady = false;
      latestMaskReady = false;
      if (phase !== "booting" && phase !== "error") {
        phase = "learning";
      }
    }
  };

  const updateLiveFrame = () => {
    if (webcam.status !== "ready" || webcam.video.videoWidth <= 0) {
      return;
    }
    drawCover({
      context: liveFrame.context,
      source: webcam.video,
      sourceWidth: webcam.video.videoWidth,
      sourceHeight: webcam.video.videoHeight,
      width: workingWidth,
      height: workingHeight,
      mirrorX: true,
    });
  };

  const updateMask = (timestampMs: number) => {
    if (
      segmentation.status !== "ready" ||
      webcam.status !== "ready" ||
      timestampMs - lastSegmentationMs < 1000 / MELT_SEGMENTATION_FPS
    ) {
      return;
    }

    lastSegmentationMs = timestampMs;
    const rawMask = segmentation.segmentVideoFrame(webcam.video, timestampMs);
    if (!rawMask) {
      return;
    }

    const refined = refiner.refine(rawMask);
    foregroundRatio = refined.metrics.foregroundRatio;
    drawCover({
      context: personMask.context,
      source: refined.smoothCanvas,
      sourceWidth: refined.width,
      sourceHeight: refined.height,
      width: workingWidth,
      height: workingHeight,
      mirrorX: true,
    });

    const maskImage = personMask.context.getImageData(0, 0, workingWidth, workingHeight);
    for (let index = 0; index < maskImage.data.length; index += 4) {
      const confidence = maskImage.data[index];
      maskImage.data[index] = 255;
      maskImage.data[index + 1] = 255;
      maskImage.data[index + 2] = 255;
      maskImage.data[index + 3] = confidence;
    }
    personMask.context.putImageData(maskImage, 0, 0);
    latestMaskReady = true;

    if (phase === "learning") {
      const frameImage = liveFrame.context.getImageData(0, 0, workingWidth, workingHeight);
      coverage = backgroundMemory.update(frameImage, maskImage);

      if (coverage >= MELT_READY_COVERAGE) {
        backgroundPlate.context.putImageData(backgroundMemory.snapshot(), 0, 0);
        backgroundReady = true;
        phase = "ready";
        notice = null;
        emitState(true);
      }
    }
  };

  const capturePerson = () => {
    if (!latestMaskReady || !backgroundReady || foregroundRatio < 0.025) {
      notice = foregroundRatio < 0.025 ? "Step into frame before melting." : "Keep moving so I can learn the room.";
      emitState(true);
      return false;
    }

    capturedPerson.context.save();
    capturedPerson.context.globalCompositeOperation = "source-over";
    capturedPerson.context.clearRect(0, 0, workingWidth, workingHeight);
    capturedPerson.context.drawImage(liveFrame.canvas, 0, 0);
    capturedPerson.context.globalCompositeOperation = "destination-in";
    capturedPerson.context.drawImage(personMask.canvas, 0, 0);
    capturedPerson.context.restore();
    return true;
  };

  const drawFullFrame = (source: CanvasImageSource) => {
    outputContext.save();
    outputContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    outputContext.imageSmoothingEnabled = true;
    outputContext.drawImage(source, 0, 0, viewportWidth, viewportHeight);
    outputContext.restore();
  };

  const drawMeltedPerson = (progress: number) => {
    const stripWidth = quality.tier === "low" ? 5 : 4;
    const easedGlobal = clamp(progress, 0, 1);
    outputContext.save();
    outputContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    outputContext.imageSmoothingEnabled = true;

    for (let sourceX = 0; sourceX < workingWidth; sourceX += stripWidth) {
      const seed = hash(sourceX / stripWidth);
      const delay = seed * 0.2;
      const local = clamp((easedGlobal - delay) / Math.max(0.001, 1 - delay), 0, 1);
      const fall = easeInCubic(local) * (workingHeight + 72 + seed * 90);
      const stretch = 1 + Math.sin(local * Math.PI) * (0.55 + seed * 1.25);
      const wobble = Math.sin(local * 8 + seed * Math.PI * 2) * local * (1.5 + seed * 3);
      const fade = 1 - clamp((local - 0.82) / 0.18, 0, 1);
      const destinationX = ((sourceX + wobble) / workingWidth) * viewportWidth;
      const destinationY = (fall / workingHeight) * viewportHeight;
      const destinationWidth = (stripWidth / workingWidth) * viewportWidth + 0.75;
      const destinationHeight = viewportHeight * stretch;

      outputContext.globalAlpha = fade;
      outputContext.drawImage(
        capturedPerson.canvas,
        sourceX,
        0,
        Math.min(stripWidth, workingWidth - sourceX),
        workingHeight,
        destinationX,
        destinationY,
        destinationWidth,
        destinationHeight,
      );
    }

    outputContext.restore();
  };

  const drawDebug = () => {
    if (!debugContext || !payload.debugCanvas) {
      return;
    }
    debugContext.clearRect(0, 0, viewportWidth, viewportHeight);
    if (!debugEnabled) {
      return;
    }

    const panelWidth = Math.min(240, viewportWidth * 0.28);
    const panelHeight = panelWidth * (workingHeight / workingWidth);
    const padding = 14;
    const sources = [liveFrame.canvas, personMask.canvas, backgroundPlate.canvas];
    const labels = ["live", "person mask", "background memory"];

    sources.forEach((source, index) => {
      const x = viewportWidth - panelWidth - padding;
      const y = padding + index * (panelHeight + 26);
      debugContext.fillStyle = "rgba(0,0,0,.72)";
      debugContext.fillRect(x - 6, y - 18, panelWidth + 12, panelHeight + 24);
      debugContext.fillStyle = "rgba(255,255,255,.78)";
      debugContext.font = '9px "JetBrains Mono", monospace';
      debugContext.fillText(labels[index], x, y - 7);
      debugContext.drawImage(source, x, y, panelWidth, panelHeight);
    });
  };

  const render = (timestampMs: number) => {
    outputContext.save();
    outputContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    outputContext.fillStyle = "#050505";
    outputContext.fillRect(0, 0, viewportWidth, viewportHeight);
    outputContext.restore();

    if (phase === "melting" || phase === "gone") {
      drawFullFrame(backgroundPlate.canvas);
      if (phase === "melting") {
        const progress = clamp((timestampMs - meltStartedMs) / (MELT_DURATION_SECONDS * 1000), 0, 1);
        drawMeltedPerson(progress);
        if (progress >= 1) {
          phase = "gone";
          emitState(true);
        }
      }
    } else if (webcam.status === "ready") {
      drawFullFrame(liveFrame.canvas);
    }

    drawDebug();
  };

  const frame = (timestampMs: number) => {
    if (!running) {
      return;
    }
    const delta = lastFrameMs > 0 ? Math.min(100, timestampMs - lastFrameMs) : 16.7;
    lastFrameMs = timestampMs;
    renderFps += (1000 / Math.max(1, delta) - renderFps) * 0.08;

    if (phase !== "melting" && phase !== "gone") {
      updateLiveFrame();
      updateMask(timestampMs);
    }
    render(timestampMs);
    emitState();
    animationFrameId = window.requestAnimationFrame(frame);
  };

  const relearnBackground = () => {
    backgroundMemory.reset();
    backgroundPlate.context.clearRect(0, 0, workingWidth, workingHeight);
    capturedPerson.context.clearRect(0, 0, workingWidth, workingHeight);
    coverage = 0;
    backgroundReady = false;
    phase = webcam.status === "ready" ? "learning" : "booting";
    notice = null;
    emitState(true);
  };

  const controller: MeltController = {
    start: async () => {
      if (running) {
        return;
      }
      running = true;
      resize();
      window.addEventListener("resize", resize);
      emitState(true);

      await Promise.all([webcam.start(), segmentation.initialize()]);
      if (webcam.status === "ready" && segmentation.status === "ready") {
        phase = "learning";
      } else {
        phase = "error";
        notice = webcam.errorMessage ?? segmentation.errorMessage ?? "Unable to start the experience.";
      }
      emitState(true);
      animationFrameId = window.requestAnimationFrame(frame);
    },
    stop: () => {
      running = false;
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      webcam.stop();
      segmentation.dispose();
    },
    trigger: () => {
      if (phase === "ready" && capturePerson()) {
        phase = "melting";
        meltStartedMs = performance.now();
        notice = null;
        emitState(true);
      } else if (phase === "gone") {
        phase = "ready";
        notice = null;
        emitState(true);
      }
    },
    resetEffect: () => {
      if (backgroundReady) {
        phase = "ready";
        notice = null;
        emitState(true);
      }
    },
    relearnBackground,
    toggleDebug: () => {
      debugEnabled = !debugEnabled;
      emitState(true);
    },
  };

  return controller;
};
