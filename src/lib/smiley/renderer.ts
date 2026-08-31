import {
  DESKTOP_SPHERE_HEIGHT_RATIO,
  DESKTOP_SPHERE_WIDTH_RATIO,
  MAX_DEVICE_PIXEL_RATIO,
  MESH_SEGMENTS,
  MIN_CANVAS_HEIGHT,
  MIN_CANVAS_WIDTH,
  MOBILE_BREAKPOINT,
  MOBILE_SPHERE_HEIGHT_RATIO,
  MOBILE_SPHERE_WIDTH_RATIO,
} from "@/lib/smiley/constants";
import { createSmileyMeshGeometry } from "@/lib/smiley/geometry";
import {
  backgroundFragmentShader,
  backgroundVertexShader,
  objectFragmentShader,
  objectVertexShader,
} from "@/lib/smiley/shaders";
import type { SmileyInteractionState, SmileyLayout } from "@/lib/smiley/types";

type SmileyRenderer = {
  dispose: () => void;
  getLayout: () => SmileyLayout;
  render: (
    elapsedSeconds: number,
    interaction: SmileyInteractionState,
    reduceMotion: boolean,
  ) => void;
  resize: () => void;
};

const compileShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("Could not create a WebGL shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
};

const createProgram = (
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
) => {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  if (!program) {
    throw new Error("Could not create a WebGL program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown program link error.";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
};

const getUniform = (gl: WebGL2RenderingContext, program: WebGLProgram, name: string) => {
  const location = gl.getUniformLocation(program, name);

  if (location === null) {
    throw new Error(`Missing WebGL uniform: ${name}`);
  }

  return location;
};

const loadTexture = async (
  gl: WebGL2RenderingContext,
  source: string,
) => {
  const image = new Image();
  image.decoding = "async";
  image.src = source;
  await image.decode();

  const texture = gl.createTexture();

  if (!texture) {
    throw new Error("Could not create a WebGL texture.");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image,
  );
  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
};

const createLayout = (width: number, height: number): SmileyLayout => {
  const isMobile = width <= MOBILE_BREAKPOINT;
  const widthRatio = isMobile ? MOBILE_SPHERE_WIDTH_RATIO : DESKTOP_SPHERE_WIDTH_RATIO;
  const heightRatio = isMobile ? MOBILE_SPHERE_HEIGHT_RATIO : DESKTOP_SPHERE_HEIGHT_RATIO;
  const diameter = Math.min(width * widthRatio, height * heightRatio);

  return {
    centerX: width * 0.5,
    centerY: height * 0.49,
    radiusPixels: diameter * 0.5,
    viewportWidth: width,
    viewportHeight: height,
  };
};

export const createSmileyRenderer = async (
  canvas: HTMLCanvasElement,
): Promise<SmileyRenderer> => {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: true,
    depth: false,
    powerPreference: "high-performance",
    premultipliedAlpha: false,
  });

  if (!gl) {
    throw new Error("This experiment needs WebGL 2.");
  }

  const backgroundProgram = createProgram(gl, backgroundVertexShader, backgroundFragmentShader);
  const objectProgram = createProgram(gl, objectVertexShader, objectFragmentShader);
  const backgroundVao = gl.createVertexArray();
  const objectVao = gl.createVertexArray();
  const vertexBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();

  if (!backgroundVao || !objectVao || !vertexBuffer || !indexBuffer) {
    throw new Error("Could not allocate WebGL geometry.");
  }

  const geometry = createSmileyMeshGeometry(MESH_SEGMENTS);
  gl.bindVertexArray(objectVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(
    1,
    2,
    gl.FLOAT,
    false,
    4 * Float32Array.BYTES_PER_ELEMENT,
    2 * Float32Array.BYTES_PER_ELEMENT,
  );
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
  gl.bindVertexArray(null);

  const [backgroundTexture, objectTexture] = await Promise.all([
    loadTexture(gl, "/experiments/smiley/studio-background.png"),
    loadTexture(gl, "/experiments/smiley/smiley-idle.png"),
  ]);

  const backgroundUniforms = {
    background: getUniform(gl, backgroundProgram, "uBackground"),
    aspect: getUniform(gl, backgroundProgram, "uAspect"),
    objectCenter: getUniform(gl, backgroundProgram, "uObjectCenter"),
    objectRadius: getUniform(gl, backgroundProgram, "uObjectRadius"),
    pressAmount: getUniform(gl, backgroundProgram, "uPressAmount"),
    wobble: getUniform(gl, backgroundProgram, "uWobble"),
  };
  const objectUniforms = {
    objectTexture: getUniform(gl, objectProgram, "uObjectTexture"),
    objectCenter: getUniform(gl, objectProgram, "uObjectCenter"),
    objectScale: getUniform(gl, objectProgram, "uObjectScale"),
    pressPointA: getUniform(gl, objectProgram, "uPressPointA"),
    pressPointB: getUniform(gl, objectProgram, "uPressPointB"),
    pressAmountA: getUniform(gl, objectProgram, "uPressAmountA"),
    pressAmountB: getUniform(gl, objectProgram, "uPressAmountB"),
    pinchAmount: getUniform(gl, objectProgram, "uPinchAmount"),
    pinchAxis: getUniform(gl, objectProgram, "uPinchAxis"),
    hoverPoint: getUniform(gl, objectProgram, "uHoverPoint"),
    hoverAmount: getUniform(gl, objectProgram, "uHoverAmount"),
    wobble: getUniform(gl, objectProgram, "uWobble"),
    reduceMotion: getUniform(gl, objectProgram, "uReduceMotion"),
    time: getUniform(gl, objectProgram, "uTime"),
  };

  let layout = createLayout(MIN_CANVAS_WIDTH, MIN_CANVAS_HEIGHT);

  const resize = () => {
    const width = Math.max(window.innerWidth, MIN_CANVAS_WIDTH);
    const height = Math.max(window.innerHeight, MIN_CANVAS_HEIGHT);
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), MAX_DEVICE_PIXEL_RATIO);
    const bufferWidth = Math.floor(width * dpr);
    const bufferHeight = Math.floor(height * dpr);

    if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
      canvas.width = bufferWidth;
      canvas.height = bufferHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    gl.viewport(0, 0, bufferWidth, bufferHeight);
    layout = createLayout(width, height);
  };

  const render = (
    elapsedSeconds: number,
    interaction: SmileyInteractionState,
    reduceMotion: boolean,
  ) => {
    const [primaryPress, secondaryPress] = interaction.presses;
    const pinchDeltaX = secondaryPress.contact.x - primaryPress.contact.x;
    const pinchDeltaY = secondaryPress.contact.y - primaryPress.contact.y;
    const pinchDistance = Math.hypot(pinchDeltaX, pinchDeltaY);
    const pinchPresence = Math.max(0, Math.min(1, (pinchDistance - 0.16) / 0.34));
    const pinchAmount = Math.min(
      Math.max(primaryPress.amount, 0),
      Math.max(secondaryPress.amount, 0),
    ) * pinchPresence;
    const pinchAxisX = pinchDistance > 0.001 ? pinchDeltaX / pinchDistance : 1;
    const pinchAxisY = pinchDistance > 0.001 ? pinchDeltaY / pinchDistance : 0;
    const aggregatePressAmount = Math.min(
      Math.max(primaryPress.amount, secondaryPress.amount, 0) + pinchAmount * 0.28,
      1.32,
    );
    const objectCenterClipX = (layout.centerX / layout.viewportWidth) * 2 - 1;
    const objectCenterClipY = 1 - (layout.centerY / layout.viewportHeight) * 2;
    const objectScaleClipX = (layout.radiusPixels / layout.viewportWidth) * 2;
    const objectScaleClipY = (layout.radiusPixels / layout.viewportHeight) * 2;
    const objectCenterUvX = layout.centerX / layout.viewportWidth;
    const objectCenterUvY = 1 - layout.centerY / layout.viewportHeight;
    const objectRadiusUvX = layout.radiusPixels / layout.viewportWidth;
    const objectRadiusUvY = layout.radiusPixels / layout.viewportHeight;

    gl.disable(gl.BLEND);
    gl.useProgram(backgroundProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
    gl.uniform1i(backgroundUniforms.background, 0);
    gl.uniform1f(backgroundUniforms.aspect, layout.viewportWidth / layout.viewportHeight);
    gl.uniform2f(backgroundUniforms.objectCenter, objectCenterUvX, objectCenterUvY);
    gl.uniform2f(backgroundUniforms.objectRadius, objectRadiusUvX, objectRadiusUvY);
    gl.uniform1f(backgroundUniforms.pressAmount, aggregatePressAmount);
    gl.uniform1f(backgroundUniforms.wobble, interaction.wobble);
    gl.bindVertexArray(backgroundVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(objectProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, objectTexture);
    gl.uniform1i(objectUniforms.objectTexture, 0);
    gl.uniform2f(objectUniforms.objectCenter, objectCenterClipX, objectCenterClipY);
    gl.uniform2f(objectUniforms.objectScale, objectScaleClipX, objectScaleClipY);
    gl.uniform2f(
      objectUniforms.pressPointA,
      primaryPress.contact.x,
      primaryPress.contact.y,
    );
    gl.uniform2f(
      objectUniforms.pressPointB,
      secondaryPress.contact.x,
      secondaryPress.contact.y,
    );
    gl.uniform1f(objectUniforms.pressAmountA, primaryPress.amount);
    gl.uniform1f(objectUniforms.pressAmountB, secondaryPress.amount);
    gl.uniform1f(objectUniforms.pinchAmount, pinchAmount);
    gl.uniform2f(objectUniforms.pinchAxis, pinchAxisX, pinchAxisY);
    gl.uniform2f(
      objectUniforms.hoverPoint,
      interaction.hoverPoint.x,
      interaction.hoverPoint.y,
    );
    gl.uniform1f(objectUniforms.hoverAmount, interaction.hover);
    gl.uniform1f(objectUniforms.wobble, interaction.wobble);
    gl.uniform1f(objectUniforms.reduceMotion, reduceMotion ? 1 : 0);
    gl.uniform1f(objectUniforms.time, elapsedSeconds);
    gl.bindVertexArray(objectVao);
    gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  };

  const dispose = () => {
    gl.deleteTexture(backgroundTexture);
    gl.deleteTexture(objectTexture);
    gl.deleteBuffer(vertexBuffer);
    gl.deleteBuffer(indexBuffer);
    gl.deleteVertexArray(backgroundVao);
    gl.deleteVertexArray(objectVao);
    gl.deleteProgram(backgroundProgram);
    gl.deleteProgram(objectProgram);
  };

  return {
    dispose,
    getLayout: () => layout,
    render,
    resize,
  };
};
