# v2 — The Gallery

## Vision

A navigable 3D abstract gallery where the visitor explores freely. Each "piece" in the gallery is a project, an idea, or a fragment of identity. The portfolio is not a page — it's a space you enter.

Minimal architecture, maximum focus on the work. The container is silent; the content is alive.

## Goals

| Goal | How |
|------|-----|
| Get hired | Memorable, technically impressive, shows taste |
| Show craft | The site itself IS the portfolio piece |
| Self-expression | Art project energy — not a template |

## Core Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Metaphor | Abstract gallery / installation | Clean, timeless, lets content shine |
| Navigation | Free exploration + breadcrumbs | Respects visitor agency, rewards curiosity |
| Tech | React Three Fiber + drei | React ecosystem, declarative 3D, good DX |
| AI role | Visual + conversational + reactive | Multiple layers, added progressively |
| Scope | MVP first, iterate | Ship fast, validate, then expand |
| Structure | Hybrid narrative | Loose story emerges from exploration |

## Tech Stack (v2 additions)

| Layer | Library | Purpose |
|-------|---------|---------|
| 3D Engine | `@react-three/fiber` | Declarative Three.js in React |
| 3D Helpers | `@react-three/drei` | Camera controls, text, loaders, env maps |
| Post-processing | `@react-three/postprocessing` | Bloom, vignette, tone mapping |
| Performance | `r3f-perf` (dev only) | FPS monitoring during development |
| Shaders | `glsl` / custom | Generative visuals, material effects |
| AI (future) | TBD | Conversational + reactive systems |

## Architecture

```
app/
  v2/
    page.tsx                 ← Entry point, lazy loads Gallery
    layout.tsx               ← v2 metadata, fonts

components/
  gallery/
    Gallery.tsx              ← Main R3F Canvas + scene orchestrator
    Scene.tsx                ← Lighting, environment, fog
    Floor.tsx                ← Ground plane geometry
    CameraRig.tsx            ← Camera controls + movement
    Piece.tsx                ← Single interactive art piece (project)
    PieceOverlay.tsx         ← 2D HTML overlay for project details
    EntryTransition.tsx      ← 2D → 3D transition
    Crosshair.tsx            ← Minimal navigation indicator
    effects/
      PostProcessing.tsx     ← Bloom, vignette, color grading
      Particles.tsx          ← Ambient particle system
      GenerativeArt.tsx      ← Procedural shader pieces
    ui/
      GalleryHUD.tsx         ← Minimal HUD (navigation hints)
      PieceLabel.tsx         ← Floating label near pieces

lib/
  gallery-content.ts         ← Project data adapted for 3D placement
  gallery-config.ts          ← Scene constants (dimensions, colors, limits)
  shaders/                   ← GLSL shader files
```

---

## Milestones

### M0 — Foundation
> Set up the tooling, install dependencies, create the skeleton.
> Deliverable: R3F renders a blank canvas at `/v2`.

- [ ] Install R3F ecosystem (`@react-three/fiber`, `drei`, `postprocessing`)
- [ ] Create `app/v2/page.tsx` route
- [ ] Create `components/gallery/Gallery.tsx` with basic Canvas
- [ ] Set up `gallery-config.ts` (scene constants, dimensions)
- [ ] Add `r3f-perf` for dev-only FPS monitoring
- [ ] Verify build passes, no bundle size regressions

### M1 — The Empty Space
> A navigable gallery with atmosphere but no content yet.
> Deliverable: Visitor can move through a beautiful empty 3D space.

- [ ] Gallery geometry — floor plane with subtle grid/texture
- [ ] Lighting design — ambient + directional + accent lights
- [ ] Environment — fog, background color/gradient, subtle atmosphere
- [ ] Camera controls — orbit or first-person navigation
- [ ] Post-processing — bloom, vignette, tone mapping
- [ ] Entry transition — 2D landing → 3D space (fade/zoom)
- [ ] Mobile detection — touch controls or graceful 2D fallback
- [ ] Ambient particles — floating dust/light motes

### M2 — The Pieces (MVP complete)
> Interactive objects in the gallery representing projects.
> Deliverable: 2-3 clickable project pieces with detail overlays. **This is the MVP.**

- [ ] Piece component — 3D object (abstract geometry per project)
- [ ] Piece interaction — hover glow/scale, click to open
- [ ] Detail overlay — 2D HTML panel with project info (title, description, tags)
- [ ] Spatial composition — thoughtful placement of pieces in the space
- [ ] Piece labels — floating text near each piece
- [ ] Gallery content — adapt `machine-content.ts` projects for 3D
- [ ] Close overlay — click away or explicit close
- [ ] Camera focus — camera moves toward piece on click

### M3 — Navigation & Discovery
> Wayfinding, easter eggs, about/contact integration.
> Deliverable: Complete portfolio experience with all content accessible.

- [ ] Wayfinding — subtle floor markers or light trails
- [ ] About section — integrated as a piece or wall text
- [ ] Contact section — integrated in the space
- [ ] Easter eggs — hidden interactions rewarding curiosity
- [ ] Visited markers — visual indicator for seen pieces
- [ ] Minimap or spatial indicator (optional)
- [ ] Sound design — ambient + interaction sounds (optional, muted by default)

### M4 — Generative Layer
> Procedural visuals, unique per-visit elements, shader art.
> Deliverable: The gallery feels alive and different each visit.

- [ ] Generative background — procedural shader or particle field
- [ ] Unique seed per visit — colors/shapes shift between sessions
- [ ] Shader art pieces — 1-2 generative artworks as gallery pieces
- [ ] Material effects — custom shaders on project pieces
- [ ] Environmental reactivity — space responds to cursor/movement

### M5 — AI Layer
> Conversational and reactive intelligence.
> Deliverable: Visitors can interact with an AI presence in the gallery.

- [ ] Conversational component — chat interface embedded in the space
- [ ] AI persona — knows about projects, answers questions naturally
- [ ] Reactive environment — adapts layout/lighting based on visitor behavior
- [ ] Dynamic content — AI-generated descriptions or commentary
- [ ] Behavior tracking — time spent, pieces viewed, interaction patterns

### M6 — Polish & Ship
> Performance, accessibility, production readiness.
> Deliverable: Production-ready v2 replacing v1.

- [ ] Performance audit — target 60fps on mid-range devices
- [ ] Bundle optimization — code splitting, lazy loading textures
- [ ] Mobile experience — full touch support or elegant fallback
- [ ] SEO — prerendered HTML fallback for crawlers
- [ ] Accessibility — keyboard navigation, screen reader alt content
- [ ] Analytics — track interactions, pieces viewed
- [ ] v1 → v2 transition — redirect or toggle between versions
- [ ] Deploy to production

---

## MVP Definition

**MVP = M0 + M1 + M2**

A visitor arrives, enters a 3D abstract gallery, navigates freely, discovers 2-3 interactive project pieces, clicks to see details. Beautiful, performant, memorable.

**MVP does NOT include:**
- AI/conversational features
- Generative/procedural visuals
- Sound
- Easter eggs
- About/contact (can be a simple link in HUD)

---

## Design Tokens (v2)

Inherits from v1 with adaptations for 3D:

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0a0a0a` or `#111` | Dark gallery space |
| Floor | `#1a1a1a` | Subtle, not distracting |
| Accent light | `#FF5C00` | Orange — project highlights |
| Ambient light | `#e8e0d4` | Warm, soft |
| Fog | `#0a0a0a` → transparent | Depth, mystery |
| Text (3D) | `#f0ece4` | Labels in space |
| Text (overlay) | Inherits v1 tokens | 2D panels |

---

## Open Questions

- [ ] First-person vs orbit camera? (first-person is more immersive, orbit is easier)
- [ ] What shape should project pieces be? (abstract geometry, floating planes, pedestals?)
- [ ] Should v1 remain accessible or be fully replaced?
- [ ] Audio: yes or no? If yes, opt-in or ambient by default?
- [ ] Should the gallery have walls/ceiling or be an infinite space?
