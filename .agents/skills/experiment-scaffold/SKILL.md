---
name: experiment-scaffold
description: Crear el scaffold de un nuevo experimento Canvas 2D siguiendo la arquitectura actual (route + controller + lib modular + catálogo).
disable-model-invocation: false
argument-hint: "[slug] [Title]"
allowed-tools: Bash, Read, Write, Glob
---

Use this skill to scaffold a new experiment route from the current architecture.

## Required outputs

1. Add new entry to `src/lib/experiments/catalog.ts`:
   - `slug`
   - `title`
   - `teaser`
   - `status`
   - `order`
   - `accent`
   - `cardStyle`
   - `tags`
2. Create route:
   - `src/app/<slug>/page.tsx`
3. Create scene/controller:
   - `src/components/experiments/<slug>/<Title>Canvas.tsx`
4. Create modular lib:
   - `src/lib/<slug>/types.ts`
   - `src/lib/<slug>/constants.ts`
   - `src/lib/<slug>/input.ts`
   - `src/lib/<slug>/simulation.ts`
   - `src/lib/<slug>/render.ts`
   - `src/lib/<slug>/utils.ts`
   - optional `audio.ts`

## Scaffold quality rules

- Keep controller thin; move logic to `lib/<slug>`.
- Include named constants for all non-trivial numbers.
- Keep functions small and single-purpose.
- Use `requestAnimationFrame` loop with explicit update order.
- Handle canvas resize + DPR properly.

## Final checks

1. Run `npm run build:fast`.
2. Confirm route appears in build output.
3. Provide short “how to continue” next steps (simulation first, polish later).
