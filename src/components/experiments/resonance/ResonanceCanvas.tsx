"use client";

import { useEffect, useRef } from "react";

import {
  MAX_DEVICE_PIXEL_RATIO,
  MIN_CANVAS_HEIGHT,
  MIN_CANVAS_WIDTH,
} from "@/lib/resonance/constants";
import {
  createResonanceAudioState,
  disposeResonanceAudio,
  startResonanceAudio,
  updateResonanceAudio,
} from "@/lib/resonance/audio";
import { createParticles } from "@/lib/resonance/createParticles";
import { advanceInputState, attachInputListeners, createInputState } from "@/lib/resonance/input";
import {
  renderResonanceBackground,
  renderResonanceComposition,
  renderResonanceCursor,
  renderResonanceParticles,
} from "@/lib/resonance/render";
import {
  advancePulsesState,
  advanceParticlesState,
  advanceCursorState,
  advanceFrameClock,
  createCursorState,
  createFrameClock,
  spawnPulsesFromInput,
} from "@/lib/resonance/simulation";
import type { CanvasDimensions, Pulse } from "@/lib/resonance/types";
import { clamp } from "@/lib/resonance/utils";

const createInitialDimensions = (): CanvasDimensions => ({
  width: MIN_CANVAS_WIDTH,
  height: MIN_CANVAS_HEIGHT,
  dpr: 1,
});

export function ResonanceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: false });

    if (!context) {
      return;
    }

    const dimensions = createInitialDimensions();
    const frameClock = createFrameClock();
    const audioState = createResonanceAudioState();
    let particles = createParticles(dimensions);
    const pulses: Pulse[] = [];

    const resizeCanvas = () => {
      const viewportWidth = Math.max(window.innerWidth, MIN_CANVAS_WIDTH);
      const viewportHeight = Math.max(window.innerHeight, MIN_CANVAS_HEIGHT);
      const dpr = clamp(window.devicePixelRatio || 1, 1, MAX_DEVICE_PIXEL_RATIO);

      dimensions.width = viewportWidth;
      dimensions.height = viewportHeight;
      dimensions.dpr = dpr;

      canvas.width = Math.floor(viewportWidth * dpr);
      canvas.height = Math.floor(viewportHeight * dpr);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createParticles(dimensions);
    };

    resizeCanvas();
    const inputState = createInputState(dimensions);
    const cursorState = createCursorState(dimensions);
    const detachInputListeners = attachInputListeners({
      canvas,
      inputState,
    });
    const handleActivationGesture = () => {
      void startResonanceAudio(audioState);
    };
    window.addEventListener("pointerdown", handleActivationGesture, { passive: true });
    window.addEventListener("keydown", handleActivationGesture);

    let previousTimestamp = performance.now();
    let animationFrameId = 0;

    const frame = (timestamp: number) => {
      const rawDeltaSeconds = (timestamp - previousTimestamp) / 1000;
      previousTimestamp = timestamp;

      advanceFrameClock(frameClock, rawDeltaSeconds);
      advanceInputState(inputState, frameClock.deltaSeconds);
      updateResonanceAudio(audioState, {
        inputState,
        dimensions,
        deltaSeconds: frameClock.deltaSeconds,
      });
      spawnPulsesFromInput(pulses, inputState);
      advanceCursorState(cursorState, inputState, frameClock.deltaSeconds);
      advanceParticlesState(particles, inputState, cursorState, pulses, frameClock.deltaSeconds);
      advancePulsesState(pulses, frameClock.deltaSeconds);
      renderResonanceBackground(context, {
        dimensions,
        frameClock,
      });
      renderResonanceParticles(context, {
        particles,
        frameClock,
      });
      renderResonanceComposition(context, {
        dimensions,
        frameClock,
      });
      renderResonanceCursor(context, {
        dimensions,
        cursorState,
      });

      animationFrameId = window.requestAnimationFrame(frame);
    };

    animationFrameId = window.requestAnimationFrame(frame);
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointerdown", handleActivationGesture);
      window.removeEventListener("keydown", handleActivationGesture);
      detachInputListeners();
      window.cancelAnimationFrame(animationFrameId);
      disposeResonanceAudio(audioState);
    };
  }, []);

  return <canvas ref={canvasRef} className="resonance-canvas" aria-label="Resonance canvas" />;
}
