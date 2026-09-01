export const backgroundVertexShader = `#version 300 es
precision highp float;

out vec2 vUv;

void main() {
  vec2 position = vec2(
    gl_VertexID == 1 ? 3.0 : -1.0,
    gl_VertexID == 2 ? 3.0 : -1.0
  );
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const backgroundFragmentShader = `#version 300 es
precision highp float;

in vec2 vUv;

uniform sampler2D uBackground;
uniform float uAspect;
uniform vec2 uObjectCenter;
uniform vec2 uObjectRadius;
uniform vec2 uShadowOffset;
uniform vec2 uDragOffset;
uniform float uPressAmount;
uniform float uPinchAmount;
uniform float uPulseAmount;
uniform float uWobble;

out vec4 outColor;

vec2 coverUv(vec2 uv, float aspect) {
  if (aspect > 1.0) {
    uv.y = (uv.y - 0.5) / aspect + 0.5;
  } else {
    uv.x = (uv.x - 0.5) * aspect + 0.5;
  }

  return uv;
}

void main() {
  vec3 background = texture(uBackground, coverUv(vUv, uAspect)).rgb;
  float compression = max(uPressAmount, 0.0);
  float pinchLoad = abs(uPinchAmount);
  float dragDistance = length(uDragOffset);
  float lift = max(uDragOffset.y, 0.0);
  float grounding = max(-uDragOffset.y, 0.0);
  vec2 shadowCenter = vec2(
    uObjectCenter.x
      + uShadowOffset.x * uObjectRadius.x * 0.82
      + uWobble * uObjectRadius.x * 0.035,
    uObjectCenter.y - uObjectRadius.y * (0.965 - compression * 0.018)
      + uShadowOffset.y * uObjectRadius.y * 0.46
  );
  vec2 shadowRadius = vec2(
    uObjectRadius.x * (
      0.76 + compression * 0.07 + pinchLoad * 0.045
        + dragDistance * 0.16 + abs(uPulseAmount) * 0.045
    ),
    uObjectRadius.y * (
      0.060 + compression * 0.006 + lift * 0.026 + dragDistance * 0.012
    )
  );
  vec2 shadowPoint = (vUv - shadowCenter) / max(shadowRadius, vec2(0.0001));
  float shadowDistance = dot(shadowPoint, shadowPoint);
  float shadowStrength = clamp(
    1.0 - lift * 1.15 - dragDistance * 0.22 + grounding * 0.34,
    0.62,
    1.14
  );
  float contactShadow = exp(-shadowDistance * 1.85) * 0.19 * shadowStrength;
  float ambientShadow = exp(-shadowDistance * 0.34) * 0.055 * mix(1.0, 0.82, lift);
  background *= 1.0 - contactShadow - ambientShadow;

  outColor = vec4(background, 1.0);
}
`;

export const objectVertexShader = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec2 aTextureUv;

uniform vec2 uObjectCenter;
uniform vec2 uObjectScale;
uniform vec2 uPressPointA;
uniform vec2 uPressPointB;
uniform float uPressAmountA;
uniform float uPressAmountB;
uniform float uPinchAmount;
uniform vec2 uPinchAxis;
uniform vec2 uDragPoint;
uniform vec2 uDragOffset;
uniform vec2 uPulsePoint;
uniform float uPulseAmount;
uniform float uWobble;
uniform float uReduceMotion;
uniform float uTime;

out vec2 vLocalPosition;
out vec2 vTextureUv;

void applyPress(inout vec2 position, vec2 pressPoint, float pressAmount) {
  vec2 pressDelta = position - pressPoint;
  float pressDistance = length(pressDelta);
  float core = exp(-pow(pressDistance / 0.39, 2.0) * 1.7);
  float ring = exp(-pow((pressDistance - 0.40) / 0.20, 2.0) * 1.8);
  float pointDistanceFromCenter = length(pressPoint);
  vec2 directionTowardCenter = pointDistanceFromCenter > 0.08
    ? -pressPoint / pointDistanceFromCenter
    : vec2(0.0);
  vec2 radialDirection = pressDistance > 0.001
    ? pressDelta / pressDistance
    : vec2(0.0);
  vec2 surfaceDirection = length(position) > 0.001
    ? normalize(position)
    : vec2(0.0, 1.0);

  float edgeInfluence = smoothstep(0.12, 0.82, pointDistanceFromCenter);
  position += directionTowardCenter * pressAmount * 0.25 * core * edgeInfluence;
  position -= radialDirection * pressAmount * 0.028 * ring;
  position += surfaceDirection * pressAmount * 0.052 * ring;
}

void main() {
  vec2 position = aPosition;
  applyPress(position, uPressPointA, uPressAmountA);
  applyPress(position, uPressPointB, uPressAmountB);

  float pinchSqueeze = max(uPinchAmount, 0.0);
  float pinchStretch = max(-uPinchAmount, 0.0);
  float compression = max(max(uPressAmountA, uPressAmountB) - pinchSqueeze * 0.62, 0.0);
  position.x *= 1.0 + compression * 0.064;
  position.y *= 1.0 - compression * 0.048;

  vec2 pinchAxis = normalize(uPinchAxis);
  vec2 pinchPerpendicular = vec2(-pinchAxis.y, pinchAxis.x);
  float alongScale = 1.0 - pinchSqueeze * 0.21 + pinchStretch * 0.30;
  float acrossScale = 1.0 + pinchSqueeze * 0.15 - pinchStretch * 0.12;
  float alongPinch = dot(position, pinchAxis) * alongScale;
  float acrossPinch = dot(position, pinchPerpendicular) * acrossScale;
  position = pinchAxis * alongPinch + pinchPerpendicular * acrossPinch;

  vec2 dragDelta = position - uDragPoint;
  float dragDistance = length(dragDelta);
  float dragCore = exp(-dot(dragDelta, dragDelta) / 0.34);
  float dragShoulder = exp(-pow((dragDistance - 0.52) / 0.24, 2.0) * 1.35);
  float dragAmount = length(uDragOffset);
  position += uDragOffset * mix(0.22, 1.0, dragCore);
  vec2 draggedSurfaceDirection = length(position) > 0.001
    ? normalize(position)
    : vec2(0.0, 1.0);
  position += draggedSurfaceDirection * dragAmount * 0.040 * dragShoulder;

  float pulse = mix(uPulseAmount, 0.0, uReduceMotion);
  float pulseCore = exp(-dot(position - uPulsePoint, position - uPulsePoint) / 0.30);
  vec2 pulseSurfaceDirection = length(position) > 0.001
    ? normalize(position)
    : vec2(0.0, 1.0);
  position += pulseSurfaceDirection * pulse * (0.034 + pulseCore * 0.046);

  float wobble = mix(uWobble, 0.0, uReduceMotion);
  position.x *= 1.0 + wobble * 0.022;
  position.y *= 1.0 - wobble * 0.030;
  position.x += wobble * 0.064 * sin((position.y + 1.0) * 2.25);
  position.y -= wobble * 0.036 * sin((position.x + 0.35) * 2.65);

  float idle = mix(sin(uTime * 0.74) * 0.0025, 0.0, uReduceMotion);
  position.y += idle * (1.0 - position.y * position.y);

  vLocalPosition = aPosition;
  vTextureUv = aTextureUv;
  gl_Position = vec4(uObjectCenter + position * uObjectScale, 0.0, 1.0);
}
`;

export const objectFragmentShader = `#version 300 es
precision highp float;

in vec2 vLocalPosition;
in vec2 vTextureUv;

uniform sampler2D uObjectTexture;
uniform vec2 uPressPointA;
uniform vec2 uPressPointB;
uniform vec2 uHoverPoint;
uniform float uPressAmountA;
uniform float uPressAmountB;
uniform float uHoverAmount;
uniform float uPinchAmount;
uniform vec2 uPinchAxis;
uniform vec2 uDragPoint;
uniform vec2 uDragOffset;
uniform vec2 uPulsePoint;
uniform float uPulseAmount;

out vec4 outColor;

float pressureShade(vec2 localPosition, vec2 pressPoint, float pressAmount) {
  vec2 pressDelta = localPosition - pressPoint;
  float pressDistance = length(pressDelta);
  float core = exp(-pow(pressDistance / 0.37, 2.0) * 1.85);
  float ring = exp(-pow((pressDistance - 0.39) / 0.16, 2.0) * 1.65);
  vec2 gradient = pressDelta / max(pressDistance, 0.025);
  vec2 lightDirection = normalize(vec2(-0.72, 0.69));
  float directionalShade = -dot(gradient, lightDirection) * ring * pressAmount * 0.18;
  float cavityShade = -core * max(pressAmount, 0.0) * 0.13;
  return directionalShade + cavityShade;
}

float pressureGlow(vec2 localPosition, vec2 pressPoint, float pressAmount) {
  vec2 pressDelta = localPosition - pressPoint;
  float pressDistance = length(pressDelta);
  float core = exp(-pow(pressDistance / 0.37, 2.0) * 1.85);
  float ring = exp(-pow((pressDistance - 0.39) / 0.16, 2.0) * 1.65);
  float softRim = ring * max(pressAmount, 0.0) * 0.018;
  float reboundLight = core * max(-pressAmount, 0.0) * 0.085;
  return softRim + reboundLight;
}

void main() {
  vec4 source = texture(uObjectTexture, vTextureUv);
  float radialDistance = length(vLocalPosition);
  float roundMask = 1.0 - smoothstep(0.982, 1.006, radialDistance);
  float baseMask = smoothstep(-0.995, -0.958, vLocalPosition.y);
  float alpha = roundMask * baseMask;

  vec2 hoverDelta = vLocalPosition - uHoverPoint;
  float hoverSheen = exp(-dot(hoverDelta, hoverDelta) / 0.085)
    * uHoverAmount * 0.018;

  vec2 surfaceDirection = radialDistance > 0.001
    ? vLocalPosition / radialDistance
    : vec2(0.0, 1.0);
  vec2 pinchAxis = normalize(uPinchAxis);
  float axisAlignment = abs(dot(surfaceDirection, pinchAxis));
  float surfaceEdge = smoothstep(0.30, 0.94, radialDistance);
  float pinchSqueeze = max(uPinchAmount, 0.0);
  float pinchStretch = max(-uPinchAmount, 0.0);
  float tension = (
    pinchStretch * axisAlignment + pinchSqueeze * (1.0 - axisAlignment)
  ) * surfaceEdge;
  float compression = (
    pinchSqueeze * axisAlignment + pinchStretch * (1.0 - axisAlignment)
  ) * surfaceEdge;
  vec2 dragDelta = vLocalPosition - uDragPoint;
  float dragDistance = length(dragDelta);
  float dragBand = exp(-pow((dragDistance - 0.43) / 0.19, 2.0) * 1.45);
  float dragTension = length(uDragOffset) * dragBand;
  float pulseBand = exp(-pow((length(vLocalPosition - uPulsePoint) - 0.38) / 0.22, 2.0));
  vec2 lightDirection = normalize(vec2(-0.72, 0.69));
  float fineSpecular = pow(max(dot(surfaceDirection, lightDirection), 0.0), 7.0)
    * (tension + dragTension * 2.2);

  vec3 color = source.rgb;
  float sourceLuminance = dot(source.rgb, vec3(0.2126, 0.7152, 0.0722));
  float materialMask = smoothstep(0.08, 0.44, sourceLuminance);
  float shade = pressureShade(vLocalPosition, uPressPointA, uPressAmountA)
    + pressureShade(vLocalPosition, uPressPointB, uPressAmountB);
  float glow = pressureGlow(vLocalPosition, uPressPointA, uPressAmountA)
    + pressureGlow(vLocalPosition, uPressPointB, uPressAmountB);
  color *= 1.0 + shade;
  color *= 1.0 - materialMask * (compression * 0.034 + dragTension * 0.055);
  color += vec3(1.0, 0.73, 0.24) * glow;
  color += vec3(1.0, 0.72, 0.23) * hoverSheen;
  color += vec3(1.0, 0.79, 0.34) * materialMask * (
    tension * 0.032
      + dragTension * 0.11
      + fineSpecular * 0.042
      + max(uPulseAmount, 0.0) * pulseBand * 0.025
  );

  outColor = vec4(color, alpha);
}
`;
