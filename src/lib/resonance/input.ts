import {
  INPUT_IDLE_VELOCITY_DAMPING,
  INPUT_MIN_MOVEMENT_DISTANCE,
  INPUT_SPEED_RESPONSE,
} from "./constants";
import type { CanvasDimensions, InputState, PointerClick, Vector2 } from "./types";
import { clamp, lerp } from "./utils";

type AttachInputListenersPayload = {
  canvas: HTMLCanvasElement;
  inputState: InputState;
};

const toCanvasPosition = (event: PointerEvent, canvas: HTMLCanvasElement): Vector2 => {
  const rect = canvas.getBoundingClientRect();

  return {
    x: clamp(event.clientX - rect.left, 0, rect.width),
    y: clamp(event.clientY - rect.top, 0, rect.height),
  };
};

const isEventInsideCanvas = (event: PointerEvent, canvas: HTMLCanvasElement) => {
  const rect = canvas.getBoundingClientRect();

  return (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
};

const createClick = (
  id: number,
  position: Vector2,
  velocity: Vector2,
  isInside: boolean,
): PointerClick => ({
  id,
  position: { x: position.x, y: position.y },
  velocity: { x: velocity.x, y: velocity.y },
  timestampSeconds: performance.now() / 1000,
  isInside,
});

export const createInputState = (dimensions: CanvasDimensions): InputState => {
  const center = {
    x: dimensions.width * 0.5,
    y: dimensions.height * 0.5,
  };

  return {
    pointer: { x: center.x, y: center.y },
    previousPointer: { x: center.x, y: center.y },
    velocity: { x: 0, y: 0 },
    speed: 0,
    isPointerInside: false,
    isPointerDown: false,
    clickCount: 0,
    lastClick: null,
    queuedClicks: [],
    frameClicks: [],
  };
};

export const attachInputListeners = ({ canvas, inputState }: AttachInputListenersPayload) => {
  let nextClickId = inputState.clickCount;

  const setPointerFromEvent = (event: PointerEvent) => {
    const position = toCanvasPosition(event, canvas);
    inputState.pointer.x = position.x;
    inputState.pointer.y = position.y;
    inputState.isPointerInside = isEventInsideCanvas(event, canvas);
  };

  const handlePointerMove = (event: PointerEvent) => {
    setPointerFromEvent(event);
  };

  const handlePointerDown = (event: PointerEvent) => {
    setPointerFromEvent(event);
    inputState.isPointerDown = true;

    nextClickId += 1;
    inputState.clickCount = nextClickId;

    const click = createClick(
      nextClickId,
      inputState.pointer,
      inputState.velocity,
      inputState.isPointerInside,
    );
    inputState.lastClick = click;
    inputState.queuedClicks.push(click);
  };

  const handlePointerUp = () => {
    inputState.isPointerDown = false;
  };

  const handlePointerEnter = (event: PointerEvent) => {
    setPointerFromEvent(event);
    inputState.isPointerInside = true;
  };

  const handlePointerLeave = () => {
    inputState.isPointerInside = false;
  };

  const handleBlur = () => {
    inputState.isPointerDown = false;
    inputState.isPointerInside = false;
  };

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("blur", handleBlur);
  canvas.addEventListener("pointerenter", handlePointerEnter);
  canvas.addEventListener("pointerleave", handlePointerLeave);

  return () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerdown", handlePointerDown);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("blur", handleBlur);
    canvas.removeEventListener("pointerenter", handlePointerEnter);
    canvas.removeEventListener("pointerleave", handlePointerLeave);
  };
};

export const advanceInputState = (inputState: InputState, deltaSeconds: number) => {
  const safeDeltaSeconds = Math.max(deltaSeconds, 1 / 1000);
  const deltaX = inputState.pointer.x - inputState.previousPointer.x;
  const deltaY = inputState.pointer.y - inputState.previousPointer.y;
  const movementDistance = Math.hypot(deltaX, deltaY);
  const hasMovement = movementDistance > INPUT_MIN_MOVEMENT_DISTANCE;

  let instantaneousSpeed = 0;

  if (hasMovement) {
    inputState.velocity.x = deltaX / safeDeltaSeconds;
    inputState.velocity.y = deltaY / safeDeltaSeconds;
    instantaneousSpeed = movementDistance / safeDeltaSeconds;
  } else {
    const idleDecay = Math.exp(-INPUT_IDLE_VELOCITY_DAMPING * safeDeltaSeconds);
    inputState.velocity.x *= idleDecay;
    inputState.velocity.y *= idleDecay;
  }

  const speedBlend = 1 - Math.exp(-INPUT_SPEED_RESPONSE * safeDeltaSeconds);
  inputState.speed = lerp(inputState.speed, instantaneousSpeed, speedBlend);

  inputState.previousPointer.x = inputState.pointer.x;
  inputState.previousPointer.y = inputState.pointer.y;

  if (inputState.queuedClicks.length > 0) {
    inputState.frameClicks = inputState.queuedClicks.splice(0, inputState.queuedClicks.length);
  } else if (inputState.frameClicks.length > 0) {
    inputState.frameClicks = [];
  }
};
