"use client";

import { useEffect, useRef, useState } from "react";

import { clamp } from "@/lib/creative/math";
import {
  LUPA_LENS_SMOOTHING_LAMBDA,
  LUPA_MAX_DEVICE_PIXEL_RATIO,
} from "@/lib/lupa/constants";

const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uZoom;

void main() {
  vec2 uvTopLeft = vec2(vUv.x, 1.0 - vUv.y);
  vec2 fragPx = uvTopLeft * uResolution;
  vec2 fromCenterPx = fragPx - uMouse;

  float distancePx = length(fromCenterPx);

  // radiusNormRaw is kept unclamped for correct lens alpha outside bounds.
  float radiusNormRaw = distancePx / max(uRadius, 0.0001);
  float radiusNorm = clamp(radiusNormRaw, 0.0, 1.0);

  // Soft lens boundary.
  float lensMask = 1.0 - smoothstep(0.985, 1.02, radiusNormRaw);

  vec2 mouseUv = uMouse / uResolution;
  vec2 fromCenter = uvTopLeft - mouseUv;

  // Optical behavior: readable center, slightly more distortion at edges.
  float innerFalloff = smoothstep(0.24, 0.88, radiusNorm);
  float edgeWeight = innerFalloff * innerFalloff;

  float localZoom = mix(uZoom, max(1.0, uZoom * 0.9), edgeWeight * 0.85);
  vec2 magnifiedUv = mouseUv + fromCenter / max(localZoom, 0.001);

  vec2 radialDir = distancePx > 0.0001 ? fromCenterPx / distancePx : vec2(0.0, 0.0);
  vec2 lensUnit = fromCenterPx / max(uRadius, 0.0001);
  float bulgePixels = uRadius * 0.055 * edgeWeight;
  vec2 bulgeUvOffset = radialDir * (bulgePixels / uResolution);
  magnifiedUv += bulgeUvOffset;

  // Subtle liquid shear: slight tangential shift, stronger near lens edges.
  vec2 tangentDir = vec2(-radialDir.y, radialDir.x);
  float ripple = sin(lensUnit.x * 6.0 + lensUnit.y * 4.5);
  float liquidShear = 0.0024 * edgeWeight;
  magnifiedUv += tangentDir * ripple * liquidShear;

  // Slight chromatic dispersion so the glass feels denser, mainly on the rim.
  vec2 dispersionUv = radialDir * ((uRadius * 0.0082 * edgeWeight) / uResolution);
  vec2 uvR = clamp(magnifiedUv + dispersionUv, vec2(0.0), vec2(1.0));
  vec2 uvG = clamp(magnifiedUv, vec2(0.0), vec2(1.0));
  vec2 uvB = clamp(magnifiedUv - dispersionUv * 0.85, vec2(0.0), vec2(1.0));

  vec3 magnifiedColor = vec3(
    texture(uTexture, uvR).r,
    texture(uTexture, uvG).g,
    texture(uTexture, uvB).b
  );

  // Optical shading.
  float centerLift = (1.0 - smoothstep(0.0, 0.45, radiusNorm)) * 0.03;
  float rimDarken = smoothstep(0.65, 1.0, radiusNorm) * 0.08;
  magnifiedColor *= 1.0 + centerLift - rimDarken;

  // Material pass: specular + fresnel + internal glow cues.
  float radial = clamp(length(lensUnit), 0.0, 1.0);
  float domeZ = sqrt(max(0.0, 1.0 - radial * radial));
  vec3 surfaceNormal = normalize(vec3(lensUnit * vec2(0.92, 0.92), domeZ));

  vec3 lightDir = normalize(vec3(-0.46, -0.58, 0.67));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 fillLightDir = normalize(vec3(0.38, -0.16, 0.91));

  float specular = pow(max(dot(reflect(-lightDir, surfaceNormal), viewDir), 0.0), 52.0);
  float specularSoft = pow(max(dot(reflect(-lightDir, surfaceNormal), viewDir), 0.0), 19.0);
  float fillSpec = pow(max(dot(reflect(-fillLightDir, surfaceNormal), viewDir), 0.0), 26.0);
  float fresnel = pow(1.0 - max(surfaceNormal.z, 0.0), 2.1);

  float rimBand = smoothstep(0.70, 0.96, radiusNorm) * (1.0 - smoothstep(0.96, 1.0, radiusNorm));
  float streak = exp(-pow((lensUnit.x * 0.95 + lensUnit.y * 1.15 + 0.18) * 4.6, 2.0));
  float centerVeil = exp(-pow(radial * 1.9, 2.0));
  float internalReflection = pow(max(dot(surfaceNormal, fillLightDir), 0.0), 4.5) * (1.0 - radial * 0.55);
  float causticArc = exp(-pow((lensUnit.x * 1.2 - lensUnit.y * 0.7 - 0.22) * 5.2, 2.0));

  vec3 coolGlass = vec3(0.84, 0.90, 0.98);
  vec3 warmSpec = vec3(1.0, 0.99, 0.97);

  vec3 material =
    warmSpec * (specular * 0.095 + specularSoft * 0.032 + fillSpec * 0.022) +
    coolGlass * (
      fresnel * 0.038 +
      rimBand * 0.068 +
      streak * 0.024 +
      centerVeil * 0.012 +
      internalReflection * 0.020 +
      causticArc * 0.012
    );

  vec3 finalColor = clamp(magnifiedColor + material, 0.0, 1.0);
  outColor = vec4(finalColor, lensMask);
}
`;

type WebGLLensProps = {
  sourceCanvas: HTMLCanvasElement | null;
  radiusRatio: number;
  minRadiusPx: number;
  maxRadiusPx: number;
  zoom: number;
};

type UniformMap = {
  texture: WebGLUniformLocation;
  resolution: WebGLUniformLocation;
  mouse: WebGLUniformLocation;
  radius: WebGLUniformLocation;
  zoom: WebGLUniformLocation;
};

type ViewportState = {
  width: number;
  height: number;
  pixelRatio: number;
};

const readViewport = (): ViewportState => {
  const viewport = window.visualViewport;
  const width = Math.max(1, Math.round(viewport?.width ?? window.innerWidth));
  const height = Math.max(1, Math.round(viewport?.height ?? window.innerHeight));
  const pixelRatio = clamp(window.devicePixelRatio || 1, 1, LUPA_MAX_DEVICE_PIXEL_RATIO);

  return {
    width,
    height,
    pixelRatio,
  };
};

const compileShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("No se pudo crear shader para Lupa.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Error compilando shader.";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
};

const createProgram = (gl: WebGL2RenderingContext) => {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    throw new Error("No se pudo crear el programa WebGL.");
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Error enlazando programa WebGL.";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
};

const getUniform = (gl: WebGL2RenderingContext, program: WebGLProgram, name: string) => {
  const uniform = gl.getUniformLocation(program, name);

  if (!uniform) {
    throw new Error(`Uniform no encontrada: ${name}`);
  }

  return uniform;
};

const createUniformMap = (gl: WebGL2RenderingContext, program: WebGLProgram): UniformMap => ({
  texture: getUniform(gl, program, "uTexture"),
  resolution: getUniform(gl, program, "uResolution"),
  mouse: getUniform(gl, program, "uMouse"),
  radius: getUniform(gl, program, "uRadius"),
  zoom: getUniform(gl, program, "uZoom"),
});

const createTexture = (gl: WebGL2RenderingContext) => {
  const texture = gl.createTexture();

  if (!texture) {
    throw new Error("No se pudo crear textura WebGL.");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0]),
  );

  return texture;
};

export function WebGLLens(props: WebGLLensProps) {
  const { sourceCanvas, radiusRatio, minRadiusPx, maxRadiusPx, zoom } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(sourceCanvas);
  const radiusRatioRef = useRef(radiusRatio);
  const minRadiusRef = useRef(minRadiusPx);
  const maxRadiusRef = useRef(maxRadiusPx);
  const zoomRef = useRef(zoom);

  const targetMouseRef = useRef({ x: 0, y: 0 });
  const smoothMouseRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef<ViewportState>({ width: 1, height: 1, pixelRatio: 1 });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    sourceCanvasRef.current = sourceCanvas;
  }, [sourceCanvas]);

  useEffect(() => {
    radiusRatioRef.current = radiusRatio;
    minRadiusRef.current = minRadiusPx;
    maxRadiusRef.current = maxRadiusPx;
    zoomRef.current = zoom;
  }, [radiusRatio, minRadiusPx, maxRadiusPx, zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    setErrorMessage(null);

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      setErrorMessage("Esta lupa necesita WebGL2 para existir.");
      return;
    }

    let program: WebGLProgram;
    let uniforms: UniformMap;

    try {
      program = createProgram(gl);
      uniforms = createUniformMap(gl, program);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo iniciar WebGL.");
      return;
    }

    const positionLocation = gl.getAttribLocation(program, "aPosition");
    if (positionLocation < 0) {
      setErrorMessage("No se encontró el atributo aPosition.");
      gl.deleteProgram(program);
      return;
    }

    const vertexArray = gl.createVertexArray();
    const quadBuffer = gl.createBuffer();

    if (!vertexArray || !quadBuffer) {
      setErrorMessage("No se pudo crear geometría para la lente.");
      gl.deleteProgram(program);
      return;
    }

    gl.bindVertexArray(vertexArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    let texture: WebGLTexture;
    try {
      texture = createTexture(gl);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo crear textura.");
      gl.deleteBuffer(quadBuffer);
      gl.deleteVertexArray(vertexArray);
      gl.deleteProgram(program);
      return;
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(program);
    gl.uniform1i(uniforms.texture, 0);
    gl.useProgram(null);

    let uploadedCanvas: HTMLCanvasElement | null = null;
    let uploadedSignature = "";
    let isPointerInitialized = false;
    let previousTimestampMs = 0;

    const updateCanvasSize = () => {
      const viewport = readViewport();
      viewportRef.current = viewport;

      const nextWidth = Math.floor(viewport.width * viewport.pixelRatio);
      const nextHeight = Math.floor(viewport.height * viewport.pixelRatio);

      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        gl.viewport(0, 0, nextWidth, nextHeight);
      }

      if (!isPointerInitialized) {
        const centerX = nextWidth * 0.5;
        const centerY = nextHeight * 0.5;
        targetMouseRef.current.x = centerX;
        targetMouseRef.current.y = centerY;
        smoothMouseRef.current.x = centerX;
        smoothMouseRef.current.y = centerY;
        isPointerInitialized = true;
      } else {
        targetMouseRef.current.x = clamp(targetMouseRef.current.x, 0, nextWidth);
        targetMouseRef.current.y = clamp(targetMouseRef.current.y, 0, nextHeight);
      }
    };

    const toBufferSpace = (clientX: number, clientY: number) => {
      const viewport = viewportRef.current;
      return {
        x: clamp(clientX, 0, viewport.width) * viewport.pixelRatio,
        y: clamp(clientY, 0, viewport.height) * viewport.pixelRatio,
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      const nextMouse = toBufferSpace(event.clientX, event.clientY);
      targetMouseRef.current.x = nextMouse.x;
      targetMouseRef.current.y = nextMouse.y;
    };

    const uploadTextureIfNeeded = () => {
      const source = sourceCanvasRef.current;

      if (!source || source.width <= 0 || source.height <= 0) {
        return false;
      }

      const textureVersion = source.dataset.lupaTextureVersion ?? "0";
      const signature = `${source.width}x${source.height}:${textureVersion}`;
      const mustUpload = source !== uploadedCanvas || signature !== uploadedSignature;

      if (!mustUpload) {
        return true;
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

      uploadedCanvas = source;
      uploadedSignature = signature;
      return true;
    };

    const visualViewport = window.visualViewport;

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    window.addEventListener("orientationchange", updateCanvasSize);
    visualViewport?.addEventListener("resize", updateCanvasSize);
    visualViewport?.addEventListener("scroll", updateCanvasSize);
    window.addEventListener("pointermove", handlePointerMove);

    let animationFrameId = 0;

    const frame = (timestampMs: number) => {
      const rawDeltaSeconds = previousTimestampMs > 0 ? (timestampMs - previousTimestampMs) / 1000 : 1 / 60;
      const deltaSeconds = clamp(rawDeltaSeconds, 0, 0.1);
      previousTimestampMs = timestampMs;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (uploadTextureIfNeeded()) {
        const blend = 1 - Math.exp(-LUPA_LENS_SMOOTHING_LAMBDA * deltaSeconds);
        smoothMouseRef.current.x += (targetMouseRef.current.x - smoothMouseRef.current.x) * blend;
        smoothMouseRef.current.y += (targetMouseRef.current.y - smoothMouseRef.current.y) * blend;

        const viewport = viewportRef.current;
        const responsiveRadiusPx = Math.min(viewport.width, viewport.height) * radiusRatioRef.current;
        const clampedRadiusPx = clamp(responsiveRadiusPx, minRadiusRef.current, maxRadiusRef.current);

        gl.useProgram(program);
        gl.bindVertexArray(vertexArray);
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl.uniform2f(uniforms.mouse, smoothMouseRef.current.x, smoothMouseRef.current.y);
        gl.uniform1f(uniforms.radius, clampedRadiusPx * viewport.pixelRatio);
        gl.uniform1f(uniforms.zoom, zoomRef.current);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);
        gl.useProgram(null);
      }

      animationFrameId = window.requestAnimationFrame(frame);
    };

    animationFrameId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("orientationchange", updateCanvasSize);
      visualViewport?.removeEventListener("resize", updateCanvasSize);
      visualViewport?.removeEventListener("scroll", updateCanvasSize);
      window.removeEventListener("pointermove", handlePointerMove);
      gl.deleteTexture(texture);
      gl.deleteBuffer(quadBuffer);
      gl.deleteVertexArray(vertexArray);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="lupa-lens" aria-label="Magnifying lens overlay" />
      {errorMessage ? <p className="lupa-status">{errorMessage}</p> : null}
    </>
  );
}
