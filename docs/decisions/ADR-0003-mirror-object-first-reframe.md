# ADR-0003: Mirror Object-First Reframe (Capsule Baseline)

- Status: Accepted
- Date: 2026-04-12
- Owners: juan.software experiments

## Context

Mirror exploration produced useful technical lineage (camera, processing, segmentation, phased validation),
but the fullscreen-first visual direction weakened material readability.

Current product question changed:

- can a single reflective object communicate live camera reflection with premium, soft chrome behavior?

## Decision

Reframe Mirror as an **object-first** piece.

First implementation target:

- one central **pill/capsule reflective object** on a dark composition

Working sequence for this track:

1. object baseline
2. reflection baseline
3. surface behavior baseline
4. materiality
5. polish

## Why Capsule First

- preserves enough surface area for readable reflection
- reads as a sculptural interface artifact (fits product language)
- gives stronger form identity than a flat fullscreen surface
- lower first-prototype risk than sphere for reflection legibility

## Technical Fit

- keep existing imperative controller and phased debug structure
- keep camera + frame-processing modules as reusable input signals
- keep paused particle path archived and intact
- use WebGL2 shader pipeline for product render because material realism needs per-pixel control

Canvas2D remains useful for debugging/probing but is not the primary path for this material direction.

## Consequences

Positive:

- clearer creative focus and evaluation criteria
- stronger chance of "object/material" read over "video effect" read
- preserves prior architecture while evolving visual direction honestly

Negative:

- temporary mismatch with older docs written for fullscreen-first sequencing
- reflection/material phases are intentionally pending while phase 1 is validated

## Follow-ups

- document each phase result with explicit validation outcomes
- update mirror README phase status to object-track language
- evaluate whether phase 4 needs shader architecture split (material modules) before polish
