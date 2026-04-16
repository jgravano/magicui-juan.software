import { clamp } from "@/lib/creative/math";
import type { LupaInputState } from "@/lib/lupa/types";

export const createLupaInputState = (): LupaInputState => ({
  targetUvX: 0.5,
  targetUvY: 0.5,
});

export const updateLupaInputFromClient = (payload: {
  canvas: HTMLCanvasElement;
  inputState: LupaInputState;
  clientX: number;
  clientY: number;
}) => {
  const { canvas, inputState, clientX, clientY } = payload;
  const rect = canvas.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  const uvX = (clientX - rect.left) / rect.width;
  const uvY = (clientY - rect.top) / rect.height;

  if (uvX < 0 || uvX > 1 || uvY < 0 || uvY > 1) {
    return false;
  }

  inputState.targetUvX = clamp(uvX, 0, 1);
  inputState.targetUvY = clamp(uvY, 0, 1);
  return true;
};
