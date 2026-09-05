# Runtime sprite atlas

## New canonical heroes

`heroes/` contains the first new-scenario character pass for Lumus and Nox. Each hero has an
independent canonical reference, a six-pose source strip and separate `idle`, two `run`, `jump`,
`attack` and `ability` images. Pose order is stable and ready for atlas packing.

The source strips contain a baked checkerboard. Do not use color-key transparency on Lumus: the
existing connected-background removal approach must be reused so his pearl-white fur is preserved.
The separate pose files remain source masters until that normalization pass is wired to the new
atlas.

## New-scenario NPC and enemy sources

- `npcs/gardener-reference-v1.png`: canonical Garden of First Dawn NPC reference.
- `npcs/gardener-animation-source-v1.png`: four-pose source strip plus separate idle, walk, talk and
  night-reaction crops.
- `npcs/sun-little-one-day-night-source-v1.png`: paired day/night design plus independent RGBA
  crops.
- `enemies/hound-of-silence-source-v1.png`: three-pose source strip.
- `enemies/hound-of-silence-{idle,telegraph,leap}-v1.png`: independent RGBA animation poses.

The Gardener animation source contains a baked checkerboard and remains a normalization input.

## Legacy runtime atlas

`eclipse-paws-character-atlas-v1.png` is the ImageGen-derived source atlas used by Phaser.

The generated PNG contains a baked checkerboard instead of alpha. `sprite-atlas.ts` performs a
single startup conversion: it removes only connected near-white background pixels, normalizes the
irregular generated poses into 24 isolated 256×256 frames, registers those frames on one
CanvasTexture, then releases the unprocessed source texture.

ImageGen mode: built-in edit/generation using the original concept sheet as the identity and style
reference. No external CDN or runtime network request is used.

`stage4-enemy-atlas-v1.png` contains eight unique painterly enemies for the forest and library:
thorn stalker, lantern moth, elder spore, Great Mushroom, mirror harpy, ink sprite, echo owl and
Archivist Echo. The adapter removes its white source background once and registers eight frames.

`stage5-enemy-atlas-v1.png` contains eight unique fortress/final enemies: clockwork mite, eclipse
knight, pendulum wraith, fortress golem, dawn fragment, void maw, eclipse sentinel and the Dawn
Devourer. It uses the same local background-removal and frame-registration pipeline.
