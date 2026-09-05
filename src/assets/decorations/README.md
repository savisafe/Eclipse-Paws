# Interactive decorations

All decoration masters are independent RGBA PNG files intended for Phaser sprites rather than
being baked into the panoramic background.

## Garden of First Dawn

| Asset                                   | Gameplay role                 | Animation preparation                    |
| --------------------------------------- | ----------------------------- | ---------------------------------------- |
| `light-flower-{open,closed}-v1.png`     | bounce platform / pollen clue | squash, state blend, glow pulse          |
| `living-hedge-gate{-open}-v1.png`       | light-directed passage        | branch bend between both states          |
| `ancient-sundial{-night-active}-v1.png` | main phase puzzle             | gnomon rotation, root release, rune glow |
| `water-sluice-wheel-v1.png`             | redirects water               | gate lift, wheel rotation, water loop    |
| `parachute-seed-v1.png`                 | safe glide                    | canopy breathing, ribbon sway            |
| `garden-bells-v1.png`                   | sound interaction             | three independent bell swings            |
| `memory-statue-v1.png`                  | optional memory reveal        | light silhouette overlay                 |
| `mechanical-watering-can-v1.png`        | comic ambient interaction     | wheel roll, neck bob, water loop         |

The mandatory scenario interactions—light flower, living hedge and sundial—are included.

The closed flower was returned with a baked checkerboard and needs the same connected-background
normalization used for white character art before runtime packing. Other phase variants are RGBA.
