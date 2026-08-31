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
uniform float uPressAmount;
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
  vec2 shadowCenter = vec2(
    uObjectCenter.x + uWobble * uObjectRadius.x * 0.035,
    uObjectCenter.y - uObjectRadius.y * (0.965 - compression * 0.018)
  );
  vec2 shadowRadius = vec2(
    uObjectRadius.x * (0.76 + compression * 0.07),
    uObjectRadius.y * (0.060 + compression * 0.006)
  );
  vec2 shadowPoint = (vUv - shadowCenter) / max(shadowRadius, vec2(0.0001));
  float shadowDistance = dot(shadowPoint, shadowPoint);
  float contactShadow = exp(-shadowDistance * 1.85) * 0.19;
  float ambientShadow = exp(-shadowDistance * 0.34) * 0.055;
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
uniform vec2 uPressPoint;
uniform float uPressAmount;
uniform float uWobble;
uniform float uReduceMotion;
uniform float uTime;

out vec2 vLocalPosition;
out vec2 vTextureUv;

void main() {
  vec2 position = aPosition;
  vec2 pressDelta = position - uPressPoint;
  float pressDistance = length(pressDelta);
  float core = exp(-pow(pressDistance / 0.39, 2.0) * 1.7);
  float ring = exp(-pow((pressDistance - 0.40) / 0.20, 2.0) * 1.8);
  float pointDistanceFromCenter = length(uPressPoint);
  vec2 directionTowardCenter = pointDistanceFromCenter > 0.08
    ? -uPressPoint / pointDistanceFromCenter
    : vec2(0.0);
  vec2 radialDirection = pressDistance > 0.001
    ? pressDelta / pressDistance
    : vec2(0.0);

  float edgeInfluence = smoothstep(0.12, 0.82, pointDistanceFromCenter);
  position += directionTowardCenter * uPressAmount * 0.25 * core * edgeInfluence;
  position -= radialDirection * uPressAmount * 0.066 * ring;

  float compression = max(uPressAmount, 0.0);
  position.x *= 1.0 + compression * 0.064;
  position.y *= 1.0 - compression * 0.048;

  float wobble = mix(uWobble, 0.0, uReduceMotion);
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
uniform vec2 uPressPoint;
uniform vec2 uHoverPoint;
uniform float uPressAmount;
uniform float uHoverAmount;

out vec4 outColor;

void main() {
  vec4 source = texture(uObjectTexture, vTextureUv);
  float radialDistance = length(vLocalPosition);
  float roundMask = 1.0 - smoothstep(0.982, 1.006, radialDistance);
  float baseMask = smoothstep(-0.995, -0.958, vLocalPosition.y);
  float alpha = roundMask * baseMask;

  vec2 pressDelta = vLocalPosition - uPressPoint;
  float pressDistance = length(pressDelta);
  float core = exp(-pow(pressDistance / 0.37, 2.0) * 1.85);
  float ring = exp(-pow((pressDistance - 0.39) / 0.16, 2.0) * 1.65);
  vec2 gradient = pressDelta / max(pressDistance, 0.025);
  vec2 lightDirection = normalize(vec2(-0.72, 0.69));
  float signedPressure = uPressAmount;
  float directionalShade = -dot(gradient, lightDirection) * ring * signedPressure * 0.18;
  float cavityShade = -core * max(signedPressure, 0.0) * 0.13;
  float reboundLight = core * max(-signedPressure, 0.0) * 0.085;

  vec2 hoverDelta = vLocalPosition - uHoverPoint;
  float hoverSheen = exp(-dot(hoverDelta, hoverDelta) / 0.085)
    * uHoverAmount * 0.018;

  vec3 color = source.rgb;
  float softRim = ring * max(signedPressure, 0.0) * 0.018;
  color *= 1.0 + directionalShade + cavityShade;
  color += vec3(1.0, 0.73, 0.24) * softRim;
  color += vec3(1.0, 0.72, 0.23) * (reboundLight + hoverSheen);

  outColor = vec4(color, alpha);
}
`;
