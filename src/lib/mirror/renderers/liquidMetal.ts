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
  float sourceAspect = u_videoResolution.x / max(u_videoResolution.y, 1.0);
  float targetAspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 mapped = uv;

  if (sourceAspect > targetAspect) {
    float scaleX = targetAspect / sourceAspect;
    mapped.x = (uv.x - 0.5) * scaleX + 0.5;
  } else {
    float scaleY = sourceAspect / targetAspect;
    mapped.y = (uv.y - 0.5) * scaleY + 0.5;
  }

  mapped.x = 1.0 - mapped.x;
  return clamp(mapped, vec2(0.001), vec2(0.999));
}

float sdRoundedBox(vec2 point, vec2 halfSize, float radius) {
  vec2 q = abs(point) - halfSize + vec2(radius);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

vec3 sampleVideo(vec2 uv) {
  return texture(u_video, coverUv(clamp(uv, vec2(0.0), vec2(1.0)))).rgb;
}

vec3 sampleVideoBlur(vec2 uv, float radius, vec2 axis) {
  vec2 texel = 1.0 / max(u_resolution, vec2(1.0));
  vec2 offset = axis * texel * radius;
  vec2 cross = vec2(offset.y, -offset.x);

  vec3 color = sampleVideo(uv) * 0.32;
  color += sampleVideo(uv + offset) * 0.16;
  color += sampleVideo(uv - offset) * 0.16;
  color += sampleVideo(uv + offset * 2.0) * 0.1;
  color += sampleVideo(uv - offset * 2.0) * 0.1;
  color += sampleVideo(uv + cross * 1.3) * 0.08;
  color += sampleVideo(uv - cross * 1.3) * 0.08;

  return color;
}

vec3 toneCompress(vec3 color) {
  vec3 linear = max(color - vec3(0.004), vec3(0.0));
  return (linear * (6.2 * linear + 0.5)) / (linear * (6.2 * linear + 1.7) + 0.06);
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
  vec2 baseCentered = uv - vec2(0.5, 0.53);
  baseCentered.x *= aspect;
  vec2 centered = baseCentered;
  vec2 geometryWarp = vec2(0.0);
  float geometryField = 0.0;
  float geometryPress = 0.0;
  vec2 geometryDrift = vec2(0.0);
  float geometryMelt = 0.0;

  for (int i = 0; i < MAX_IMPACTS; i += 1) {
    if (i >= u_impactCount) {
      break;
    }

    vec4 impact = u_impacts[i];
    vec2 impactCentered = impact.xy - vec2(0.5, 0.53);
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
    geometryField += core + abs(wave) * 0.34;
    geometryPress += core * (1.0 + exp(-age * 2.0) * 0.42);
    geometryMelt += core + abs(wave) * 0.54;
  }

  geometryField = clamp(geometryField, 0.0, 1.0);
  geometryPress = clamp(geometryPress, 0.0, 1.0);
  geometryMelt = clamp(geometryMelt, 0.0, 1.0);
  geometryWarp += geometryDrift;
  geometryWarp += vec2(
    sin((baseCentered.y + u_time * 0.62) * 11.0) * meltEase * 0.006,
    0.0
  );
  geometryWarp = clamp(geometryWarp, vec2(-0.08, -0.08), vec2(0.08, 0.08));
  centered += geometryWarp + vec2(0.0, -geometryPress * 0.012 + u_meltOffsetY * 0.02);

  vec2 halfSize = vec2(
    0.312 - geometryPress * 0.008 - meltEase * 0.02,
    0.092 + geometryPress * 0.004
  );
  float radius = 0.094 + geometryPress * 0.01;
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
  float objectMask = smoothstep(0.015, -0.015, sdf);

  vec3 background = vec3(0.018, 0.019, 0.022);
  float focus = smoothstep(0.92, 0.16, distance(uv, vec2(0.5, 0.54)));
  background += vec3(0.016, 0.018, 0.024) * focus;
  float shadow = exp(-pow(centered.x / 0.52, 2.0) - pow((centered.y + 0.105) / 0.13, 2.0));
  background -= vec3(0.035, 0.036, 0.04) * shadow * 0.22;

  vec2 shapeExtent = vec2(halfSize.x + radius, halfSize.y + radius + meltStretch * 0.7);
  vec2 local = sdfPoint / shapeExtent;
  vec2 normalCoord = clamp(local, vec2(-1.0), vec2(1.0));
  float radial = dot(normalCoord, normalCoord);
  float dome = sqrt(max(0.0, 1.0 - radial));
  vec3 normal = normalize(vec3(normalCoord.x * 1.28, normalCoord.y * 2.12, dome * 1.48));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.35);
  vec2 mouseCentered = u_mouseLight.xy - vec2(0.5, 0.53);
  mouseCentered.x *= aspect;
  vec2 mouseToSurface = mouseCentered - centered;
  vec2 mouseDeltaNorm = mouseToSurface / vec2(0.26, 0.13);
  float mouseFalloff = exp(-dot(mouseDeltaNorm, mouseDeltaNorm));
  float mouseIntensity = u_mouseLight.z * interactionBlend * pow(mouseFalloff, 0.66) * 2.55;
  vec3 mouseLightDir = normalize(vec3(mouseToSurface * vec2(2.8, 3.4), 0.86));
  float mouseSpec = pow(max(dot(reflect(-mouseLightDir, normal), viewDir), 0.0), 96.0);
  float mouseSpecBroad = pow(max(dot(reflect(-mouseLightDir, normal), viewDir), 0.0), 32.0);
  float mouseSheen = max(dot(normal, mouseLightDir), 0.0) * mouseIntensity;
  float mouseGrazing = smoothstep(0.12, 0.95, fresnel);

  vec3 reflectedView = reflect(-viewDir, normal);
  vec2 convexProjection = reflectedView.xy / max(0.2, reflectedView.z + 1.08);
  vec2 reflectionObjectUv = vec2(
    0.5 + convexProjection.x * 1.02 + normalCoord.x * 0.03,
    0.5 + convexProjection.y * 0.66 + normalCoord.y * 0.015
  );

  float lumaSignal = texture(u_luma, uv).r;
  float motionSignal = texture(u_motion, uv).r;
  float activity = saturate(
    u_motionEnergy * 0.7 + u_motionMean * 0.55 + u_motionPeak * 0.45 + motionSignal * 0.32
  );

  float flow1 = sin(local.x * 3.8 + local.y * 1.4 + u_time * 0.32);
  float flow2 = cos(local.y * 3.2 - local.x * 1.6 - u_time * 0.29);
  float flow3 = sin((local.x + local.y) * 2.9 + u_time * 0.21);
  float warpAmount = liquidBlend * (0.0006 + activity * 0.0019 + fresnel * 0.0014 + lumaSignal * 0.0008);
  vec2 liquidWarp = vec2(flow1 * 0.7 + flow3 * 0.3, flow2 * 0.68 - flow3 * 0.32) * warpAmount;
  vec2 meltFlowWarp = vec2(
    sin((local.y + u_time * 0.42) * 18.0 + local.x * 6.0) * (0.001 + meltEase * 0.0038),
    abs(sin((local.x * 9.0 + u_time * 0.96))) * (0.0007 + meltEase * 0.0052) - meltEase * 0.0016
  );
  vec2 impactWarp = vec2(0.0);
  float impactSoften = geometryPress * 0.26;
  float impactField = geometryField * 0.4;
  float rippleField = 0.0;
  float impactPress = geometryPress * 0.46;

  for (int i = 0; i < MAX_IMPACTS; i += 1) {
    if (i >= u_impactCount) {
      break;
    }

    vec4 impact = u_impacts[i];
    vec2 impactCentered = impact.xy - vec2(0.5, 0.53);
    impactCentered.x *= aspect;

    float age = impact.z;
    float strength = impact.w;

    vec2 fromImpact = centered - impactCentered;
    vec2 impactNorm = fromImpact / vec2(0.33, 0.15);
    float dist2 = dot(impactNorm, impactNorm);
    float dist = sqrt(max(dist2, 0.00001));
    vec2 radialDir = normalize(fromImpact + vec2(0.00001, -0.00001));

    float localEnvelope = exp(-dist2 * 9.2);
    float coreEnvelope = exp(-age * 2.9) * strength;
    float impactCore = localEnvelope * coreEnvelope * interactionBlend;

    float wave =
      sin(dist * 16.8 - age * 14.5) * exp(-dist * 3.0) * exp(-age * 3.0) * strength * interactionBlend;
    vec2 tangentDir = vec2(-radialDir.y, radialDir.x);
    float swirl =
      sin(dist * 8.6 + age * 6.2) * exp(-dist * 2.2) * exp(-age * 2.2) * strength * interactionBlend;

    impactWarp += radialDir * (-impactCore * 0.0021 + wave * 0.0011);
    impactWarp += tangentDir * swirl * 0.00095;
    impactSoften += impactCore * 0.92 + abs(wave) * 0.26;
    impactField += impactCore;
    impactPress += impactCore * (0.86 + fresnel * 0.24);

    float rippleRadius = age * 1.42;
    float rippleRing = exp(-pow((dist - rippleRadius) * 8.4, 2.0));
    float rippleEnvelope = exp(-age * 2.45) * strength;
    float ripple = rippleRing * rippleEnvelope * interactionBlend;

    impactWarp += radialDir * ripple * 0.00118;
    impactSoften += abs(ripple) * 0.34;
    rippleField += abs(ripple);
    impactPress += abs(ripple) * 0.34;
  }

  impactSoften = clamp(impactSoften, 0.0, 0.95);
  impactField = clamp(impactField, 0.0, 1.0);
  rippleField = clamp(rippleField, 0.0, 0.72);
  impactPress = clamp(impactPress, 0.0, 1.0);
  vec2 reflectionUv = reflectionObjectUv + liquidWarp + meltFlowWarp + impactWarp;

  vec3 reflectionSharp = sampleVideo(reflectionUv);
  float curvature = saturate(1.0 - dome);
  float roughness = clamp(
    0.05 + curvature * 0.16 + liquidBlend * 0.035 + activity * 0.028 + impactSoften * 0.88 + meltEase * 0.36,
    0.05,
    0.96
  );
  float blurRadius = mix(0.35, 7.2, roughness);
  vec3 reflectionBlurMid = sampleVideoBlur(reflectionUv, blurRadius * 0.74, normalize(vec2(1.0, 0.65)));
  vec3 reflectionBlurSoft = sampleVideoBlur(
    reflectionUv,
    blurRadius * 1.48,
    normalize(vec2(0.82, 1.0))
  );
  vec3 reflectionFiltered = mix(reflectionBlurMid, reflectionBlurSoft, roughness * 0.3);
  reflectionFiltered = mix(reflectionFiltered, reflectionSharp, 0.58 + (1.0 - roughness) * 0.18);

  float reflectionLum = dot(reflectionFiltered, vec3(0.2126, 0.7152, 0.0722));
  float reflectionCurve = smoothstep(0.02, 0.98, pow(reflectionLum, 0.76));
  vec3 reflectionChroma = reflectionFiltered - vec3(reflectionLum);
  vec3 reflectionColor = reflectionFiltered * (0.96 + reflectionCurve * 0.34);
  reflectionColor += reflectionChroma * 0.3;
  reflectionColor = mix(reflectionColor, vec3(reflectionLum), 0.04);
  float metalBandA = 0.5 + 0.5 * sin(local.y * 13.2 + local.x * 5.1 + u_time * 0.11);
  float metalBandB = 0.5 + 0.5 * cos(local.x * 8.6 - local.y * 3.2 - u_time * 0.07);
  float metalBand = clamp(0.3 + metalBandA * 0.46 + metalBandB * 0.24, 0.0, 1.0);
  vec3 reflectionMetalized = vec3(pow(reflectionLum, 0.84)) * mix(0.76, 1.22, metalBand);
  float ndotv = max(dot(normal, viewDir), 0.0);
  vec3 F0 = vec3(0.88, 0.9, 0.93);
  vec3 fresnelSpec = F0 + (1.0 - F0) * pow(1.0 - ndotv, 5.0);
  reflectionColor = mix(reflectionColor, reflectionMetalized, 0.06);

  float mercuryStress = clamp(impactPress * 0.78 + rippleField * 0.42 + meltEase * 0.72, 0.0, 1.0);
  float filmPhase =
    (1.0 - ndotv) * (7.0 + mercuryStress * 12.0) + u_time * 2.2 + local.x * 8.0 - local.y * 6.4;
  vec3 mercuryFilm = 0.5 + 0.5 * cos(vec3(0.0, 2.09, 4.18) + filmPhase);
  vec3 mercuryFilm2 = 0.5 + 0.5 * cos(vec3(1.3, 3.6, 5.9) + filmPhase * 1.72 + local.x * 6.2 - local.y * 4.4);
  vec3 mercuryTint = mix(vec3(0.82, 0.94, 1.18), mercuryFilm, 0.92);
  mercuryTint = mix(mercuryTint, mercuryFilm2, 0.55);
  float mercuryStrength = mercuryStress * (0.28 + fresnel * 0.34);
  reflectionColor = mix(
    reflectionColor,
    reflectionColor * (vec3(0.68) + mercuryTint * 0.74),
    clamp(mercuryStrength, 0.0, 0.62)
  );
  vec2 psychoDir = normalize(
    vec2(
      sin(local.y * 9.2 + u_time * 1.35),
      cos(local.x * 7.4 - u_time * 1.12)
    ) + vec2(0.001, -0.001)
  );
  float psychoSpread = meltEase * (0.0009 + mercuryStress * 0.0042);
  vec3 psychoSplit = vec3(
    sampleVideo(reflectionUv + psychoDir * psychoSpread).r,
    reflectionColor.g,
    sampleVideo(reflectionUv - psychoDir * psychoSpread).b
  );
  float psychoMix = clamp(meltEase * 0.3 + impactPress * 0.22, 0.0, 0.52);
  reflectionColor = mix(reflectionColor, psychoSplit, psychoMix);

  float centerReadability =
    exp(-pow(normalCoord.x * 0.95, 2.0) - pow((normalCoord.y + 0.02) * 1.35, 2.0));
  float angleReadability = smoothstep(0.08, 0.9, fresnel);
  float reflectionMask = clamp(0.38 + centerReadability * 0.22 + angleReadability * 0.18, 0.26, 0.82);
  float surfaceShading = mix(0.92, 1.06, smoothstep(0.74, -0.62, normalCoord.y));
  vec3 reflectionCarrier = reflectionColor * surfaceShading * reflectionMask;

  float flashlightCore = (mouseSpec * 1.35 + mouseSpecBroad * 0.62) * mouseIntensity;
  vec3 interactionHighlight = vec3(0.92, 0.96, 1.0) * flashlightCore * (0.2 + mouseGrazing * 0.88);
  vec3 interactionSheen = vec3(0.14, 0.16, 0.2) * mouseSheen * (0.4 + fresnel * 0.44);

  float shapeVignette = smoothstep(0.76, 1.02, length(normalCoord));
  float innerPresence = smoothstep(1.08, 0.4, length(normalCoord));
  vec3 metalBase = mix(vec3(0.08, 0.1, 0.14), vec3(0.26, 0.3, 0.38), innerPresence);

  float envT = smoothstep(-0.86, 0.86, reflectedView.y);
  vec3 envBottom = vec3(0.06, 0.08, 0.12);
  vec3 envTop = vec3(0.52, 0.58, 0.68);
  vec3 envMid = vec3(0.24, 0.28, 0.34);
  vec3 envColor = mix(envBottom, envTop, envT);
  envColor = mix(envColor, envMid, 0.28);
  float horizonBand = exp(-pow(reflectedView.y * 8.2, 2.0));
  envColor += vec3(0.08, 0.1, 0.13) * horizonBand;

  vec3 phase1Color = mix(metalBase, envColor, 0.52);
  phase1Color += fresnelSpec * 0.012;
  phase1Color *= 1.0 - shapeVignette * 0.12;

  float satinFlowA = 0.5 + 0.5 * sin(local.x * 10.0 + local.y * 3.0 + u_time * 0.08);
  float satinFlowB = 0.5 + 0.5 * cos(local.y * 8.0 - local.x * 2.2 - u_time * 0.06);
  float satinFlow = satinFlowA * 0.56 + satinFlowB * 0.44;
  vec3 coatTone = mix(
    vec3(0.4, 0.45, 0.54),
    vec3(0.26, 0.32, 0.4),
    smoothstep(0.68, -0.62, normalCoord.y)
  );

  vec3 phase2Color = mix(phase1Color, metalBase * 0.96 + coatTone * 0.12, 0.34);
  phase2Color *= mix(0.95, 1.03, satinFlow);
  phase2Color += fresnelSpec * 0.016;

  float reflectionWeight = 0.34 + reflectionMask * 0.2 + fresnel * 0.06;
  reflectionWeight += mouseIntensity * (0.18 + mouseSpecBroad * 0.34 + mouseSpec * 0.18);
  reflectionWeight *= 1.0 - impactPress * 0.2 - rippleField * 0.08 - meltEase * 0.18;
  reflectionWeight = clamp(reflectionWeight, 0.16, 0.95);

  vec3 phase3Color = phase2Color + reflectionCarrier * reflectionWeight;
  phase3Color += interactionHighlight * 1.12 + interactionSheen * 0.78;
  phase3Color = mix(phase3Color, phase2Color * 0.78 + reflectionCarrier * 0.46, impactPress * 0.62);
  phase3Color *= 1.0 - impactPress * 0.16;

  float clearcoat = (mouseSpec * 0.34 + mouseSpecBroad * 0.12) * mouseIntensity;
  vec3 phase4Color = mix(phase3Color, phase3Color + vec3(clearcoat), materialBlend * 0.5);
  phase4Color += fresnelSpec * (0.018 * materialBlend);

  vec3 objectColor = phase1Color;
  objectColor = mix(objectColor, phase2Color, reflectionBlend);
  objectColor = mix(objectColor, phase3Color, liquidBlend);
  objectColor = mix(objectColor, phase4Color, materialBlend);
  objectColor = mix(objectColor, toneCompress(objectColor), 0.18);
  objectColor *= 0.95;

  float rim = smoothstep(0.022, 0.0, abs(sdf));
  objectColor += vec3(0.76, 0.8, 0.86) * rim * (0.01 + fresnel * 0.018);

  vec3 color = mix(background, objectColor, objectMask);
  float outerGlow = smoothstep(0.06, 0.0, abs(sdf));
  color += vec3(0.024, 0.028, 0.036) * outerGlow * 0.2;

  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

type LiquidMetalUniforms = {
  video: WebGLUniformLocation;
  luma: WebGLUniformLocation;
  motion: WebGLUniformLocation;
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
