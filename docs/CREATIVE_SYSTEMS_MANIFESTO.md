# Creative Systems Manifesto

## Intent

Build interactive pieces as evolving systems, not isolated demos.
Each experiment should inherit from previous work while introducing one clear step forward.

## Core Principles

1. Layered construction first.
2. Lineage over reinvention.
3. Reusable primitives, minimal abstraction.
4. Explicit frame pipelines.
5. Behavior quality before visual polish.

## Layered Construction

All real-time experiences should be validated in this order:

1. input acquisition
2. signal processing
3. semantic interpretation
4. simulation / adaptation
5. rendering / composition
6. stylization

No layer should hide unresolved problems from previous layers.

## Lineage Between Experiments

- New experiments must reuse or evolve at least one prior system.
- Keep compatibility where practical.
- Preserve conceptual continuity in docs and code structure.

## Reusable Creative Primitives

Primitives should be extracted only when they have clear multi-experiment value:

- timing / frame clock
- camera providers
- segmentation providers
- adapters from perception to simulation targets
- particle simulation core
- renderer contracts

Avoid abstracting style-specific logic into shared modules too early.

## Architecture Guardrails

- Keep per-frame mutable state out of React state.
- Keep controllers imperative and explicit.
- Keep constants centralized and semantically named.
- Keep debug tooling opt-in and out of product defaults.

## Quality Guardrails

- Favor spatial correspondence and latency fidelity over decorative effects.
- Remove autonomous motion that weakens body or input readability.
- Add visual layers only when they improve meaning, not noise.

## Documentation Discipline

Every significant direction change must record:

- context
- decision
- tradeoff
- expected reuse
- known limits

Use `docs/decisions/*` and experiment READMEs as durable memory.
