import type { CanvasDimensions } from "@/lib/creative/core/canvas";

export type CreativeRenderFramePayload = {
  context: CanvasRenderingContext2D;
  dimensions: CanvasDimensions;
  elapsedSeconds: number;
  deltaSeconds: number;
};

export type CreativeRenderer<Payload> = (payload: CreativeRenderFramePayload & Payload) => void;
