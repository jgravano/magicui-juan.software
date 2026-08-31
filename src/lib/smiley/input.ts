import {
  MAX_PRESSURE_SCALE,
  MIN_PRESSURE_SCALE,
} from "@/lib/smiley/constants";
import type { SmileyLayout, Vector2 } from "@/lib/smiley/types";

type SmileyInputOptions = {
  canvas: HTMLCanvasElement;
  getLayout: () => SmileyLayout;
  onFirstPress: () => void;
  onHover: (point: Vector2 | null) => void;
  onPressEnd: () => void;
  onPressMove: (point: Vector2, pressureScale: number) => void;
  onPressStart: (point: Vector2, pressureScale: number) => void;
};

const pointFromPointer = (
  canvas: HTMLCanvasElement,
  layout: SmileyLayout,
  clientX: number,
  clientY: number,
): Vector2 => {
  const bounds = canvas.getBoundingClientRect();
  const scaleX = layout.viewportWidth / bounds.width;
  const scaleY = layout.viewportHeight / bounds.height;
  const viewportX = (clientX - bounds.left) * scaleX;
  const viewportY = (clientY - bounds.top) * scaleY;

  return {
    x: (viewportX - layout.centerX) / layout.radiusPixels,
    y: (layout.centerY - viewportY) / layout.radiusPixels,
  };
};

const isInsideSphere = (point: Vector2) => Math.hypot(point.x, point.y) <= 1;

const pressureScaleFromPointer = (event: PointerEvent) => {
  if (event.pointerType === "mouse") {
    return 1;
  }

  const pressure = event.pressure > 0 ? event.pressure : 0.64;
  return MIN_PRESSURE_SCALE + pressure * (MAX_PRESSURE_SCALE - MIN_PRESSURE_SCALE);
};

export const attachSmileyInput = ({
  canvas,
  getLayout,
  onFirstPress,
  onHover,
  onPressEnd,
  onPressMove,
  onPressStart,
}: SmileyInputOptions) => {
  let activePointerId: number | null = null;
  let hasPressed = false;
  let keyboardPressed = false;

  const setCursor = (inside: boolean, pressing = false) => {
    canvas.style.cursor = pressing ? "grabbing" : inside ? "grab" : "default";
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (activePointerId !== null) {
      return;
    }

    const point = pointFromPointer(canvas, getLayout(), event.clientX, event.clientY);

    if (!isInsideSphere(point)) {
      return;
    }

    event.preventDefault();
    activePointerId = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    setCursor(true, true);
    onPressStart(point, pressureScaleFromPointer(event));

    if (!hasPressed) {
      hasPressed = true;
      onFirstPress();
    }
  };

  const handlePointerMove = (event: PointerEvent) => {
    const point = pointFromPointer(canvas, getLayout(), event.clientX, event.clientY);
    const inside = isInsideSphere(point);

    if (event.pointerId === activePointerId) {
      event.preventDefault();
      onPressMove(point, pressureScaleFromPointer(event));
      onHover(point);
      setCursor(inside, true);
      return;
    }

    if (event.pointerType === "mouse") {
      onHover(inside ? point : null);
      setCursor(inside);
    }
  };

  const finishPointer = (event: PointerEvent) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    const point = pointFromPointer(canvas, getLayout(), event.clientX, event.clientY);
    const inside = isInsideSphere(point);
    activePointerId = null;
    onPressEnd();
    onHover(inside ? point : null);
    setCursor(inside);
  };

  const handlePointerLeave = () => {
    if (activePointerId === null) {
      onHover(null);
      setCursor(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if ((event.key !== " " && event.key !== "Enter") || event.repeat || keyboardPressed) {
      return;
    }

    event.preventDefault();
    keyboardPressed = true;
    const point = { x: 0, y: 0 };
    onHover(point);
    onPressStart(point, 1);
    setCursor(true, true);

    if (!hasPressed) {
      hasPressed = true;
      onFirstPress();
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if ((event.key !== " " && event.key !== "Enter") || !keyboardPressed) {
      return;
    }

    event.preventDefault();
    keyboardPressed = false;
    onPressEnd();
    setCursor(true);
  };

  const handleBlur = () => {
    if (keyboardPressed) {
      keyboardPressed = false;
      onPressEnd();
    }
  };

  const handleContextMenu = (event: MouseEvent) => event.preventDefault();

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", finishPointer);
  canvas.addEventListener("pointerleave", handlePointerLeave);
  canvas.addEventListener("keydown", handleKeyDown);
  canvas.addEventListener("keyup", handleKeyUp);
  canvas.addEventListener("blur", handleBlur);
  canvas.addEventListener("contextmenu", handleContextMenu);

  return () => {
    canvas.removeEventListener("pointerdown", handlePointerDown);
    canvas.removeEventListener("pointermove", handlePointerMove);
    canvas.removeEventListener("pointerup", finishPointer);
    canvas.removeEventListener("pointercancel", finishPointer);
    canvas.removeEventListener("pointerleave", handlePointerLeave);
    canvas.removeEventListener("keydown", handleKeyDown);
    canvas.removeEventListener("keyup", handleKeyUp);
    canvas.removeEventListener("blur", handleBlur);
    canvas.removeEventListener("contextmenu", handleContextMenu);
  };
};
