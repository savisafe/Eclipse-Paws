# Environment assets

## Current dream-world set (scenario 2026-09-04)

Seven independent 16:9 environment illustrations follow `docs/ECLIPSE_PAWS_SCENARIO.md`:

- `dream-garden-first-dawn-v1`: the endless frozen morning garden;
- `dream-whispering-lanterns-v1`: the lantern forest and glass-dome observatory;
- `dream-midday-clock-city-v1`: the hurried healer city and central clock tower;
- `dream-unread-letters-sea-v1`: the paper sea, submerged library and lighthouse;
- `dream-forgotten-smiles-carnival-v1`: the repeating carnival and carousel;
- `dream-last-star-field-v1`: the meadow/quiet post-war field and solitary tree;
- `dream-eternal-sleep-heart-v1`: Somnium's folding house and door to reality.

PNG files are lossless art masters. Matching quality-84 JPEG files are the runtime assets. The
Phaser manifest keeps each world independent and exposes ambient/motion metadata for animation.

## Legacy five-world set

Both project-bound images were created with built-in ImageGen on 2026-09-02 and are loaded only
with the lazy Phaser game chunk.

- `garden-first-dawn-background-v1.png`: detailed ancient solar garden at dawn, ruined arches,
  mountains, waterfalls, vegetation, sun and residual moonlight; environment only.
- `garden-stone-platform-tile-v1.png`: horizontally repeatable pale-stone, moss, roots, grass and
  blue/gold flower material matching the background.
- `whispering-forest-background-v1.png`: moonlit ancient forest with roots, violet fog, streams,
  lantern shrines and turquoise bioluminescence.
- `celestial-library-background-v1.png`: suspended observatory-library with bookshelves, brass
  orreries, constellation ceiling and sun/moon light.
- `clock-fortress-background-v1.png`: monumental stopped clocks, brass gears, chains and eclipse
  towers under opposed amber/indigo light.
- `eclipse-heart-background-v1.png`: shattered celestial pendulum chamber resolving from cosmic
  eclipse toward dawn.

No CDN, logos, text, trademarks or runtime network requests are used.

The PNG files are lossless ImageGen sources. Phaser imports matching JPEG quality-84 derivatives
for substantially smaller web delivery while preserving the sources for future art iteration.
