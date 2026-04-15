# Creative Systems Architecture

## Purpose

Define a reusable architecture for interactive experiments that inherit from each other instead of starting from zero.

## Architectural Pattern

Each live experiment should be composed from explicit stages:

1. `input providers`
2. `interpreters/adapters`
3. `simulation`
4. `renderers`
5. `scene/controller`

For camera-native experiences, the concrete pipeline is:

`camera -> segmentation -> segmentation refinement -> adapters -> particle/simulation -> renderer`

## Current Shared Foundation (`src/lib/creative`)

- `core/`
  - frame clock utilities
  - canvas resize/DPR/cover math
  - quality profiling
- `math.ts`
  - clamp/lerp/inverseLerp/random helpers
- `camera/`
  - webcam provider lifecycle
- `segmentation/`
  - person segmentation provider abstraction
  - mask refinement (temporal + spatial + hysteresis cleanup)
- `adapters/`
  - person-mask-to-target mapping (deterministic, mirror-projected, source-cover correct geometry, subject-only target emission)
  - video motion estimator
- `particles/`
  - reusable particle state + target-follow simulation with dynamic origin anchors
  - return/snapback/damping core inspired by Resonance motion language
  - no autonomous orbit/drift forces in body-fidelity modes
- `renderers/`
  - renderer typing contract

## Particle Engine Reuse Strategy

- Keep particle data and simulation generic (target-follow + inertia + decay).
- Keep styling and scene composition in experiment-local renderers.
- Experiments should configure behavior via constants, not branch-heavy logic.

This allows one engine to support multiple expressions:

- dense square fields (Resonance style)
- subject silhouettes (Mirror style)
- future flow-field or topology variants

## Camera + Segmentation Strategy

- camera provider handles media lifecycle and permission errors.
- segmentation provider is isolated behind a local interface.
- controller decides segmentation cadence by quality tier.
- refinement stage normalizes model output before adapters/renderers consume it.
- adapters translate model output into experiment-ready data structures.

This keeps model/provider decisions swappable without touching render logic.

## Renderer Separation

- Renderer modules are mode/experiment-specific.
- Renderers consume data and draw.
- Renderers do not own camera setup, segmentation, or state orchestration.

This separation enables parallel evolution of aesthetics without destabilizing system plumbing.

## Inheritance Rules For Future Experiments

- Reuse existing providers and adapters before adding new infra.
- Extract common behavior only when a second use-case appears.
- Keep frame pipelines explicit in controllers.
- Prefer named constants over inline tuning literals.
- Avoid moving per-frame state into React state.

## Relationship With Resonance

Resonance remains intact as a complete experiment.
Mirror inherits controller discipline and utility philosophy, while adding camera/segmentation architecture for subsequent projects.

## Current Product Focus

- `/mirror` currently prioritizes a single WebGL2 liquid mode in product flow.
- particle systems remain in repository as paused lineage assets (not deleted, not active by default).
- this focus allows deeper quality iteration on one mode before re-expanding to multi-mode experiences.
