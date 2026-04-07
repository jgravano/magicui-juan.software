# Project: juan.software

Personal portfolio site with a hidden interactive experience.

## v1 — The Machine (master branch, `/`)

A narrative-driven interactive experience in 3 acts:
- **Facade**: Clean serif site with a drag lever to enter
- **Breaking**: Scroll resistance → sticker detonation → BSOD → glitch sequence
- **Broken**: Brutalist portfolio with Win98 popup windows, marquees, project cards

Key files:
- `components/machine/TheMachine.tsx` — Main component (~850 lines, all phases)
- `lib/machine-content.ts` — All copy/content (projects, skills, contact)
- `app/globals.css` — Design system, animations, sticker/BSOD/glitch styles

## v2 — Inside the Machine (branch `v2/the-gallery`, `/v2`)

NOT a portfolio. An interactive 3D experience inside the broken machine from v1.

When v1's machine breaks, a hidden portal leads inside. v2 is the machine's interior: dark, abstract, industrial. The visitor discovers interactive fragments (puzzles, generative toys, memories, secrets) — not project cards. The experience IS the portfolio piece.

- Project plan: `docs/v2/PROJECT_PLAN.md`
- Architecture: `components/gallery/` (R3F components)
- Config: `lib/gallery-config.ts` (scene constants)
- Content: `lib/gallery-content.ts` (fragment definitions)
- Fragments: `components/gallery/fragments/` (interactive moments)

v1 is the surface. v2 is the depth.

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, PostCSS
- **UI**: Radix UI + shadcn/ui
- **3D (v2)**: @react-three/fiber, drei, postprocessing, custom GLSL shaders
- **Fonts**: Inter (sans), Source Serif 4 (serif), JetBrains Mono (mono)
- **Path alias**: `@/*` maps to project root

## Design System

Colors: `--m-orange: #FF5C00`, `--m-blue: #0038FF`, `--m-yellow: #E8D44D`, `--m-red: #D62828`, `--m-green: #39ff14`
Typography classes: `.t-display` (mono bold), `.t-serif` (light serif), `.t-label` (10px mono uppercase)
Motion tokens: `--ease`, `--fast: 200ms`, `--base: 400ms`, `--slow: 700ms`

## Conventions

- Spanish commit messages are fine, English also fine
- Commit style: `feat:`, `fix:`, `docs:`, `refactor:`
- All content lives in `lib/machine-content.ts` (v1) or `lib/gallery-content.ts` (v2)
- No external animation libraries — CSS + requestAnimationFrame + custom spring physics
- Brutalist aesthetic: no border-radius (0px), hard edges, monospace labels
- v2 interior: dark void (#050505), industrial atmosphere, interactive fragments, machine aesthetics

## Commands

- `npm run dev` — Start dev server
- `npx next build --no-lint` — Production build (fast check)
- `npm run build` — Full build with lint
