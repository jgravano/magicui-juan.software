#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_radius;
uniform float u_magnification;
uniform float u_edgeDistortion;

void main() {
  // Architecture scaffold only.
  // Final pass should sample dictionary texture and apply optical refraction.
  vec2 fragPx = vec2(v_uv.x * u_resolution.x, (1.0 - v_uv.y) * u_resolution.y);
  float distanceToLens = distance(fragPx, u_pointer);
  float mask = 1.0 - smoothstep(u_radius - 1.0, u_radius + 1.0, distanceToLens);

  // Temporary debug visualization.
  vec3 color = mix(vec3(0.0), vec3(0.7, 0.74, 0.8), mask * 0.12);
  outColor = vec4(color, mask * 0.2);
}
