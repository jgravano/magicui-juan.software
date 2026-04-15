# Experiments Architecture

This document describes how the current experiments platform is organized and how to extend it safely.

## 1) Product Model

- `/` is the experiments home.
- Each experiment lives at `/<slug>`.
- Home is generated from a catalog (`src/lib/experiments/catalog.ts`).

The home should stay minimal: little copy, strong visual hierarchy, and clear navigation into each piece.

## 2) Home System

### Entry file

- `src/app/page.tsx`

### Data source

- `src/lib/experiments/catalog.ts`

### Key rules

- Cards are rendered by mapping over catalog entries.
- Ordering comes from `order`.
- Card visual identity is controlled by:
  - `accent`
  - `cardStyle` (applied as `data-card-style`)
- Do not hardcode experiment cards in JSX.

### CSS architecture

- `src/app/globals.css` contains home styles:
  - `.experiments-home`
  - `.experiments-rail`
  - `.experiment-panel`
  - `.experiment-panel[data-card-style="..."]`

## 3) Experiment Route Pattern

Each experiment should follow the same top-level pattern:

1. Add catalog entry in `src/lib/experiments/catalog.ts`.
2. Create route file `src/app/<slug>/page.tsx`.
3. If needed, create component under `src/components/experiments/<slug>/`.
4. Place systems under `src/lib/<slug>/`.
5. Reuse shared creative modules from `src/lib/creative/` before adding experiment-specific infra.

Keep route files thin. Put logic into `lib` and a controller component.

## 4) Resonance System Architecture (Reference Pattern)

Resonance uses a modular split:

- Input system: `src/lib/resonance/input.ts`
- Simulation system: `src/lib/resonance/simulation.ts`
- Render system: `src/lib/resonance/render.ts`
- Audio system: `src/lib/resonance/audio.ts`
- Scene/controller: `src/components/experiments/resonance/ResonanceCanvas.tsx`

All critical constants are centralized in:

- `src/lib/resonance/constants.ts`

## 5) Imperative State vs React State

For animation/simulation loops:

- Use imperative mutable objects for per-frame values (`particles`, `inputState`, `pulses`, etc.).
- Keep React state for static UI or route-level concerns only.

Reason: Avoid 60fps React re-render pressure and keep loop timing deterministic.

## 6) requestAnimationFrame Pipeline

In `ResonanceCanvas` the frame order is:

1. clock update
2. input update
3. audio update
4. pulse spawn
5. cursor simulation
6. particles simulation
7. pulse cleanup
8. background render
9. particle render
10. composition overlay
11. cursor render

This pipeline is intentional; preserve order unless there's a clear reason to alter behavior.

## 7) Adding the Next Experiment Checklist

1. Define concept and interaction goals in one sentence.
2. Add catalog entry (slug, teaser, status, order, accent, cardStyle).
3. Create basic route page and verify navigation from home.
4. Build minimal v1 loop:
  - full-screen canvas
  - resize + DPR handling
  - input capture
  - render baseline
5. Add expression layers incrementally:
  - simulation behavior
  - click events/pulses
  - visual polish
  - audio (gesture-gated)
6. Keep constants named and grouped.
7. Run build checks before merge.

## 8) Guardrails for Future Iterations

- Tune constants before rewriting systems.
- Avoid adding libraries unless they remove significant complexity.
- Keep functions focused and composable.
- Prefer explicit code over hidden abstraction.
- If introducing a refactor, keep system boundaries visible.

## 9) Shared Creative Systems (Post-Mirror)

Reusable infrastructure for camera-native and future experiments lives in:

- `src/lib/creative/core/`
- `src/lib/creative/camera/`
- `src/lib/creative/segmentation/`
- `src/lib/creative/adapters/`
- `src/lib/creative/particles/`
- `src/lib/creative/renderers/`

Experiments should compose those modules through a thin controller instead of coupling providers directly to rendering code.
