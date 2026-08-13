export type ParticleWorldRenderer = {
  canvas: HTMLCanvasElement;
  ready: boolean;
  errorMessage: string | null;
  resize: (width: number, height: number) => void;
  render: (
    source: HTMLCanvasElement,
    personMask: HTMLCanvasElement,
    timestampMs: number,
  ) => number;
  dispose: () => void;
};

const VERTEX_SHADER = `#version 300 es
precision highp float;

out vec2 vUv;

void main() {
  vec2 corner = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = corner;
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uFrame;
uniform sampler2D uPreviousFrame;
uniform sampler2D uPersonMask;
uniform vec2 uResolution;
uniform float uTime;

in vec2 vUv;
out vec4 outColor;

float luminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

float hash21(vec2 value) {
  value = fract(value * vec2(123.34, 456.21));
  value += dot(value, value + 45.32);
  return fract(value.x * value.y);
}

mat2 rotate2d(float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine);
}

float segmentDistance(vec2 point, vec2 start, vec2 end) {
  vec2 segment = end - start;
  float denominator = max(dot(segment, segment), 0.00001);
  float amount = clamp(dot(point - start, segment) / denominator, 0.0, 1.0);
  return length(point - mix(start, end, amount));
}

void main() {
  vec2 uv = clamp(vUv, 0.0, 1.0);
  vec2 texel = 1.0 / uResolution;
  float cellSize = clamp(uResolution.x / 330.0, 1.85, 2.7);
  vec2 gridPosition = uv * uResolution / cellSize;
  vec2 cellId = floor(gridPosition);
  vec2 local = fract(gridPosition) - 0.5;
  vec2 sampleUv = (cellId + 0.5) * cellSize / uResolution;

  vec3 scene = texture(uFrame, sampleUv).rgb;
  vec3 previousScene = texture(uPreviousFrame, sampleUv).rgb;
  float maskAtParticle = smoothstep(0.2, 0.72, texture(uPersonMask, sampleUv).r);
  float silhouette = smoothstep(0.12, 0.82, texture(uPersonMask, uv).r);
  float light = luminance(scene);
  float leftLight = luminance(texture(uFrame, sampleUv - vec2(texel.x * 2.0, 0.0)).rgb);
  float rightLight = luminance(texture(uFrame, sampleUv + vec2(texel.x * 2.0, 0.0)).rgb);
  float bottomLight = luminance(texture(uFrame, sampleUv - vec2(0.0, texel.y * 2.0)).rgb);
  float topLight = luminance(texture(uFrame, sampleUv + vec2(0.0, texel.y * 2.0)).rgb);
  vec2 sceneGradient = vec2(rightLight - leftLight, topLight - bottomLight);
  float edge = clamp(length(sceneGradient) * 3.8, 0.0, 1.0);
  float motion = smoothstep(0.018, 0.19, length(scene - previousScene));
  float seed = hash21(cellId);
  float structure = clamp(light * 0.64 + edge * 1.72, 0.0, 1.0);
  vec2 jitter = (vec2(hash21(cellId + 17.3), hash21(cellId + 49.8)) - 0.5) * 0.48;
  float angle = seed * 6.28318;
  vec2 fallbackDirection = vec2(cos(angle), sin(angle));
  vec2 gradientDirection = length(sceneGradient) > 0.002
    ? normalize(sceneGradient)
    : fallbackDirection;
  float turbulence = sin(angle * 3.6 + uTime * 8.2) * 0.1;
  vec2 tangent = vec2(-gradientDirection.y, gradientDirection.x);
  vec2 displacement =
    gradientDirection * motion * (0.14 + seed * 0.24) +
    tangent * motion * turbulence;
  vec2 origin = jitter;
  vec2 position = origin + displacement;

  float twinkleWave = sin(uTime * 0.45 + seed * 31.0) * 0.5 + 0.5;
  float twinkle = mix(0.72, 1.16, twinkleWave);
  float radius = mix(0.15, 0.31, seed) *
    mix(0.94, 1.2, structure) *
    (1.0 + motion * 0.74) *
    mix(1.0, 1.2, twinkleWave);
  float particleDistance = length(local - position);
  float particle = 1.0 - smoothstep(radius * 0.48, radius, particleDistance);
  float halo = (1.0 - smoothstep(radius, min(0.5, radius + 0.09), particleDistance)) * 0.08;

  float trailDistance = segmentDistance(local, origin, position);
  float trail = (1.0 - smoothstep(0.025, 0.085, trailDistance)) *
    motion *
    smoothstep(0.025, 0.12, length(displacement));
  float particleAlpha = mix(0.24, 0.6, seed) *
    mix(0.72, 1.0, structure) *
    twinkle *
    (1.0 + motion * 0.65) *
    maskAtParticle;

  vec3 particleColor = mix(vec3(0.52, 0.62, 0.9), vec3(0.84, 0.9, 1.0), structure);
  particleColor = mix(particleColor, scene, 0.055);
  vec3 color = particleColor * particle * particleAlpha * 1.48;
  color += vec3(0.54, 0.66, 1.0) * trail * 0.2;
  color += particleColor * halo * particleAlpha;

  float breath = sin(uTime * 0.22) * 0.5 + 0.5;
  vec2 glowCenter = vec2(
    0.5 + sin(uTime * 0.19) * 0.042,
    0.5 + cos(uTime * 0.14) * 0.042
  );
  float glowRadius = mix(0.56, 0.66, breath);
  float backgroundGlow = 1.0 - smoothstep(0.0, glowRadius, length(uv - glowCenter));
  backgroundGlow *= backgroundGlow;
  float vignette = smoothstep(0.82, 0.25, length(uv - 0.5));
  vec3 voidColor = vec3(0.0196);
  voidColor += vec3(0.294, 0.384, 0.627) * backgroundGlow * 0.16;
  voidColor *= mix(0.64, 1.0, vignette);
  float grain = hash21(floor(gl_FragCoord.xy) + floor(uTime * 7.0) * 19.0) - 0.5;
  vec3 portalBlack = vec3(0.0015, 0.002, 0.004);
  color = portalBlack + voidColor * silhouette + color + grain * 0.018 * silhouette;
  color = max(color, 0.0);

  outColor = vec4(color, 1.0);
}
`;

const compileShader = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create particle shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Particle shader compilation failed.";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
};

const createProgram = (gl: WebGL2RenderingContext) => {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create particle program.");

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Particle shader linking failed.";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
};

const createVideoTexture = (gl: WebGL2RenderingContext) => {
  const texture = gl.createTexture();
  if (!texture) throw new Error("Unable to create particle texture.");

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
};

export const createParticleWorldRenderer = (): ParticleWorldRenderer => {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
  });

  const renderer: ParticleWorldRenderer = {
    canvas,
    ready: false,
    errorMessage: null,
    resize: () => undefined,
    render: () => 0,
    dispose: () => undefined,
  };

  if (!gl) {
    renderer.errorMessage = "WebGL2 is required for The Other Side.";
    return renderer;
  }

  try {
    const program = createProgram(gl);
    const vertexArray = gl.createVertexArray();
    if (!vertexArray) throw new Error("Unable to create particle geometry.");

    let currentTexture = createVideoTexture(gl);
    let previousTexture = createVideoTexture(gl);
    const personMaskTexture = createVideoTexture(gl);
    let hasPreviousFrame = false;
    const resolutionLocation = gl.getUniformLocation(program, "uResolution");
    const timeLocation = gl.getUniformLocation(program, "uTime");

    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, "uFrame"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "uPreviousFrame"), 1);
    gl.uniform1i(gl.getUniformLocation(program, "uPersonMask"), 2);
    gl.bindVertexArray(vertexArray);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);

    renderer.ready = true;
    renderer.resize = (width, height) => {
      const nextWidth = Math.max(1, Math.round(width));
      const nextHeight = Math.max(1, Math.round(height));
      if (canvas.width === nextWidth && canvas.height === nextHeight) return;
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      gl.viewport(0, 0, nextWidth, nextHeight);
      hasPreviousFrame = false;
    };
    renderer.render = (source, personMask, timestampMs) => {
      if (
        !renderer.ready ||
        source.width <= 1 ||
        source.height <= 1 ||
        personMask.width <= 1 ||
        personMask.height <= 1
      ) {
        return 0;
      }
      const startedMs = performance.now();

      gl.useProgram(program);
      gl.bindVertexArray(vertexArray);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, currentTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGB,
        gl.RGB,
        gl.UNSIGNED_BYTE,
        source,
      );

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, previousTexture);
      if (!hasPreviousFrame) {
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGB,
          gl.RGB,
          gl.UNSIGNED_BYTE,
          source,
        );
        hasPreviousFrame = true;
      }

      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, personMaskTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGB,
        gl.RGB,
        gl.UNSIGNED_BYTE,
        personMask,
      );

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, timestampMs / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      [currentTexture, previousTexture] = [previousTexture, currentTexture];
      return performance.now() - startedMs;
    };
    renderer.dispose = () => {
      renderer.ready = false;
      gl.deleteTexture(currentTexture);
      gl.deleteTexture(previousTexture);
      gl.deleteTexture(personMaskTexture);
      gl.deleteVertexArray(vertexArray);
      gl.deleteProgram(program);
    };
  } catch (error) {
    renderer.errorMessage =
      error instanceof Error ? error.message : "Unable to initialize The Other Side.";
  }

  return renderer;
};
