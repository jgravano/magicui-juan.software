"use client";

import { useEffect, useRef, useState } from "react";

import { createOtherSideController } from "@/lib/other-side/controller";
import type { OtherSideController, OtherSideUIState } from "@/lib/other-side/types";

const initialUIState: OtherSideUIState = {
  phase: "booting",
  cameraStatus: "idle",
  handTrackingStatus: "idle",
  handsVisible: 0,
  activeHandles: 0,
  frameActive: false,
  renderFps: 0,
  notice: null,
};

const getPrompt = (state: OtherSideUIState) => {
  if (state.phase === "booting") return "Starting the camera…";
  if (state.phase === "error") return "The camera is unavailable.";
  if (state.handsVisible === 0) return "Hold both hands in view.";
  if (state.handsVisible === 1) return "Bring your other hand into view.";
  if (!state.frameActive) return "Move your hands farther apart.";
  return "";
};

export function TheOtherSideExperience() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<OtherSideController | null>(null);
  const [uiState, setUiState] = useState<OtherSideUIState>(initialUIState);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const controller = createOtherSideController({ canvas, onStateChange: setUiState });
    controllerRef.current = controller;
    void controller.start();
    return () => {
      controller.stop();
      controllerRef.current = null;
    };
  }, []);

  const prompt = getPrompt(uiState);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="other-side-canvas"
        aria-label="The Other Side live camera experience"
      />
      {prompt ? <p className="other-side-instruction">{prompt}</p> : null}
      {uiState.notice ? <p className="other-side-notice">{uiState.notice}</p> : null}
    </>
  );
}
