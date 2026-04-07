---
name: experiments-home
description: Iterar la home de experimentos manteniendo navegación clara, diseño curado y escalabilidad desde catálogo.
disable-model-invocation: false
allowed-tools: Bash, Read, Write, Glob
---

Use this skill for changes to `/` (experiments home).

## Read first

- `src/app/page.tsx`
- `src/lib/experiments/catalog.ts`
- `src/app/globals.css`

## Core principles

- Home is a curated index, not a portfolio landing.
- Keep copy minimal.
- Preserve data-driven rendering from catalog.
- Keep rail behavior clear (discoverability of horizontal scroll).
- Allow per-card identity via `cardStyle` and `accent`.

## Implementation checklist

1. If adding/removing experiments, modify catalog only.
2. If changing card composition, update `src/app/page.tsx` without hardcoding individual experiments.
3. If changing look, implement in `globals.css` using stable class names and `data-card-style`.
4. Preserve keyboard accessibility (`focus-visible` states).
5. Keep mobile and desktop behavior intentionally different where needed.

## Visual quality guardrails

- Avoid generic UI patterns.
- Avoid noisy text blocks.
- Prefer strong hierarchy and atmospheric background layers.
- Keep transitions subtle and intentional.

## Validate

1. Run `npm run build:fast`.
2. Confirm `/` still routes to existing experiment pages.
3. Report exactly what changed in structure vs styling.
