"use client";

import { useEffect, useRef } from "react";

import { clamp } from "@/lib/creative/math";
import { LUPA_MAX_DEVICE_PIXEL_RATIO } from "@/lib/lupa/constants";
import type { DictionaryLayout, DictionaryPaperEntry } from "@/lib/lupa/dictionary-layout";

type DictionaryPaperProps = {
  layout: DictionaryLayout;
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
};

type EntryRenderMetrics = {
  headwordFont: string;
  bodyFont: string;
  italicFont: string;
  lineHeightPx: number;
  entryGapPx: number;
};

const createSeededRandom = (seedValue: number) => {
  let seed = seedValue >>> 0;

  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
};

const readViewportSize = () => {
  const viewport = window.visualViewport;
  const width = Math.max(1, Math.round(viewport?.width ?? window.innerWidth));
  const height = Math.max(1, Math.round(viewport?.height ?? window.innerHeight));
  return { width, height };
};

const splitIntoLines = (
  context: CanvasRenderingContext2D,
  text: string,
  firstLineWidth: number,
  fullLineWidth: number,
) => {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }

  const lines: string[] = [];
  let line = "";
  let maxWidth = Math.max(24, firstLineWidth);

  const flush = () => {
    if (!line) {
      return;
    }

    lines.push(line);
    line = "";
    maxWidth = Math.max(24, fullLineWidth);
  };

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
      continue;
    }

    flush();
    line = word;
  }

  flush();
  return lines;
};

const drawPaperBase = (context: CanvasRenderingContext2D, width: number, height: number) => {
  context.fillStyle = "#e7e0cf";
  context.fillRect(0, 0, width, height);

  const warmFalloff = context.createRadialGradient(
    width * 0.48,
    height * 0.42,
    10,
    width * 0.48,
    height * 0.42,
    Math.max(width, height) * 0.74,
  );
  warmFalloff.addColorStop(0, "rgba(255, 255, 255, 0.28)");
  warmFalloff.addColorStop(1, "rgba(95, 72, 46, 0.13)");
  context.fillStyle = warmFalloff;
  context.fillRect(0, 0, width, height);

  context.save();
  context.strokeStyle = "rgba(88, 66, 40, 0.04)";
  context.lineWidth = 1;
  for (let y = 0; y < height; y += 4) {
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(width, y + 0.5);
    context.stroke();
  }
  context.restore();

  const rand = createSeededRandom(
    (Math.floor(width) * 73856093) ^ (Math.floor(height) * 19349663) ^ 0x9e3779b9,
  );
  const speckCount = Math.floor((width * height) / 2000);
  for (let index = 0; index < speckCount; index += 1) {
    const x = Math.floor(rand() * width);
    const y = Math.floor(rand() * height);
    const alpha = 0.02 + rand() * 0.035;
    context.fillStyle = `rgba(70, 52, 32, ${alpha.toFixed(3)})`;
    context.fillRect(x, y, 1, 1);
  }
};

const drawEntry = (payload: {
  context: CanvasRenderingContext2D;
  entry: DictionaryPaperEntry;
  x: number;
  y: number;
  columnWidth: number;
  metrics: EntryRenderMetrics;
}) => {
  const { context, entry, x, y, columnWidth, metrics } = payload;
  const headwordGapPx = 3;

  const headword = `${entry.headword}.`;
  context.font = metrics.headwordFont;
  context.fillStyle = `rgba(22, 16, 8, ${(0.84 + entry.tone * 0.08).toFixed(3)})`;
  context.fillText(headword, x, y);

  const headwordWidth = context.measureText(headword).width;
  const inlineBodyStartX = x + headwordWidth + headwordGapPx;
  const inlineBodyWidth = columnWidth - (inlineBodyStartX - x);
  const canShareFirstLine = inlineBodyWidth >= columnWidth * 0.24;

  const bodyText = `${entry.posLabel} ${entry.definition}`;
  context.font = metrics.bodyFont;
  context.fillStyle = `rgba(34, 24, 12, ${(0.72 + entry.tone * 0.08).toFixed(3)})`;

  const bodyStartY = canShareFirstLine ? y : y + metrics.lineHeightPx;
  const bodyStartX = canShareFirstLine ? inlineBodyStartX : x;
  const firstLineWidth = canShareFirstLine ? inlineBodyWidth : columnWidth;
  const lines = splitIntoLines(context, bodyText, firstLineWidth, columnWidth);

  let cursorY = bodyStartY;
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const lineX = lineIndex === 0 ? bodyStartX : x;
    context.fillText(line, lineX, cursorY);
    cursorY += metrics.lineHeightPx;
  }

  if (entry.example) {
    context.font = metrics.italicFont;
    context.fillStyle = `rgba(40, 30, 18, ${(0.58 + entry.tone * 0.07).toFixed(3)})`;
    const exampleLines = splitIntoLines(context, `Ej.: ${entry.example}`, columnWidth, columnWidth);
    for (const line of exampleLines) {
      context.fillText(line, x, cursorY);
      cursorY += metrics.lineHeightPx;
    }
  }

  return cursorY - y + metrics.entryGapPx;
};

export function DictionaryPaper(props: DictionaryPaperProps) {
  const { layout, onCanvasReady } = props;
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

    const metrics: EntryRenderMetrics = {
      headwordFont: `600 ${layout.headwordFontSizePx}px "Source Serif 4", "Iowan Old Style", "Times New Roman", serif`,
      bodyFont: `400 ${layout.bodyFontSizePx}px "Source Serif 4", "Iowan Old Style", "Times New Roman", serif`,
      italicFont: `italic 400 ${layout.bodyFontSizePx}px "Source Serif 4", "Iowan Old Style", "Times New Roman", serif`,
      lineHeightPx: layout.lineHeightPx,
      entryGapPx: layout.entryGapPx,
    };

    let resizeFrameId = 0;
    // Keep version monotonic across layout effect restarts so the WebGL layer can
    // detect content changes even when size/DPR stay identical.
    let textureVersion = Number(canvas.dataset.lupaTextureVersion ?? "0");
    let readyNotified = false;
    let previousWidth = 0;
    let previousHeight = 0;
    let previousDpr = 0;

    const draw = () => {
      const { width, height } = readViewportSize();
      const dpr = clamp(window.devicePixelRatio || 1, 1, LUPA_MAX_DEVICE_PIXEL_RATIO);

      // Skip full redraw when size and DPR are unchanged.
      if (width === previousWidth && height === previousHeight && dpr === previousDpr) {
        return;
      }

      previousWidth = width;
      previousHeight = height;
      previousDpr = dpr;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawPaperBase(context, width, height);

      const usableWidth = Math.max(80, width - layout.paddingPx * 2);
      const estimatedColumns = Math.floor(
        (usableWidth + layout.columnGapPx) / (layout.preferredColumnWidthPx + layout.columnGapPx),
      );
      const columnCount = Math.round(clamp(estimatedColumns, layout.minColumns, layout.maxColumns));
      const totalGap = layout.columnGapPx * (columnCount - 1);
      const columnWidth = Math.max(76, (usableWidth - totalGap) / columnCount);
      const bottomLimit = height - layout.paddingPx;

      context.save();
      context.strokeStyle = "rgba(56, 42, 24, 0.1)";
      context.lineWidth = 1;
      for (let column = 1; column < columnCount; column += 1) {
        const ruleX =
          layout.paddingPx + column * (columnWidth + layout.columnGapPx) - layout.columnGapPx * 0.5;
        context.beginPath();
        context.moveTo(ruleX, layout.paddingPx - 8);
        context.lineTo(ruleX, bottomLimit + 8);
        context.stroke();
      }
      context.restore();

      const entries = layout.entries;
      let entryIndex = 0;
      for (let column = 0; column < columnCount; column += 1) {
        const x = layout.paddingPx + column * (columnWidth + layout.columnGapPx);
        let y = layout.paddingPx;

        while (y < bottomLimit) {
          const entry = entries[entryIndex % entries.length];
          const entryHeight = drawEntry({
            context,
            entry,
            x,
            y,
            columnWidth,
            metrics,
          });
          y += entryHeight;
          entryIndex += 1;
        }
      }

      textureVersion += 1;
      canvas.dataset.lupaTextureVersion = String(textureVersion);

      if (!readyNotified) {
        readyNotified = true;
        onCanvasReady?.(canvas);
      }
    };

    const scheduleDraw = () => {
      if (resizeFrameId !== 0) {
        window.cancelAnimationFrame(resizeFrameId);
      }

      resizeFrameId = window.requestAnimationFrame(() => {
        resizeFrameId = 0;
        draw();
      });
    };

    const visualViewport = window.visualViewport;

    scheduleDraw();
    window.addEventListener("resize", scheduleDraw, { passive: true });
    window.addEventListener("orientationchange", scheduleDraw, { passive: true });
    visualViewport?.addEventListener("resize", scheduleDraw);
    visualViewport?.addEventListener("scroll", scheduleDraw);

    return () => {
      if (resizeFrameId !== 0) {
        window.cancelAnimationFrame(resizeFrameId);
      }
      window.removeEventListener("resize", scheduleDraw);
      window.removeEventListener("orientationchange", scheduleDraw);
      visualViewport?.removeEventListener("resize", scheduleDraw);
      visualViewport?.removeEventListener("scroll", scheduleDraw);
      onCanvasReady?.(null);
    };
  }, [layout, onCanvasReady]);

  return <canvas ref={canvasRef} className="lupa-paper" aria-label="Spanish dictionary paper" />;
}
