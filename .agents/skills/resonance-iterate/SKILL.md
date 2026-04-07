---
name: resonance-iterate
description: Iterar Resonance con cambios pequeños y controlados, preservando arquitectura modular y explicando trade-offs.
disable-model-invocation: false
allowed-tools: Bash, Read, Write, Glob
---

Use this skill when the user asks to refine the `/resonance` experiment behavior, visuals, or audio.

## Workflow

1. Read these files first:
   - `src/components/experiments/resonance/ResonanceCanvas.tsx`
   - `src/lib/resonance/constants.ts`
   - `src/lib/resonance/simulation.ts`
   - `src/lib/resonance/render.ts`
   - `src/lib/resonance/audio.ts`
2. Restate the requested feel change in one sentence.
3. Prefer tuning constants before algorithm changes.
4. If algorithm changes are needed, keep module boundaries:
   - input
   - simulation
   - render
   - audio
   - controller
5. Make the smallest viable change set.
6. Run `npm run build:fast`.
7. Report:
   - what changed
   - why
   - how to test
   - which constants were tuned

## Guardrails

- Do not move high-frequency state into React state.
- Avoid introducing new libraries unless strictly necessary.
- Keep numbers semantic and centralized in `constants.ts`.
- If behavior is expressive (not physically exact), say it explicitly.

## Tuning-first shortcuts

- Stronger interaction: increase `PARTICLE_MAGNET_*` / `PULSE_*`.
- Faster recovery: increase `PARTICLE_RETURN_STRENGTH` / `PARTICLE_SNAPBACK_STRENGTH`.
- Softer cursor: reduce `CURSOR_GLOW_RADIUS_MULTIPLIER` / `CURSOR_TRAIL_MAX_LENGTH`.
- Denser field: reduce `PARTICLE_GRID_SPACING` and watch `PARTICLE_MAX_COUNT`.
