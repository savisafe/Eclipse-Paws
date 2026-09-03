# Runtime sprite atlas

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
