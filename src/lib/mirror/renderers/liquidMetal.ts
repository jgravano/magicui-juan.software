type CreateLiquidMetalRendererPayload = {
  gl: WebGL2RenderingContext;
};

type RenderLiquidMetalPayload = {
  video: HTMLVideoElement | null;
  elapsedSeconds: number;
  stage: number;
  motionMean: number;
  motionPeak: number;
  motionEnergy: number;
  meltProgress: number;
  meltOffsetY: number;
  mouseUvX: number;
  mouseUvY: number;
  mouseStrength: number;
  interactionImpacts: Float32Array;
  interactionImpactCount: number;
  luminanceCanvas: HTMLCanvasElement | null;
  motionCanvas: HTMLCanvasElement | null;
};

export type LiquidMetalRenderer = {
  resize: () => void;
  clear: () => void;
  render: (payload: RenderLiquidMetalPayload) => number;
  dispose: () => void;
};

const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

const int MAX_IMPACTS = 8;

uniform sampler2D u_video;
uniform sampler2D u_luma;
uniform sampler2D u_motion;
uniform float u_hasVideo;
uniform vec2 u_resolution;
uniform vec2 u_videoResolution;
uniform float u_time;
uniform float u_motionMean;
uniform float u_motionPeak;
uniform float u_motionEnergy;
uniform float u_stage;
uniform float u_melt;
uniform float u_meltOffsetY;
uniform vec3 u_mouseLight;
uniform int u_impactCount;
uniform vec4 u_impacts[MAX_IMPACTS];

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

vec2 coverUv(vec2 uv) {
  return clamp(vec2(1.0 - uv.x, uv.y), vec2(0.001), vec2(0.999));
}

float sdRoundedBox(vec2 point, vec2 halfSize, float radius) {
  vec2 q = abs(point) - halfSize + vec2(radius);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

vec3 sampleVideo(vec2 uv) {
  return texture(u_video, coverUv(clamp(uv, vec2(0.0), vec2(1.0)))).rgb;
}

vec3 sampleVideoBlur(vec2 uv, float radius) {
  vec2 offset = vec2(radius) / max(u_videoResolution, vec2(1.0));
  return sampleVideo(uv) * 0.6
    + sampleVideo(uv + vec2(offset.x, 0.0)) * 0.1
    + sampleVideo(uv - vec2(offset.x, 0.0)) * 0.1
    + sampleVideo(uv + vec2(0.0, offset.y)) * 0.1
    + sampleVideo(uv - vec2(0.0, offset.y)) * 0.1;
}

// Finite, oblique sources in reflection space. Their shapes are distorted by
// the surface normal, including the shallow folds and touch displacement.
vec3 reflectedLights(vec3 ray) {
  float front = smoothstep(-0.55, 0.55, ray.z);
  float windowAxis = ray.y - 0.64 + ray.x * 0.16;
  float window = exp(-pow(windowAxis / 0.24, 2.0))
    * exp(-pow((ray.x + 0.28) / 0.68, 2.0));
  float side = exp(-pow((ray.x + 0.78 + ray.y * 0.14) / 0.20, 2.0))
    * exp(-pow((ray.y - 0.1) / 0.62, 2.0));
  // A narrow colored source: warm, violet and cyan parts of the same light.
  // Color belongs to the reflected source, not a film over the camera image.
  float ribbonAxis = ray.y + 0.16 - ray.x * 0.22;
  float ribbonEnvelope = exp(-pow((ray.x - 0.24) / 0.49, 2.0)) * front;
  vec3 ribbon = vec3(0.0);
  ribbon += vec3(0.72, 0.24, 0.065) * exp(-pow((ribbonAxis + 0.058) / 0.043, 2.0));
  ribbon += vec3(0.32, 0.12, 0.60) * exp(-pow(ribbonAxis / 0.045, 2.0));
  ribbon += vec3(0.10, 0.53, 0.68) * exp(-pow((ribbonAxis - 0.058) / 0.047, 2.0));
  return vec3(0.64, 0.67, 0.71) * window
    + vec3(0.45, 0.48, 0.52) * side + ribbon * ribbonEnvelope;
}

vec3 studioEnvironment(vec3 ray) {
  float ceiling = smoothstep(-0.3, 0.9, ray.y);
  vec3 room = mix(vec3(0.018, 0.019, 0.023), vec3(0.17, 0.185, 0.21), ceiling);
  float flag = exp(-pow((ray.y + 0.38 + ray.x * 0.12) / 0.16, 2.0));
  room *= 1.0 - flag * 0.65;
  return room;
}

vec3 displayChrome(vec3 linearColor) {
  // Gentle highlight shoulder, followed by display transfer. Camera inputs
  // are decoded before compositing so lights do not bleach the midtones.
  vec3 mapped = linearColor / (vec3(1.0) + linearColor * 0.42);
  return pow(max(mapped, vec3(0.0)), vec3(1.0 / 2.2));
}

void main() {
  vec2 uv = v_uv;
  float reflectionBlend = saturate(u_stage - 1.0);
  float liquidBlend = saturate(u_stage - 2.0);
  float materialBlend = saturate(u_stage - 3.0);
  float interactionBlend = saturate(u_stage - 1.0);
  float melt = saturate(u_melt);
  float meltEase = melt * melt * (3.0 - 2.0 * melt);

  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 baseCentered = uv - vec2(0.5, 0.525);
  baseCentered.x *= aspect;
  vec2 centered = baseCentered;
  vec2 geometryWarp = vec2(0.0);
  float geometryPress = 0.0;
  vec2 geometryDrift = vec2(0.0);
  float geometryMelt = 0.0;

  for (int i = 0; i < MAX_IMPACTS; i += 1) {
    if (i >= u_impactCount) {
      break;
    }

    vec4 impact = u_impacts[i];
    vec2 impactCentered = impact.xy - vec2(0.5, 0.525);
    impactCentered.x *= aspect;

    float age = impact.z;
    float strength = impact.w;

    vec2 fromImpact = baseCentered - impactCentered;
    vec2 impactNorm = fromImpact / vec2(0.34, 0.17);
    float dist2 = dot(impactNorm, impactNorm);
    float dist = sqrt(max(dist2, 0.00001));
    vec2 radialDir = normalize(fromImpact + vec2(0.00001, -0.00001));

    float core = exp(-dist2 * 8.2) * exp(-age * 1.9) * strength * interactionBlend;
    float wave = sin(dist * 10.6 - age * 12.8) * exp(-dist * 2.2) * exp(-age * 2.1) * strength * interactionBlend;
    vec2 tangentDir = vec2(-radialDir.y, radialDir.x);
    float smear = sin(dist * 6.8 + age * 4.6) * exp(-dist * 1.9) * exp(-age * 1.6) * strength * interactionBlend;

    geometryWarp += (-radialDir) * core * 0.026;
    geometryWarp += radialDir * wave * 0.009;
    geometryWarp += tangentDir * smear * 0.004;
    geometryDrift += vec2(tangentDir.x * smear * 0.002, core * 0.009 - abs(wave) * 0.003);
    geometryPress += core * (1.0 + exp(-age * 2.0) * 0.42);
    geometryMelt += core + abs(wave) * 0.54;
  }

  geometryPress = clamp(geometryPress, 0.0, 1.0);
  geometryMelt = clamp(geometryMelt, 0.0, 1.0);
  geometryWarp += geometryDrift;
  geometryWarp += vec2(
    sin((baseCentered.y + u_time * 0.62) * 11.0) * meltEase * 0.006,
    0.0
  );
  geometryWarp = clamp(geometryWarp, vec2(-0.08, -0.08), vec2(0.08, 0.08));
  centered += geometryWarp + vec2(0.0, -geometryPress * 0.012 + u_meltOffsetY * 0.02);

  float responsiveHalfWidth = min(0.405, aspect * 0.415);
  vec2 halfSize = vec2(
    responsiveHalfWidth - geometryPress * 0.01 - meltEase * 0.018,
    0.128 + geometryPress * 0.006
  );
  float radius = halfSize.y;
  float widthMask = 1.0 - smoothstep(0.62, 1.08, abs(centered.x) / (halfSize.x + 0.035));
  float lowerMask = smoothstep(-0.01, 0.66, centered.y);
  float meltStretch = meltEase * (0.02 + geometryMelt * 0.095) + geometryPress * 0.014;
  vec2 sdfPoint = centered;
  sdfPoint.y -= lowerMask * widthMask * meltStretch;

  float sdf = sdRoundedBox(sdfPoint, halfSize, radius);
  float meltBottomMask =
    smoothstep(0.01, 0.72, sdfPoint.y) *
    (1.0 - smoothstep(0.36, 1.08, abs(sdfPoint.x) / (halfSize.x + 0.045)));
  float meltDripPhase = sdfPoint.x * 58.0 + u_time * 3.4 + sin(sdfPoint.x * 18.0) * 2.8;
  float meltDripLines = pow(saturate(0.5 + 0.5 * sin(meltDripPhase)), 3.2);
  float meltDrip = meltDripLines * meltBottomMask * meltEase * (0.06 + geometryMelt * 0.13);
  sdf += geometryMelt * 0.012 - geometryPress * 0.004;
  sdf -= meltDrip;
  float antialiasWidth = max(fwidth(sdf) * 1.35, 0.0012);
  float objectMask = (1.0 - smoothstep(-antialiasWidth, antialiasWidth, sdf));

  vec2 backdropUv = uv - vec2(0.5, 0.51);
  backdropUv.x *= aspect;
  float stageGlow = exp(-pow(backdropUv.x / 0.72, 2.0) - pow(backdropUv.y / 0.38, 2.0));
  float quietHorizon = exp(-pow((backdropUv.y + 0.015) * 5.2, 2.0));
  float edgeFalloff = smoothstep(0.22, 0.94, length(backdropUv * vec2(0.78, 1.25)));
  float backgroundGrain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  vec3 background = vec3(0.0065, 0.0075, 0.0095);
  background += vec3(0.018, 0.024, 0.034) * stageGlow;
  background += vec3(0.006, 0.009, 0.014) * quietHorizon;
  background *= 1.0 - edgeFalloff * 0.32;
  background += (backgroundGrain - 0.5) * 0.0032;

  float objectShadow = exp(
    -pow(baseCentered.x / (halfSize.x * 1.16), 2.0)
    -pow((baseCentered.y + halfSize.y * 1.34) / 0.055, 2.0)
  );
  background -= vec3(0.008, 0.009, 0.012) * objectShadow;

  vec2 shapeExtent = vec2(halfSize.x, halfSize.y + meltStretch * 0.7);
  vec2 local = sdfPoint / shapeExtent;
  float capsuleCore = max(halfSize.x - radius, 0.0);
  float capsuleAxisX = clamp(sdfPoint.x, -capsuleCore, capsuleCore);
  vec2 capsuleCoord = (sdfPoint - vec2(capsuleAxisX, 0.0)) / max(radius, 0.001);
  capsuleCoord = clamp(capsuleCoord, vec2(-1.0), vec2(1.0));
  float radial = dot(capsuleCoord, capsuleCoord);
  float dome = sqrt(max(0.0, 1.0 - radial));
  // A gently crowned center preserves a readable face; the rolled edges
  // turn sharply into the surrounding room. The same normal drives both.
  float bevel = smoothstep(0.42, 1.0, sqrt(radial));
  vec2 slope = capsuleCoord * mix(0.17, 1.5, bevel);
  slope.x += local.x * 0.075;
  // Broad, shallow folds make the metal optically imperfect without turning
  // the face into a funhouse image. Motion is slow and spatially coherent.
  float foldPhase = u_time * 0.18;
  float foldEnvelope = 0.40 + 0.60 * smoothstep(0.1, 0.92, abs(local.y));
  float dentHeight = (
    sin(local.x * 5.2 + local.y * 3.8 + foldPhase) * 0.0016
    + sin(local.x * 9.1 - local.y * 5.4 - foldPhase * 0.7) * 0.0007
  ) * foldEnvelope * interactionBlend;
  vec2 pointerDelta = (uv - u_mouseLight.xy) * vec2(aspect, 1.0);
  dentHeight -= exp(-dot(pointerDelta, pointerDelta) * 170.0)
    * 0.0028 * u_mouseLight.z * interactionBlend;
  for (int i = 0; i < MAX_IMPACTS; i += 1) {
    if (i >= u_impactCount) break;
    vec2 delta = (uv - u_impacts[i].xy) * vec2(aspect, 1.0);
    float distanceFromTap = length(delta);
    float age = u_impacts[i].z;
    float envelope = exp(-age * 3.4) * u_impacts[i].w * interactionBlend;
    float ring = distanceFromTap - age * 0.22;
    dentHeight += (cos(ring * 95.0) * exp(-ring * ring * 180.0)
      - 1.4 * exp(-dot(delta, delta) * 520.0)) * envelope * 0.0025;
  }
  // Screen-space height derivatives keep highlight and image displacement
  // coherent even when multiple ripples overlap.
  vec2 dentSlope = vec2(dFdx(dentHeight), dFdy(dentHeight)) * u_resolution.y;
  vec3 normal = normalize(vec3(slope - dentSlope, max(0.22, dome)));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  // Derivatives above execute for every fragment before the background exit.
  if (objectMask <= 0.0) {
    outColor = vec4(background, 1.0);
    return;
  }
  float ndotv = max(dot(normal, viewDir), 0.0);
  float fresnel = pow(1.0 - ndotv, 5.0);
  vec3 metalReflectance = mix(vec3(0.91, 0.92, 0.935), vec3(1.0), fresnel);
  vec3 reflectedView = reflect(-viewDir, normal);

  float sourceAspect = u_videoResolution.x / max(u_videoResolution.y, 1.0);
  // Equal scale in screen space: no horizontal face stretch on wide pills.
  // A finite reflection plane limits the camera to the forward-facing metal;
  // the studio takes over before its sampling coordinates reach the border.
  float cameraScale = 2.55;
  vec2 projection = sdfPoint * cameraScale;
  projection += normal.xy / max(normal.z, 0.4) * 0.055;
  projection -= dentSlope * 0.16;
  vec2 reflectionUv = vec2(0.5) + projection / vec2(sourceAspect, 1.0);
  vec2 border = min(reflectionUv, 1.0 - reflectionUv);
  float cameraFrustum = smoothstep(0.0, 0.09, min(border.x, border.y));
  float forwardFace = smoothstep(0.28, 0.82, ndotv);
  float reflectionWeight = u_hasVideo * cameraFrustum * forwardFace * 0.96;

  float activity = saturate(u_motionEnergy + u_motionMean + u_motionPeak
    + texture(u_motion, uv).r);
  float luma = texture(u_luma, uv).r;
  float roughness = 0.35 + bevel * 1.1 + activity * 0.08 + luma * 0.02;
  vec3 cameraColor = sampleVideoBlur(reflectionUv, roughness);
  cameraColor = pow(max(cameraColor, vec3(0.0)), vec3(2.2));
  // Chrome is neutral but still reflects the actual colors of the room.
  float cameraLuma = dot(cameraColor, vec3(0.2126, 0.7152, 0.0722));
  cameraColor = mix(vec3(cameraLuma), cameraColor, 0.90);

  vec3 environment = studioEnvironment(reflectedView);
  vec3 sourceLights = reflectedLights(reflectedView);
  vec3 phase1Color = (environment + sourceLights) * metalReflectance;
  vec3 phase2Color = phase1Color;
  vec3 phase3Color = mix(environment, cameraColor, reflectionWeight) * metalReflectance;
  // One reflected-light pass replaces the uniform outline, second softbox
  // overlay and cursor flashlight. Mid-surface color stays localized.
  vec3 phase4Color = phase3Color + sourceLights * metalReflectance
    * mix(1.0, 0.48, reflectionWeight);

  vec3 objectColor = mix(phase1Color, phase2Color, reflectionBlend);
  objectColor = mix(objectColor, phase3Color, liquidBlend);
  objectColor = mix(objectColor, phase4Color, materialBlend);
  objectColor = displayChrome(objectColor);


  vec3 color = mix(background, objectColor, objectMask);
  float outerGlow = (1.0 - smoothstep(0.0, 0.055, abs(sdf))) * (1.0 - objectMask);
  color += vec3(0.08, 0.11, 0.16) * outerGlow * 0.16;

  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

type LiquidMetalUniforms = {
  video: WebGLUniformLocation;
  luma: WebGLUniformLocation;
  motion: WebGLUniformLocation;
  hasVideo: WebGLUniformLocation;
  resolution: WebGLUniformLocation;
  videoResolution: WebGLUniformLocation;
  time: WebGLUniformLocation;
  motionMean: WebGLUniformLocation;
  motionPeak: WebGLUniformLocation;
  motionEnergy: WebGLUniformLocation;
  stage: WebGLUniformLocation;
  melt: WebGLUniformLocation;
  meltOffsetY: WebGLUniformLocation;
  mouseLight: WebGLUniformLocation;
  impactCount: WebGLUniformLocation;
  impacts: WebGLUniformLocation;
};

const compileShader = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader => {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Unable to create WebGL shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(`Liquid shader compile failed: ${message}`);
  }

  return shader;
};

const createProgram = (gl: WebGL2RenderingContext) => {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error("Unable to create WebGL program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown program linking error.";
    gl.deleteProgram(program);
    throw new Error(`Liquid shader link failed: ${message}`);
  }

  return program;
};

const createTexture = (gl: WebGL2RenderingContext) => {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("Unable to create WebGL texture.");
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
    new Uint8Array([0, 0, 0, 255]),
  );

  return texture;
};

const getUniforms = (gl: WebGL2RenderingContext, program: WebGLProgram): LiquidMetalUniforms => {
  const video = gl.getUniformLocation(program, "u_video");
  const luma = gl.getUniformLocation(program, "u_luma");
  const motion = gl.getUniformLocation(program, "u_motion");
  const hasVideo = gl.getUniformLocation(program, "u_hasVideo");
  const resolution = gl.getUniformLocation(program, "u_resolution");
  const videoResolution = gl.getUniformLocation(program, "u_videoResolution");
  const time = gl.getUniformLocation(program, "u_time");
  const motionMean = gl.getUniformLocation(program, "u_motionMean");
  const motionPeak = gl.getUniformLocation(program, "u_motionPeak");
  const motionEnergy = gl.getUniformLocation(program, "u_motionEnergy");
  const stage = gl.getUniformLocation(program, "u_stage");
  const melt = gl.getUniformLocation(program, "u_melt");
  const meltOffsetY = gl.getUniformLocation(program, "u_meltOffsetY");
  const mouseLight = gl.getUniformLocation(program, "u_mouseLight");
  const impactCount = gl.getUniformLocation(program, "u_impactCount");
  const impacts = gl.getUniformLocation(program, "u_impacts[0]");

  if (
    !video ||
    !luma ||
    !motion ||
    !hasVideo ||
    !resolution ||
    !videoResolution ||
    !time ||
    !motionMean ||
    !motionPeak ||
    !motionEnergy ||
    !stage ||
    !melt ||
    !meltOffsetY ||
    !mouseLight ||
    !impactCount ||
    !impacts
  ) {
    throw new Error("Unable to locate required liquid shader uniforms.");
  }

  return {
    video,
    luma,
    motion,
    hasVideo,
    resolution,
    videoResolution,
    time,
    motionMean,
    motionPeak,
    motionEnergy,
    stage,
    melt,
    meltOffsetY,
    mouseLight,
    impactCount,
    impacts,
  };
};

const uploadCanvasTexture = (
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  source: HTMLCanvasElement | null,
) => {
  gl.bindTexture(gl.TEXTURE_2D, texture);

  if (!source || source.width <= 0 || source.height <= 0) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255]),
    );
    return;
  }

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
};

export const createLiquidMetalRenderer = (
  payload: CreateLiquidMetalRendererPayload,
): LiquidMetalRenderer => {
  const { gl } = payload;
  const program = createProgram(gl);
  const uniforms = getUniforms(gl, program);
  const positionLocation = gl.getAttribLocation(program, "a_position");

  if (positionLocation < 0) {
    throw new Error("Unable to locate liquid vertex attribute.");
  }

  const vao = gl.createVertexArray();
  const positionBuffer = gl.createBuffer();

  if (!vao || !positionBuffer) {
    throw new Error("Unable to allocate liquid geometry buffers.");
  }

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const videoTexture = createTexture(gl);
  const lumaTexture = createTexture(gl);
  const motionTexture = createTexture(gl);

  gl.useProgram(program);
  gl.uniform1i(uniforms.video, 0);
  gl.uniform1i(uniforms.luma, 1);
  gl.uniform1i(uniforms.motion, 2);
  gl.useProgram(null);

  gl.disable(gl.BLEND);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  return {
    resize: () => {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    },
    clear: () => {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    render: (renderPayload) => {
      const renderStart = performance.now();
      const {
        video,
        elapsedSeconds,
        stage,
        motionMean,
        motionPeak,
        motionEnergy,
        meltProgress,
        meltOffsetY,
        mouseUvX,
        mouseUvY,
        mouseStrength,
        interactionImpacts,
        interactionImpactCount,
        luminanceCanvas,
        motionCanvas,
      } = renderPayload;
      const hasVideo = Boolean(video && video.videoWidth > 0 && video.videoHeight > 0);

      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.useProgram(program);
      gl.bindVertexArray(vao);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, videoTexture);
      if (hasVideo && video) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      } else {
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          1,
          1,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          new Uint8Array([0, 0, 0, 255]),
        );
      }

      gl.activeTexture(gl.TEXTURE1);
      uploadCanvasTexture(gl, lumaTexture, luminanceCanvas);

      gl.activeTexture(gl.TEXTURE2);
      uploadCanvasTexture(gl, motionTexture, motionCanvas);

      gl.uniform2f(uniforms.resolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform1f(uniforms.hasVideo, hasVideo ? 1 : 0);
      gl.uniform2f(
        uniforms.videoResolution,
        hasVideo && video ? video.videoWidth : 1,
        hasVideo && video ? video.videoHeight : 1,
      );
      gl.uniform1f(uniforms.time, elapsedSeconds);
      gl.uniform1f(uniforms.stage, stage);
      gl.uniform1f(uniforms.motionMean, motionMean);
      gl.uniform1f(uniforms.motionPeak, motionPeak);
      gl.uniform1f(uniforms.motionEnergy, motionEnergy);
      gl.uniform1f(uniforms.melt, meltProgress);
      gl.uniform1f(uniforms.meltOffsetY, meltOffsetY);
      gl.uniform3f(uniforms.mouseLight, mouseUvX, mouseUvY, mouseStrength);
      gl.uniform1i(uniforms.impactCount, interactionImpactCount);
      gl.uniform4fv(uniforms.impacts, interactionImpacts);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.bindVertexArray(null);
      gl.useProgram(null);

      return performance.now() - renderStart;
    },
    dispose: () => {
      gl.deleteTexture(videoTexture);
      gl.deleteTexture(lumaTexture);
      gl.deleteTexture(motionTexture);
      gl.deleteBuffer(positionBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
};
