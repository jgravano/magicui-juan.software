"use client";

import { useEffect, useRef, useState } from "react";

import { createMirrorController } from "@/lib/mirror/controller";
import type { MirrorController, MirrorDebugStage, MirrorUIState } from "@/lib/mirror/types";

const initialUIState: MirrorUIState = {
  cameraStatus: "idle",
  notice: null,
  renderFps: 0,
  debug: {
    enabled: false,
    stage: 1,
  },
  processing: null,
  liquid: null,
  particlePaused: true,
};

const parseDebugConfigFromQuery = () => {
  const params = new URLSearchParams(window.location.search);
  const debugRaw = params.get("debug")?.toLowerCase();
  const debugEnabled = debugRaw === "1" || debugRaw === "true" || debugRaw === "on";
  const stageRaw = Number(params.get("stage"));
  const stage: MirrorDebugStage =
    stageRaw === 4 ? 4 : stageRaw === 3 ? 3 : stageRaw === 2 ? 2 : 1;

  return {
    debugEnabled,
    stage,
  };
};

const isDebugToggleKey = (event: KeyboardEvent) => event.key.toLowerCase() === "d" && event.shiftKey;

const isDebugStageKey = (event: KeyboardEvent): MirrorDebugStage | null => {
  if (event.key === "1") {
    return 1;
  }

  if (event.key === "2") {
    return 2;
  }

  if (event.key === "3") {
    return 3;
  }

  if (event.key === "4") {
    return 4;
  }

  return null;
};

const shouldIgnoreKeyboard = (event: KeyboardEvent) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
};

export function MirrorExperience() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<MirrorController | null>(null);
  const [uiState, setUiState] = useState<MirrorUIState>(initialUIState);
  const debugEnabledRef = useRef(uiState.debug.enabled);

  useEffect(() => {
    debugEnabledRef.current = uiState.debug.enabled;
  }, [uiState.debug.enabled]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const queryDebug = parseDebugConfigFromQuery();
    const controller = createMirrorController({
      canvas,
      debugCanvas: debugCanvasRef.current ?? undefined,
      debug: {
        enabled: queryDebug.debugEnabled,
        stage: queryDebug.stage,
      },
      onStateChange: setUiState,
    });

    controllerRef.current = controller;
    void controller.start();

    const toCanvasUv = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return null;
      }

      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;
      return { x, y };
    };

    const handlePointerMove = (event: PointerEvent) => {
      const uv = toCanvasUv(event.clientX, event.clientY);
      if (!uv) {
        controller.clearPointerUv();
        return;
      }
      if (uv.x < 0 || uv.x > 1 || uv.y < 0 || uv.y > 1) {
        controller.clearPointerUv();
        return;
      }
      controller.setPointerUv(uv.x, uv.y);
    };

    const handlePointerDown = (event: PointerEvent) => {
      const uv = toCanvasUv(event.clientX, event.clientY);
      if (!uv) {
        return;
      }
      if (uv.x < 0 || uv.x > 1 || uv.y < 0 || uv.y > 1) {
        return;
      }
      controller.setPointerUv(uv.x, uv.y);
      controller.registerPointerImpact(uv.x, uv.y);
    };

    const handlePointerLeave = () => {
      controller.clearPointerUv();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("pointercancel", handlePointerLeave);
    window.addEventListener("blur", handlePointerLeave);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreKeyboard(event)) {
        return;
      }

      if (isDebugToggleKey(event)) {
        event.preventDefault();
        controllerRef.current?.toggleDebugEnabled();
        return;
      }

      if (!debugEnabledRef.current) {
        return;
      }

      const stage = isDebugStageKey(event);
      if (stage) {
        controllerRef.current?.setDebugStage(stage);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("pointercancel", handlePointerLeave);
      window.removeEventListener("blur", handlePointerLeave);
      window.removeEventListener("keydown", handleKeyDown);
      controller.stop();
      controllerRef.current = null;
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="mirror-canvas" aria-label="Mirror object canvas" />
      <canvas ref={debugCanvasRef} className="mirror-debug-canvas" aria-hidden />
      {uiState.debug.enabled ? (
        <aside className="mirror-debug" aria-live="polite">
          <p className="mirror-debug__title">mirror debug</p>
          <p className="mirror-debug__line">stage: {uiState.debug.stage}</p>
          <p className="mirror-debug__line">camera: {uiState.cameraStatus}</p>
          <p className="mirror-debug__line">render fps: {uiState.renderFps.toFixed(1)}</p>
          <p className="mirror-debug__line">
            shader: {uiState.liquid?.shaderReady ? "ok" : "pending"}
          </p>
          <p className="mirror-debug__line">
            layer1 object: {uiState.liquid?.shaderReady ? "active" : "pending"}
          </p>
          <p className="mirror-debug__line">
            layer2 material: {uiState.liquid?.shaderReady ? "active" : "pending"}
          </p>
          <p className="mirror-debug__line">
            layer3 reflection: {uiState.cameraStatus === "ready" && uiState.processing ? "active" : "pending"}
          </p>
          <p className="mirror-debug__line">
            layer4 polish: pending
          </p>
          {uiState.processing ? (
            <>
              <p className="mirror-debug__line">
                processing: {uiState.processing.width}x{uiState.processing.height}
              </p>
              <p className="mirror-debug__line">
                process ms: {uiState.processing.processingMs.toFixed(2)}
              </p>
              <p className="mirror-debug__line">
                luma mean: {uiState.processing.luminanceMean.toFixed(3)}
              </p>
              <p className="mirror-debug__line">
                motion mean/peak: {uiState.processing.motionMean.toFixed(3)} /{" "}
                {uiState.processing.motionPeak.toFixed(3)}
              </p>
            </>
          ) : null}
          {uiState.liquid ? (
            <>
              <p className="mirror-debug__line">
                motion energy: {uiState.liquid.motionEnergy.toFixed(3)}
              </p>
              <p className="mirror-debug__line">
                liquid render ms: {uiState.liquid.renderMs.toFixed(2)}
              </p>
            </>
          ) : null}
          <p className="mirror-debug__hint">
            Shift+D toggle debug · 1 base object · 2 material · 3 integrated reflection · 4 polish
          </p>
          <p className="mirror-debug__line">
            particle mirror paused: {uiState.particlePaused ? "yes" : "no"}
          </p>
          {uiState.notice ? <p className="mirror-debug__notice">{uiState.notice}</p> : null}
        </aside>
      ) : null}
    </>
  );
}
