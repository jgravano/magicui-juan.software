"use client";

import { useEffect, useRef } from "react";

import styles from "@/app/smiley/smiley.module.css";
import { attachSmileyInput } from "@/lib/smiley/input";
import { createSmileyRenderer } from "@/lib/smiley/renderer";
import {
  advanceSmileyInteraction,
  beginSmileyPress,
  createSmileyInteractionState,
  endSmileyPress,
  moveSmileyPress,
  setSmileyHover,
} from "@/lib/smiley/simulation";

export function SmileyExperience() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hintRef = useRef<HTMLParagraphElement | null>(null);
  const statusRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    let isDisposed = false;
    let animationFrameId = 0;
    let detachInput: (() => void) | null = null;
    let disposeRenderer: (() => void) | null = null;
    let handleResize: (() => void) | null = null;

    const start = async () => {
      try {
        const renderer = await createSmileyRenderer(canvas);

        if (isDisposed) {
          renderer.dispose();
          return;
        }

        disposeRenderer = renderer.dispose;
        handleResize = renderer.resize;
        renderer.resize();

        const interaction = createSmileyInteractionState();
        const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
        detachInput = attachSmileyInput({
          canvas,
          getLayout: renderer.getLayout,
          onPressStart: (slot, point, pressure) => (
            beginSmileyPress(interaction, slot, point, pressure)
          ),
          onPressMove: (slot, point, pressure) => (
            moveSmileyPress(interaction, slot, point, pressure)
          ),
          onPressEnd: (slot) => endSmileyPress(interaction, slot),
          onHover: (point) => setSmileyHover(interaction, point),
          onFirstPress: () => hintRef.current?.classList.add(styles.hintHidden),
        });

        canvas.classList.add(styles.canvasReady);
        let previousTimestamp = performance.now();
        const startedAt = previousTimestamp;

        const frame = (timestamp: number) => {
          const deltaSeconds = (timestamp - previousTimestamp) / 1000;
          const elapsedSeconds = (timestamp - startedAt) / 1000;
          previousTimestamp = timestamp;

          advanceSmileyInteraction(interaction, deltaSeconds, motionPreference.matches);
          renderer.render(elapsedSeconds, interaction, motionPreference.matches);
          animationFrameId = window.requestAnimationFrame(frame);
        };

        animationFrameId = window.requestAnimationFrame(frame);
        window.addEventListener("resize", renderer.resize);
      } catch (error) {
        if (statusRef.current) {
          statusRef.current.textContent = error instanceof Error
            ? error.message
            : "This experiment could not start.";
        }
      }
    };

    void start();

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(animationFrameId);

      if (handleResize) {
        window.removeEventListener("resize", handleResize);
      }

      detachInput?.();
      disposeRenderer?.();
    };
  }, []);

  return (
    <div className={styles.experience}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        tabIndex={0}
        aria-label="A soft smiley sphere. Press anywhere to deform it, or squeeze and stretch it with two fingers."
        aria-describedby="smiley-hint smiley-status"
      />
      <p ref={hintRef} id="smiley-hint" className={styles.hint}>press, pinch or stretch me</p>
      <p ref={statusRef} id="smiley-status" className={styles.status} aria-live="polite" />
    </div>
  );
}
