# Smiley visual ground truth

The selected base direction is the translucent gel study in `references/01-idle.png`.

These images are visual and physical references, not a pre-rendered animation sequence. Their role is to hold the interactive prototype accountable to the chosen object instead of letting the implementation drift toward a generic 3D smiley.

## Reference states

1. `01-idle.png` — selected object, material, lighting, face, and composition
2. `02-center-soft.png` — initial shallow center pressure
3. `03-center-strong.png` — maximum broad center compression
4. `04-cheek-left.png` — local image-left cheek pressure
5. `05-cheek-right.png` — local image-right cheek pressure
6. `06-top.png` — top indentation and lateral volume displacement
7. `07-bottom.png` — lower-front indentation
8. `08-lateral.png` — side compression propagating across the whole volume
9. `09-squash.png` — maximum global vertical compression
10. `10-overshoot.png` — first underdamped release overshoot

## Invariants for the interactive prototype

- The yellow body reads as dense, slightly translucent silicone gel.
- Fine skin texture and broad milky highlights survive deformation.
- Eyes and smile remain submerged in and advected by the material.
- A local indentation displaces volume into a soft surrounding swell.
- Pressure propagates beyond the contact point; the silhouette participates.
- Release briefly overshoots and transfers energy into a restrained whole-body wobble.
- The neutral studio field, grounded shadow, frontal camera, and minimal composition remain stable.

## Prototype technique

The first prototype uses image-space WebGL displacement on a dense frontal 2.5D mesh. `01-idle.png` remains the material source, while a clean studio plate and procedural contact shadow let the silhouette deform independently. Two damped springs control local release overshoot and secondary whole-body wobble.

The checkpoint is whether this approach preserves the photographic material while approximating the silhouette, face advection, and volume cues in states 02–08. A full 3D reconstruction remains a fallback, not the default.
