# Melt (`/melt`)

## Concept

Melt is a camera illusion: the visitor teaches the experience the room behind them,
returns to frame, and then melts away while the learned room remains intact.

The first checkpoint intentionally uses the keyboard instead of snap detection. This
keeps the visual illusion, segmentation quality, and background reconstruction
independently testable.

## Interaction

1. Allow camera access.
2. Move from side to side until the coverage indicator reaches `READY`.
3. Return to the desired position.
4. Press `Space` to capture and melt the segmented person.
5. Press `Space` again to return, or `R` to relearn the room.

Development controls:

- `D`: debug view
- `R`: clear and relearn the background
- `Escape`: cancel the effect and return to ready

## Pipeline

1. Existing webcam provider produces the mirrored live frame.
2. Existing MediaPipe provider and mask refiner isolate the person.
3. Background memory accepts only high-confidence background pixels and accumulates
   several observations per pixel.
4. At sufficient coverage the background is frozen and small unseen regions are
   propagated from their nearest observed neighbors.
5. On trigger, the live person is captured through the refined alpha mask.
6. The frozen background is rendered below delayed vertical strips of the captured
   person, creating the initial melt study.

## Current tradeoffs

- Canvas2D is used for the first visual checkpoint. The background-memory and state
  pipeline can remain unchanged if the melt renderer moves to WebGL2.
- Camera framing must stay fixed after learning the room.
- Strong lighting changes after `READY` will reveal the frozen clean plate.
- Snap detection and audio are intentionally deferred until the illusion is accepted.
