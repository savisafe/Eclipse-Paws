# Runtime sprite atlas

`eclipse-paws-character-atlas-v1.png` is the ImageGen-derived source atlas used by Phaser.

The generated PNG contains a baked checkerboard instead of alpha. `sprite-atlas.ts` performs a
single startup conversion: it removes only connected near-white background pixels, normalizes the
irregular generated poses into 24 isolated 256×256 frames, registers those frames on one
CanvasTexture, then releases the unprocessed source texture.

ImageGen mode: built-in edit/generation using the original concept sheet as the identity and style
reference. No external CDN or runtime network request is used.
