"use client";

import { useEffect, useRef, useState } from "react";

import { createMeltController } from "@/lib/melt/controller";
import type { MeltController, MeltUIState } from "@/lib/melt/types";

const initialState: MeltUIState = {
  phase: "booting",
  cameraStatus: "idle",
  segmentationStatus: "idle",
  coverage: 0,
  renderFps: 0,
  foregroundRatio: 0,
  debugEnabled: false,
  notice: null,
};

const phaseCopy = (state: MeltUIState) => {
  if (state.phase === "booting") return "LOOKING";
  if (state.phase === "learning") return state.coverage > 0.72 ? "ONE MORE SIDE" : "MOVE";
  if (state.phase === "ready") return "READY — SPACE";
  if (state.phase === "gone") return "SPACE TO RETURN";
  if (state.phase === "error") return "CAMERA UNAVAILABLE";
  return "";
};

export function MeltExperience() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<MeltController | null>(null);
  const [state, setState] = useState<MeltUIState>(initialState);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const controller = createMeltController({
      canvas,
      debugCanvas: debugCanvasRef.current ?? undefined,
      onStateChange: setState,
    });
    controllerRef.current = controller;
    void controller.start();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        controller.trigger();
      } else if (event.key.toLowerCase() === "r") {
        controller.relearnBackground();
      } else if (event.key.toLowerCase() === "d") {
        controller.toggleDebug();
      } else if (event.key === "Escape") {
        controller.resetEffect();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      controller.stop();
      controllerRef.current = null;
    };
  }, []);

  const copy = phaseCopy(state);

  return (
    <>
      <canvas ref={canvasRef} className="melt-canvas" aria-label="Melt camera experience" />
      <canvas ref={debugCanvasRef} className="melt-debug-canvas" aria-hidden />
      {copy ? <p className={`melt-instruction melt-instruction--${state.phase}`}>{copy}</p> : null}
      {state.phase === "learning" ? (
        <div className="melt-progress" aria-label={`Background learned ${Math.round(state.coverage * 100)}%`}>
          <span style={{ transform: `scaleX(${state.coverage})` }} />
        </div>
      ) : null}
      {state.notice ? <p className="melt-notice">{state.notice}</p> : null}
      {state.debugEnabled ? (
        <aside className="melt-debug">
          <p>melt debug</p>
          <p>phase: {state.phase}</p>
          <p>camera: {state.cameraStatus}</p>
          <p>segmentation: {state.segmentationStatus}</p>
          <p>coverage: {(state.coverage * 100).toFixed(1)}%</p>
          <p>person: {(state.foregroundRatio * 100).toFixed(1)}%</p>
          <p>fps: {state.renderFps.toFixed(1)}</p>
          <p>space trigger · r relearn · esc reset · d debug</p>
        </aside>
      ) : null}
    </>
  );
}
