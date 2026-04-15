# ADR-0002: Mirror Phased Validation Before Final Styling

- Status: Accepted
- Date: 2026-04-12
- Owners: juan.software experiments

## Context

The first Mirror implementation attempted early stylization before validating camera, processing, and silhouette baselines separately.
This produced visually weak output and unstable body-follow behavior.

## Decision

Adopt a strict staged rebuild sequence:

1. camera baseline
2. image processing baseline
3. person mask/silhouette baseline
4. draw-on-top baseline
5. final stylization

`/mirror` remains clean by default.
Stage tooling is debug-only (query/keyboard activation).

## Why

- prevents hiding core pipeline problems behind visual effects
- makes each dependency explicit and testable
- improves diagnosis of latency/projection/tracking defects
- creates durable implementation checkpoints for future collaborators

## Consequences

Positive:

- each layer can be validated with concrete acceptance criteria
- easier to identify whether failures are in camera, processing, mask, adaptation, or rendering

Negative:

- temporary intermediate states are less visually polished
- requires disciplined sequencing before style work

## Current Progress

- Phase 1 complete: mirrored full-frame camera baseline
- Phase 2 complete: controlled processing baseline (downsample, luminance, motion)
- Phase 3 complete: confidence-mask silhouette baseline with temporal/spatial smoothing and hysteresis cleanup
- Phase 4 complete: mask-driven draw-on-top baseline with anchored target-follow particles and controlled out-of-frame dispersion
- Phase 5 pending

## Phase 3 Strategy Choice

Two viable segmentation output strategies were evaluated:

1. category mask only (hard binary output)
2. confidence mask + post-processing

Chosen:

- confidence mask + refinement

Why:

- confidence values allow temporal damping and hysteresis, reducing flicker
- better shape continuity for limbs/edges than immediate hard thresholding
- preserves room for Phase 4 target extraction and weighted particle spawning

## Phase 4 Corrections Applied

- removed per-frame random keep/drop in target sampling to reduce jitter and drift perception
- removed time-based target hopping in particle assignment to keep particles body-attached
- removed wrap-around behavior at bounds to avoid detached particles teleporting across screen
- added explicit PHASE 4 metrics (`targetCount`, `activeParticles`, `meanAttachmentError`) to validate correspondence and latency before stylization

## Resonance Fidelity Correction

Additional diagnosis after PHASE 4 baseline:

- particle behavior still felt unlike Resonance due to high decorative drift and mixed visual layers
- overlay included target-debug points in visible composition, reducing silhouette clarity
- particle set remained broader than silhouette support, producing free-floating artifacts

Direction chosen:

- align mirror-particle dynamics with a Resonance-like model:
  - dynamic per-particle origin
  - return/snapback/inertia core
  - deterministic body-anchored target mapping
- keep target visualization in debug surfaces only, not in final layer
- introduce an intentional dark ambient background for particle mode that supports form readability

## Motion Model Correction (Body Fidelity)

Short diagnosis:

- orbital/gimmick motion came mainly from sinusoidal inactive drift in particle update
- imperfect body lock came from dynamic remapping of particles when target set size/order changed frame-to-frame
- visual mismatch was amplified by rendering non-body-debug targets in the visible composition layer

Correction:

- switched to stable 1:1 mapping (`target index -> particle index`) using deterministic target arrays
- moved inactive behavior to velocity damping + fade (no autonomous orbit drivers)
- strengthened direct target-follow parameters and return/snapback damping to reduce lag
- constrained visible active particles to active target slots, preserving silhouette readability

## Density and Motion Quality Iteration

Diagnosis:

- visible sparsity was limited by conservative sampling/target budgets and strict active slot counts
- follow still felt slow due layered smoothing (`segmentation smoothing + origin interpolation + spring return`)
- silhouette richness degraded when relying only on binary activation

Actions:

- raised per-tier segmentation cadence/sample density/target budgets
- switched particle target activation source from binary mask to smoothed confidence map
- removed active-state origin interpolation (direct origin update per target frame)
- re-tuned follow/return/snapback/friction for faster body-coupled response
- added subtle renderer density pass and deeper background layers while preserving silhouette contrast

## Persistent Dense Pool Decision

- keep a fixed particle pool independent of frame-to-frame target count
- avoid perceived spawn/despawn artifacts caused by particle pool resizing
- preserve deterministic target ordering and map active body targets over the fixed pool for dense mirror presence

## Anti-Orbit and Shape-Lock Correction

Context:

- after density improvements, the visual still showed orbit-like trajectories and silhouette breakup during motion.

Findings:

- mixed target sets (including background slots) reduced body-lock fidelity in the particle engine
- mask projection math from segmentation coordinates to mirrored cover space was not strictly source-correct
- render amplification (reaction/trails) made motion artifacts more visible

Decision:

- gate adapter output to subject-active points only
- correct projection to `source -> cover -> output`, then mirror on X
- simplify to a damped follow model (`k*x - c*v`) plus controlled snapback and friction
- reduce decorative render amplification until tracking fidelity is stable

Tradeoff:

- less decorative motion flair in exchange for stronger body correspondence and shape readability

## Presence and Responsiveness Tuning

Context:

- after anti-orbit correction, body lock improved but output felt sparse and inert compared with Resonance.

Decision:

- keep body-fidelity constraints and improve vitality through controlled simulation/render coupling:
  - add particle `energy` as a motion-reactive signal (confidence + target weight + speed)
  - add target-velocity matching term to reduce perceptual lag
  - persist per-particle slot assignment and rebind locally to active slots to prevent global remap artifacts
  - increase segmentation cadence and refiner responsiveness for faster body updates
  - raise visible density in render passes, driven by life/energy (no decorative autonomous motion)

Tradeoff:

- higher compute cost than conservative baseline, but better perceived material presence and rhythm

## Resonance-Locked Simplification Reset

Context:

- attempts to increase vitality introduced unstable slot remapping and visual incoherence under body motion.

Decision:

- simplify back to a Resonance-like deterministic core:
  - fixed particle-to-slot assignment
  - direct slot active/inactive gating from silhouette
  - explicit spring+damping+snapback motion
  - renderer language aligned to Resonance trails/twinkle/reaction

Tradeoff:

- less algorithmic complexity and fewer autonomous effects, but significantly better shape continuity and motion readability

## Focus Reorientation: Single-Mode Liquid First

Context:

- parallel pursuit of particle and liquid reduced quality focus and iteration clarity.

Decision:

- prioritize one product mode: liquid/chrome mirror
- liquid render path runs on WebGL2 shader pipeline only (no product fallback path)
- pause particle work without deleting it; keep archived controller and modules for later continuation

Consequences:

- faster iteration toward premium liquid quality
- cleaner performance/profile tuning on one mode
- particle remains recoverable with explicit paused-state documentation
