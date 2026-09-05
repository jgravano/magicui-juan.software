import {
  DOUBLE_TAP_MAX_DELAY_MS,
  MAX_PRESSURE_SCALE,
  MIN_PRESSURE_SCALE,
  TAP_MAX_DURATION_MS,
  TAP_MOVE_TOLERANCE,
  TAP_POSITION_TOLERANCE,
} from "@/lib/smiley/constants";
import type {
  SmileyLayout,
  SmileyPressSlot,
  Vector2,
} from "@/lib/smiley/types";

type SmileyInputOptions = {
  canvas: HTMLCanvasElement;
  getLayout: () => SmileyLayout;
  onDoublePress: (point: Vector2) => void;
  onFirstPress: () => void;
  onHover: (point: Vector2 | null) => void;
  onPressEnd: (slot: SmileyPressSlot) => void;
  onPressMove: (slot: SmileyPressSlot, point: Vector2, pressureScale: number) => void;
  onPressStart: (slot: SmileyPressSlot, point: Vector2, pressureScale: number) => void;
};

type ActivePointer = {
  isTapCandidate: boolean;
  point: Vector2;
  slot: SmileyPressSlot;
  startedAt: number;
  startPoint: Vector2;
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

const isInsideSphere = (point: Vector2, radius = 1) => (
  Math.hypot(point.x, point.y) <= radius
);

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
  onDoublePress,
  onFirstPress,
  onHover,
  onPressEnd,
  onPressMove,
  onPressStart,
}: SmileyInputOptions) => {
  const activePointers = new Map<number, ActivePointer>();
  let hasPressed = false;
  let keyboardPressed = false;
  let lastTapAt = Number.NEGATIVE_INFINITY;
  let lastTapPoint: Vector2 = { x: 0, y: 0 };
  let lastKeyboardActivationAt = Number.NEGATIVE_INFINITY;

  const getAvailableSlot = (): SmileyPressSlot | null => {
    let primaryIsUsed = keyboardPressed;
    let secondaryIsUsed = false;

    activePointers.forEach(({ slot }) => {
      primaryIsUsed ||= slot === 0;
      secondaryIsUsed ||= slot === 1;
    });

    if (!primaryIsUsed) {
      return 0;
    }

    return secondaryIsUsed ? null : 1;
  };

  const setCursor = (inside: boolean, pressing = false) => {
    canvas.style.cursor = pressing ? "grabbing" : inside ? "grab" : "default";
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || activePointers.has(event.pointerId)) {
      return;
    }

    const point = pointFromPointer(canvas, getLayout(), event.clientX, event.clientY);
    const slot = getAvailableSlot();

    const touchHitRadius = event.pointerType === "touch" ? 1.12 : 1;

    if (!isInsideSphere(point, touchHitRadius) || slot === null) {
      return;
    }

    event.preventDefault();
    const isOnlyPointer = activePointers.size === 0;

    if (!isOnlyPointer) {
      activePointers.forEach((pointer) => {
        pointer.isTapCandidate = false;
      });
    }

    activePointers.set(event.pointerId, {
      isTapCandidate: isOnlyPointer,
      point,
      slot,
      startedAt: event.timeStamp,
      startPoint: point,
    });

    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is an enhancement; the contact still works without it.
    }

    setCursor(true, true);
    onPressStart(slot, point, pressureScaleFromPointer(event));

    if (!hasPressed) {
      hasPressed = true;
      onFirstPress();
    }
  };

  const handlePointerMove = (event: PointerEvent) => {
    const point = pointFromPointer(canvas, getLayout(), event.clientX, event.clientY);
    const inside = isInsideSphere(point);
    const activePointer = activePointers.get(event.pointerId);

    if (activePointer) {
      event.preventDefault();
      activePointer.point = point;

      if (
        Math.hypot(
          point.x - activePointer.startPoint.x,
          point.y - activePointer.startPoint.y,
        ) > TAP_MOVE_TOLERANCE
      ) {
        activePointer.isTapCandidate = false;
      }

      onPressMove(activePointer.slot, point, pressureScaleFromPointer(event));
      onHover(point);
      setCursor(inside, true);
      return;
    }

    if (event.pointerType === "mouse") {
      onHover(inside ? point : null);
      setCursor(inside);
    }
  };

  const finishPointer = (event: PointerEvent, wasCancelled = false) => {
    const activePointer = activePointers.get(event.pointerId);

    if (!activePointer) {
      return;
    }

    const point = pointFromPointer(canvas, getLayout(), event.clientX, event.clientY);
    const inside = isInsideSphere(point);
    activePointers.delete(event.pointerId);
    onPressEnd(activePointer.slot);

    const isTap = !wasCancelled
      && activePointer.isTapCandidate
      && event.timeStamp - activePointer.startedAt <= TAP_MAX_DURATION_MS;

    if (isTap) {
      const isDoubleTap = event.timeStamp - lastTapAt <= DOUBLE_TAP_MAX_DELAY_MS
        && Math.hypot(point.x - lastTapPoint.x, point.y - lastTapPoint.y)
          <= TAP_POSITION_TOLERANCE;

      if (isDoubleTap) {
        onDoublePress(point);
        lastTapAt = Number.NEGATIVE_INFINITY;
      } else {
        lastTapAt = event.timeStamp;
        lastTapPoint = point;
      }
    }

    const remainingPointer = activePointers.values().next().value as ActivePointer | undefined;
    onHover(remainingPointer?.point ?? (inside ? point : null));
    setCursor(Boolean(remainingPointer) || inside, Boolean(remainingPointer));
  };

  const handlePointerLeave = () => {
    if (activePointers.size === 0) {
      onHover(null);
      setCursor(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (
      (event.key !== " " && event.key !== "Enter")
      || event.repeat
      || keyboardPressed
      || activePointers.size > 0
    ) {
      return;
    }

    event.preventDefault();
    keyboardPressed = true;
    const point = { x: 0, y: 0 };
    onHover(point);
    onPressStart(0, point, 1);
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
    onPressEnd(0);
    setCursor(true);

    const now = performance.now();

    if (now - lastKeyboardActivationAt <= DOUBLE_TAP_MAX_DELAY_MS) {
      onDoublePress({ x: 0, y: 0 });
      lastKeyboardActivationAt = Number.NEGATIVE_INFINITY;
    } else {
      lastKeyboardActivationAt = now;
    }
  };

  const handleBlur = () => {
    activePointers.forEach(({ slot }) => onPressEnd(slot));
    activePointers.clear();
    onHover(null);
    setCursor(false);
    if (keyboardPressed) {
      keyboardPressed = false;
      onPressEnd(0);
    }
  };

  const handleContextMenu = (event: MouseEvent) => event.preventDefault();

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", finishPointer);
  const handlePointerCancel = (event: PointerEvent) => finishPointer(event, true);
  canvas.addEventListener("pointercancel", handlePointerCancel);
  canvas.addEventListener("lostpointercapture", handlePointerCancel);
  window.addEventListener("blur", handleBlur);
  canvas.addEventListener("pointerleave", handlePointerLeave);
  canvas.addEventListener("keydown", handleKeyDown);
  canvas.addEventListener("keyup", handleKeyUp);
  canvas.addEventListener("blur", handleBlur);
  canvas.addEventListener("contextmenu", handleContextMenu);

  return () => {
    canvas.removeEventListener("pointerdown", handlePointerDown);
    canvas.removeEventListener("pointermove", handlePointerMove);
    canvas.removeEventListener("pointerup", finishPointer);
    canvas.removeEventListener("pointercancel", handlePointerCancel);
    canvas.removeEventListener("lostpointercapture", handlePointerCancel);
    window.removeEventListener("blur", handleBlur);
    canvas.removeEventListener("pointerleave", handlePointerLeave);
    canvas.removeEventListener("keydown", handleKeyDown);
    canvas.removeEventListener("keyup", handleKeyUp);
    canvas.removeEventListener("blur", handleBlur);
    canvas.removeEventListener("contextmenu", handleContextMenu);
  };
};
