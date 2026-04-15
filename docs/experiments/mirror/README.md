# Mirror (`/mirror`)

## Concept

Mirror is a persistent live interaction, not a linear scene.
The user moves and immediately sees a transformed reflection.

## Product Intent

- Preserve real-time mirror feeling.
- Ship one excellent mirror mode before expanding.
- Keep the experience minimal, premium, and continuous.
- Reuse and evolve prior systems, especially Resonance.

## Interaction Model

- `/mirror` stays clean by default (no debug UI).
- Development stage mode is optional and activable with:
  - query: `?debug=1&stage=1|2|3|4`
  - keyboard: `Shift + D` (toggle), `1` (phase 1), `2` (phase 2), `3` (phase 3), `4` (phase 4)
- No intro/outro sequence and no forced flow.

## Object Reframe Iteration (2026-04-12)

Mirror is now being iterated as a **reflective object**, not as a fullscreen effect by default.

Primary question for this iteration:

- can one digital object feel like it reflects live camera through a soft chrome-like material?

Chosen first object:

- **pill / capsule / CTA-like volume**

Why this first:

- better reflection readability than a sphere
- stronger "artifact" feeling than a flat plate
- elegant fit with juan.software interface language

Current layered plan (object-first track):

1. base object layer (presence, volume, highlights) without camera dependency
2. material layer (satin chrome body behavior)
3. integrated reflection layer (camera as reflected information, not panel)
4. polish (restraint/tuning)

Status now:

- layer 1 accepted as baseline direction (needs future polish)
- layer 2 accepted as baseline direction (needs future polish)
- layer 3 in active validation
- layer 4 pending until layer 3 reads correctly

Lineage commitment:

- previous fullscreen/liquid and particle work is preserved as technical lineage
- camera/processing/debug infrastructure remains reusable
- particle path remains paused, not deleted

## Current Priority (2026-04-12)

- Product mode is now **single-object reflective mirror (capsule baseline)**.
- Mirror rendering runs in **WebGL2 shader pipeline** (no Canvas2D product fallback).
- Particle mirror remains intentionally paused and archived for later continuation.

Particle pause state:

- previous particle controller snapshot preserved in `src/lib/mirror/controllerParticlePaused.ts`
- particle modules remain in repo (`src/lib/creative/segmentation/*`, `src/lib/creative/particles/*`, `src/lib/mirror/renderers/phase4Baseline.ts`)
- current `/mirror` does not initialize segmentation/particle simulation

## Legacy Fullscreen/Particle Rebuild Log (Archived Lineage)

The sections below are preserved historical checkpoints from the previous fullscreen-first rebuild.

### Phase 1 (Completed) — Camera Baseline

- Full-frame camera render with mirrored orientation.
- Fixed cover mapping to avoid stretch/crop artifacts.
- Minimal pipeline focused only on low-latency camera fidelity.

Validation target:
- immediate response to movement
- readable mirrored behavior
- stable framerate

Not attempted in this phase:
- segmentation
- overlays from mask
- final liquid/particle styling

### Phase 2 (Completed) — Image Processing Baseline

- Added controlled frame processing module:
  - downsample source frame
  - luminance map
  - motion map (frame-difference over luminance)
- Processing runs at a controlled cadence (`processingFps`) and is decoupled from draw cadence.
- Debug panels expose source/luminance/motion maps and processing metrics.

Validation target:
- intermediate maps match real movement
- processing cost is measurable per frame
- no blocking of render loop

Not attempted in this phase:
- person silhouette quality
- body-attached particle behavior
- premium aesthetic layer

### Phase 3 (Completed) — Person Mask / Silhouette Baseline

- Segmentation provider now prioritizes confidence masks from MediaPipe (`outputConfidenceMasks`) and keeps category mask as fallback only.
- Added explicit mask refinement pipeline:
  - temporal smoothing with asymmetric EMA (faster rise, slower fall)
  - spatial 3x3 smoothing
  - hysteresis thresholding (`on/off`) for temporal stability
  - isolated-pixel cleanup to reduce background speckles
- Added stage-3 debug outputs:
  - `raw confidence`
  - `smoothed`
  - `binary silhouette`
- Added silhouette runtime metrics in HUD:
  - inference ms
  - post-process ms
  - foreground ratio
  - noise ratio
  - stability delta

Validation target:
- silhouette reads as a human structure (head/torso/arms)
- mirrored projection is spatially aligned with mirrored camera feed
- low background noise (noise ratio remains low in static background)
- temporal stability (stability delta decreases when subject is static)

Not attempted in this phase:
- artistic particle behavior
- body-attached draw strategy (Phase 4)
- premium stylization (Phase 5)

### Phase 4 (Completed) — Draw-On-Top Baseline

- Added a deterministic `mask -> targets` adapter path:
  - no random keep/drop per frame
  - staggered sampling rows to avoid visible square raster texture
  - projected with the same mirror/cover transform as camera render
- Added anchored particle baseline on top of the mirrored camera feed:
  - target-follow dynamics with explicit inertia and friction
  - deterministic target assignment (no time-based target hopping)
  - no wrap-around teleport across edges
  - graceful drift + fade when no subject targets exist
- Added PHASE 4 debug visibility:
  - stage `4` in query and keyboard toggles
  - metrics: `targetCount`, `activeParticles`, `meanAttachmentError`, `targetBuildMs`
  - debug panel: `raw confidence`, `binary silhouette`, `targets + particles`

Validation target:
- drawn points/particles remain spatially attached to body silhouette
- head/torso/arms are tracked as a coherent structure
- low perceptual latency from body motion to overlay reaction
- no independent floating square texture
- consistent dispersion and fade when subject leaves frame

Not attempted in this phase:
- final premium visual language for particle mode
- final liquid chrome stylization pass
- advanced glow/trail art direction

### Phase 4 Corrections (Resonance Alignment Pass)

Observed gap:

- two-layer mismatch (`green targets` + `white free particles`) made body reading noisy
- decorative drift/hopping behavior departed from Resonance feel
- too many particles remained active beyond silhouette support

Corrections applied:

- particle motion now follows a Resonance-like core:
  - per-particle `origin` (dynamic anchor)
  - return force + friction + max-speed cap
  - snapback when displacement grows too much
- targeting changed from decorative motion to stable body correspondence:
  - active particle count clamped by available silhouette targets
  - stable index-based target mapping (no time-animated remap)
- rendering corrected toward one coherent material:
  - removed green target points from main overlay (kept only in debug panel)
  - switched to single blue-white particle language with subtle twinkle/reaction
- background now starts intentional shaping for particle mode:
  - dark base + slow radial drift glow + vignette + low grain
  - tuned to preserve silhouette legibility, not to dominate it

### Motion Model Correction (Tracking Fidelity)

Root causes identified:

- sinusoidal inactive drift produced autonomous orbital/spin-like behavior
- particle-to-target correspondence changed when target list size/order shifted between frames
- visible composition included debug-like target artifacts, making fidelity issues more noticeable

Fixes applied:

- deterministic target array with explicit `active` flags (stable per-sample indexing)
- direct `target index -> particle index` mapping for active body slots
- inactive particles now damp and fade without decorative autonomous motion
- stronger target-follow and resonance-like return/snapback core to reduce perceptual lag
- active particle metrics now count only body-active slots for cleaner validation

### Density + Presence Iteration

Focused constraints:

- increase perceived matter density
- improve target-follow fidelity
- improve motion quality before adding visual complexity
- improve background atmosphere without competing against silhouette

Adjustments:

- increased segmentation sampling density and target budget by quality tier
- switched target extraction to smoothed confidence data (not only binary mask) for richer active structure
- removed extra follow lag by making particle origin adopt target position directly in active state
- increased follow/snap response and reduced over-damping in active body-tracking behavior
- renderer now adds a subtle volumetric pass (halo) and stronger but controlled trails for denser matter feel
- background gained additional depth layers (top/bottom shade + soft side drift) while keeping low-contrast body readability

### Dense Mirror Refinement (No Spawn Feel)

- particle pool is now fixed and persistent (`qualityProfile.particleCount`)
- active body targets drive that same pool every frame (no per-motion particle creation)
- active target arrays are deterministically reduced when needed, preserving stable ordering
- body-active targets are mapped across the whole pool to keep dense matter presence during movement

### Phase 4 Stability Correction (Anti-Orbit + Shape Lock)

Observed regression:

- particles regained orbit-like motion and silhouette cohesion broke during fast body movement

Root causes:

- engine mapped particles against mixed target sets that still contained background slots
- adapter projection from segmentation space to canvas space used an incorrect source-to-cover transform
- render pass amplified displacement artifacts with overly strong reaction/trail emphasis

Corrections:

- `personMaskToTargets` now emits subject targets only (active-mask gated), not background slots
- mask-to-canvas projection now uses proper `source -> cover -> output` mapping for mirror alignment
- particle simulation now uses direct body targets with a damped follow model (`k*x - c*v`) to suppress orbital behavior
- follow/snap/friction/life constants retuned for faster body lock and cleaner decay
- phase-4 renderer reduced decorative reaction/trails that visually exaggerated drift

Expected result:

- denser and more coherent body silhouette under motion
- lower perceived latency in limb tracking
- no decorative orbital behavior detached from the body

### Presence + Responsiveness Pass (Resonance Feel Recovery)

Goals:

- recover denser matter presence
- reduce perceptual lag in body follow
- keep motion lively without reintroducing orbit/drift gimmicks

Actions:

- particle core now includes `energy` (motion-reactive intensity) driven by confidence/weight/speed
- follow model adds target-velocity matching to reduce arm/head lag during quick movement
- particle assignment now persists by slot (`slotIndex`) with local active-slot search to avoid full-shape remap on motion
- segmentation refiner tuned for faster rise/fall response while preserving silhouette readability
- segmentation cadence increased by quality tier for better temporal coupling
- render density increased (core/halo/trail) tied to particle life+energy, not autonomous noise

Tradeoff:

- slightly higher GPU/CPU load in exchange for stronger presence and better movement immediacy

### Stability Reset (Resonance-Locked Core)

After regressions in visual coherence, the particle engine was intentionally simplified:

- fixed `particle -> slot` assignment (no roaming slot search)
- active/inactive behavior decided directly by each slot's silhouette state
- spring+damping+snapback core kept explicit and conservative
- renderer re-aligned to Resonance-like trails + twinkle + displacement reaction

This reset prioritizes shape continuity and readable body-lock over complex autonomous effects.

## Technical Architecture (Current)

Current product path (liquid-only):

1. `camera` provider (`src/lib/creative/camera/*`)
2. `processing` baseline (`src/lib/creative/processing/*`)
3. WebGL2 liquid renderer (`src/lib/mirror/renderers/liquidMetal.ts`)
4. liquid controller orchestration (`src/lib/mirror/controller.ts`)
5. optional debug overlays (camera/processing/distortion/final)

Archived/paused path:

- particle pipeline kept in-code but not active in product render loop.

## Dependencies Introduced

- `@mediapipe/tasks-vision`

Why:

- browser-local person segmentation
- good realtime performance/quality ratio
- simpler integration than a full tfjs stack for this MVP

Current status:

- dependency remains for paused particle work; liquid product path does not currently require segmentation runtime.

## Next Locked Steps

1. polish liquid chrome materiality (highlight shaping, depth cues, temporal coherence).
2. optimize liquid shader performance across quality tiers.
3. resume particle only after liquid reaches target quality bar.

## Resonance Lineage (Reuse)

Reused and evolved from Resonance:

- imperative controller loop pattern
- explicit per-frame ordering
- constants-first tuning style
- shared math utilities (`resonance/utils.ts` now reexports from `creative/math.ts`)

Not reused directly:

- Resonance-specific audio graph (Mirror MVP is visual-only)
- Resonance pulse/cursor interaction model

## Known Limitations (MVP)

- Segmentation model is fetched from official remote assets at runtime.
- Particle shape quality depends on camera lighting and subject contrast.
- Liquid mode is Canvas2D-based, not a physically based shader pipeline.
- Current silhouette refinement is tuned for one dominant subject in frame.

## Future Evolutions

- optional local model hosting for offline robustness
- better particle body topology clustering (limbs/torso weighting)
- optional WebGL liquid renderer while keeping current interfaces
- quality auto-tuning from runtime frame-time telemetry
