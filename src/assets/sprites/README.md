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

## Hero runtime atlas

The cats are built at startup from their canonical drawn poses in `heroes/` — idle, run-contact,
run-passing, jump, attack and ability for each cat. `sprite-atlas.ts` trims every pose to its own
alpha bounds, scales it into a 256×256 cell and registers the twelve frames on one CanvasTexture;
`heroes/cards/` holds the in-game-size copies it actually loads.

`eclipse-paws-character-atlas-v1.png` was the previous runtime source: an ImageGen sheet with a
baked checkerboard background that the adapter had to strip and re-cut into 24 frames. It is no
longer loaded — the cats it produced did not match the canonical hero art.

`stage4-enemy-atlas-v1.png` contains eight unique painterly enemies for the forest and library:
thorn stalker, lantern moth, elder spore, Great Mushroom, mirror harpy, ink sprite, echo owl and
Archivist Echo. The adapter removes its white source background once and registers eight frames.

`stage5-enemy-atlas-v1.png` contains eight unique fortress/final enemies: clockwork mite, eclipse
knight, pendulum wraith, fortress golem, dawn fragment, void maw, eclipse sentinel and the Dawn
Devourer. It uses the same local background-removal and frame-registration pipeline.
