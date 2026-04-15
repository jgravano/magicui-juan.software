# Resonance Technical Walkthrough

This is the technical reference for the current `Resonance` experiment (`/resonance`).

## 1) What Resonance Is

A full-screen Canvas 2D interactive field where:

- pointer movement magnetizes a dense particle block
- click emits a pulse that expels/deforms particles
- particles gradually recover toward an equilibrium shape
- ambient audio reacts to movement and click gestures

The simulation is expressive by design, not physically strict.

## 2) Files and Responsibilities

## Scene / orchestration

- `src/components/experiments/resonance/ResonanceCanvas.tsx`
  - creates canvas context
  - handles resize and DPR
  - creates core states (`dimensions`, `frameClock`, `inputState`, `cursorState`, `particles`, `pulses`, `audioState`)
  - runs frame loop and calls systems in order
  - manages lifecycle cleanup

## Data model

- `src/lib/resonance/types.ts`
  - all shared types (`Particle`, `Pulse`, `InputState`, etc.)

## Tuning

- `src/lib/resonance/constants.ts`
  - all named values for feel, visuals, physics, and audio

## Input

- `src/lib/resonance/input.ts`
  - pointer position
  - previous pointer
  - velocity and smoothed speed
  - click queue per frame

## Simulation

- `src/lib/resonance/simulation.ts`
  - frame clock
  - cursor spring simulation
  - particle forces and integration
  - pulse spawning and aging

## Rendering

- `src/lib/resonance/render.ts`
  - atmospheric background
  - particle trails and particles
  - composition overlays (top/bottom shading + grain)
  - custom cursor rendering

## Audio

- `src/lib/resonance/audio.ts`
  - Tone.js graph creation/disposal
  - browser gesture activation
  - continuous movement modulation
  - click transients

## Utils

- `src/lib/resonance/utils.ts`
  - math helpers (`clamp`, `lerp`, `inverseLerp`, `randomBetween`)
  - reexports from shared `src/lib/creative/math.ts` for cross-experiment reuse

## 3) Frame Execution Order

Each animation frame in `ResonanceCanvas`:

1. `advanceFrameClock`
2. `advanceInputState`
3. `updateResonanceAudio`
4. `spawnPulsesFromInput`
5. `advanceCursorState`
6. `advanceParticlesState`
7. `advancePulsesState`
8. `renderResonanceBackground`
9. `renderResonanceParticles`
10. `renderResonanceComposition`
11. `renderResonanceCursor`

## 4) Canvas Sizing and DPR

`resizeCanvas()` in `ResonanceCanvas.tsx` does:

- reads viewport size
- clamps `devicePixelRatio` (`MAX_DEVICE_PIXEL_RATIO`)
- sets internal pixel buffer:
  - `canvas.width = viewportWidth * dpr`
  - `canvas.height = viewportHeight * dpr`
- keeps CSS size in logical pixels
- applies `context.setTransform(dpr, 0, 0, dpr, 0, 0)` so draw calls stay in logical coordinates

Particles are rebuilt on resize to keep density/layout coherent.

## 5) Input Details

`advanceInputState` computes speed from pointer delta per frame:

- `delta = pointer - previousPointer`
- `instantaneousSpeed = distance(delta) / deltaSeconds`
- if movement is tiny, velocity decays smoothly
- `speed` is smoothed using an exponential blend:
  - `speedBlend = 1 - exp(-INPUT_SPEED_RESPONSE * dt)`
  - `speed = lerp(previousSpeed, instantaneousSpeed, speedBlend)`

Clicks are queued in `queuedClicks` and promoted to `frameClicks` once per frame.

## 6) Cursor Simulation

Cursor uses a damped spring toward real pointer coordinates:

- target = raw pointer position
- state = cursor position + cursor velocity
- per axis:
  - acceleration = displacement * stiffness - velocity * damping
  - velocity += acceleration * dt
  - position += velocity * dt

Opacity fades in/out based on inside/outside canvas.
Radius grows with pointer speed.

## 7) Particle Simulation

For each particle per frame:

1. Compute return vector toward `origin`.
2. Compute magnetic cursor force:
  - attraction in outer radius
  - repulsion inside dead zone near cursor
3. Add pulse forces if a pulse wavefront band intersects particle:
  - directional bonus
  - turbulence
  - swirl (to avoid perfectly symmetric blast)
4. Accumulate temporary `damage` from strong interactions.
5. Reduce return and friction based on damage (fracture effect).
6. Apply snapback beyond a displacement threshold.
7. Integrate velocity + position.
8. Clamp max speed.

This combination gives:

- responsive deformation
- temporary breakage feel
- gradual reassembly

## 8) Pulse Events (Click Shockwaves)

On click:

- create a pulse with `origin` at click point
- choose pulse direction:
  - click velocity direction if fast enough
  - deterministic pseudo-random fallback if not
- assign irregularity/turbulence phase from click id and time

Pulses age and self-remove when `ageSeconds >= lifeSeconds`.

## 9) Rendering Layers

Draw order is intentional:

1. Background base + glow + vignette
2. Particle trails (`lighter` blend)
3. Particle dots (alpha/size react to twinkle + displacement + damage)
4. Composition overlays:
  - top shade
  - bottom shade
  - subtle animated grain
5. Cursor glow + trail + spark + core

No visual pulse ring is drawn currently; click impact is conveyed through particle motion + audio.

## 10) Audio System

Audio is lazy-started after user gesture (`pointerdown` or `keydown`), because browsers require it.

Graph includes:

- low drone oscillator + high oscillator
- filtered pink noise "air" layer
- reverb space
- dedicated click synth through bandpass filter
- slow LFOs for breathing movement

Continuous modulation maps pointer behavior to timbre:

- speed -> more energy / openness
- x-position -> filter center / detune character
- y-position -> airy high content

Click events trigger short transients with pitch/filter/velocity mapped from click location + speed.

## 11) Why Imperative State (Not React State)

Per-frame simulation uses mutable objects for:

- lower overhead at 60fps
- deterministic update order
- no React scheduling noise

React only mounts/unmounts the scene and route UI.

## 12) Tuning Guide (Most Useful Knobs)

## More violent interaction

- increase:
  - `PARTICLE_MAGNET_PUSH_STRENGTH`
  - `PARTICLE_MAGNET_PULL_STRENGTH`
  - `PULSE_PUSH_STRENGTH`
  - `PULSE_SWIRL_STRENGTH`

## Faster recovery

- increase:
  - `PARTICLE_RETURN_STRENGTH`
  - `PARTICLE_SNAPBACK_STRENGTH`
- decrease:
  - `PARTICLE_DAMAGE_RETURN_REDUCTION`

## Longer fracture memory

- decrease `PARTICLE_DAMAGE_RECOVERY`
- increase `PARTICLE_DAMAGE_ACCUMULATION`

## More dense block

- decrease `PARTICLE_GRID_SPACING`
- increase `PARTICLE_MAX_COUNT` carefully

## More subtle cursor

- decrease:
  - `CURSOR_GLOW_RADIUS_MULTIPLIER`
  - `CURSOR_TRAIL_MAX_LENGTH`
  - `CURSOR_SPARK_RADIUS_MULTIPLIER`

## 13) Safe Refactor Rules

- Keep module boundaries.
- Keep frame order explicit in the controller.
- Keep all tuning values named in `constants.ts`.
- If adding a new behavior, prefer adding constants + a small pure function over inlining in frame loop.
