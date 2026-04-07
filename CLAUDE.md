# Project: juan.software (Experiments Edition)

This repository is currently focused on interactive experiments, not the old v1/v2 portfolio codebase.

## Current Product Shape

- Home (`/`) is an experiments rail (horizontal scroll, large cards, eclectic card styling).
- Live experiment: `/resonance`.
- Placeholder routes: `/alma`, `/umbral`.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Canvas 2D for visuals
- Tone.js for reactive audio

## Source Structure

```text
src/
  app/
    layout.tsx
    page.tsx                # experiments home
    resonance/page.tsx
    alma/page.tsx           # placeholder
    umbral/page.tsx         # placeholder
    globals.css
  components/
    experiments/
      resonance/
        ResonanceCanvas.tsx # scene/controller (loop orchestration)
  lib/
    experiments/
      catalog.ts            # data-driven experiment list for home
    resonance/
      types.ts
      constants.ts
      createParticles.ts
      input.ts
      simulation.ts
      render.ts
      audio.ts
      utils.ts
docs/
  experiments/
    ARCHITECTURE.md         # home + system architecture
    RESONANCE.md            # detailed technical walkthrough
```

## Engineering Intent

- Keep architecture explicit and understandable.
- Prefer small modules with single responsibility.
- Keep important numbers in `constants.ts` with semantic names.
- Avoid premature abstractions and unnecessary dependencies.
- Expressive behavior is preferred over physically perfect simulation.

## Resonance Frame Pipeline

Order per frame in `ResonanceCanvas`:

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

This order is intentional and should remain stable unless there is a strong reason to change it.

## Working Rules For Future Agents

- Do not move high-frequency simulation state into React state.
- Keep per-frame mutable state imperatively in the controller/systems.
- Preserve the separation:
  - input system
  - simulation system
  - render system
  - audio system
  - scene/controller
- If changing feel, tune constants first before rewriting algorithms.
- Keep home data-driven from `src/lib/experiments/catalog.ts`.

## Commands

- `npm run dev` — local development
- `npm run build:fast` — quick production build
- `npm run build` — full build
- `npm run lint` — lint

## Notes

- `AGENTS.md` intentionally mirrors this file so different coding agents get consistent context.
