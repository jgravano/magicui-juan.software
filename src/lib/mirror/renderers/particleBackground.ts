import type { CanvasDimensions } from "@/lib/creative/core/canvas";

type RenderParticleBackgroundPayload = {
  context: CanvasRenderingContext2D;
  dimensions: CanvasDimensions;
  elapsedSeconds: number;
  subjectPresence: number;
};

let cachedNoisePattern: CanvasPattern | null = null;

const getNoisePattern = (context: CanvasRenderingContext2D) => {
  if (cachedNoisePattern) {
    return cachedNoisePattern;
  }

  const noiseCanvas = document.createElement("canvas");
  noiseCanvas.width = 96;
  noiseCanvas.height = 96;
  const noiseContext = noiseCanvas.getContext("2d");
  if (!noiseContext) {
    return null;
  }

  const imageData = noiseContext.createImageData(noiseCanvas.width, noiseCanvas.height);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const value = Math.floor(Math.random() * 255);
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
    data[index + 3] = 255;
  }

  noiseContext.putImageData(imageData, 0, 0);
  cachedNoisePattern = context.createPattern(noiseCanvas, "repeat");
  return cachedNoisePattern;
};

export const renderParticleBackground = (payload: RenderParticleBackgroundPayload) => {
  const { context, dimensions, elapsedSeconds, subjectPresence } = payload;
  const { width, height } = dimensions;

  context.fillStyle = "#030406";
  context.fillRect(0, 0, width, height);

  const topShade = context.createLinearGradient(0, 0, 0, height * 0.5);
  topShade.addColorStop(0, "rgba(9, 14, 24, 0.45)");
  topShade.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = topShade;
  context.fillRect(0, 0, width, height);

  const bottomShade = context.createLinearGradient(0, height, 0, height * 0.42);
  bottomShade.addColorStop(0, "rgba(0, 0, 0, 0.52)");
  bottomShade.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = bottomShade;
  context.fillRect(0, 0, width, height);

  const breath = 0.5 + Math.sin(elapsedSeconds * 0.21) * 0.5;
  const driftX = Math.sin(elapsedSeconds * 0.17) * 30;
  const driftY = Math.cos(elapsedSeconds * 0.13) * 22;
  const centerX = width * 0.5 + driftX;
  const centerY = height * 0.5 + driftY;
  const radius = Math.max(width, height) * (0.48 + breath * 0.11);

  const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  glow.addColorStop(0, `rgba(84, 110, 176, ${0.08 + subjectPresence * 0.06})`);
  glow.addColorStop(0.56, "rgba(34, 45, 74, 0.04)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  const sideDrift = context.createRadialGradient(
    width * (0.25 + Math.sin(elapsedSeconds * 0.1) * 0.02),
    height * 0.58,
    0,
    width * 0.22,
    height * 0.58,
    Math.max(width, height) * 0.62,
  );
  sideDrift.addColorStop(0, `rgba(54, 72, 124, ${0.035 + subjectPresence * 0.04})`);
  sideDrift.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = sideDrift;
  context.fillRect(0, 0, width, height);

  const vignette = context.createRadialGradient(
    width * 0.5,
    height * 0.5,
    Math.min(width, height) * 0.35,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.82,
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.62)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);

  const pattern = getNoisePattern(context);
  if (pattern) {
    context.save();
    context.globalAlpha = 0.028;
    context.translate(Math.sin(elapsedSeconds * 0.4) * 12, Math.cos(elapsedSeconds * 0.35) * 12);
    context.fillStyle = pattern;
    context.fillRect(-24, -24, width + 48, height + 48);
    context.restore();
  }
};
