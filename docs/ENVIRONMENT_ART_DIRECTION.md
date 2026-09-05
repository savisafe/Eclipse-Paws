# Environment art direction

The canonical source is `ECLIPSE_PAWS_SCENARIO.md`. The seven environment masters are separate
images rather than frames of a slideshow. They share an original hand-painted storybook style,
soft shapes, readable silhouettes, a 16:9 side view and an open lower gameplay corridor.

## Animation-ready structure

`dream-environment-manifest.ts` maps every canonical level to its own image, accent, ambient motif
and motion family. `arena-decoration.ts` uses that data for continuous scene motion:

- a very slow camera-plane breathing movement;
- a separate additive light plane;
- ambient motes with different scroll factors for parallax;
- phase tinting remains independent from environment motion;
- reduced-motion mode freezes every decorative tween.

This is the first animation pass. Future transparent layers can be added beside each master without
changing gameplay: `far`, `mid`, `near`, `ambient` and `interactive`. Good candidates are flowers,
lanterns, clock hands/trams, letters/waves, rides/confetti, kite/star flowers and folding pages.

## Generation brief

Built-in ImageGen was used. Each prompt named the scenario location and its canonical landmark,
specified an original hand-painted storybook 2D platformer environment, wide side-view framing,
clear depth planes and the level palette. Every prompt excluded active characters, cats, enemies,
UI, readable text, logos and watermarks. The level-specific details came directly from the
scenario's `Ландшафт и декорации` sections.

## Character and UI asset pass 1

The first missing-element batch adds canonical Lumus and Nox references, six separate animation
poses per hero, and seven separate transparent ability icons. These are source masters; replacing
the legacy runtime character atlas belongs to the scenario content migration so old ability and
animation identifiers are not silently mixed with the new canon.

## Garden interactive art pass

The first level now has eight independent transparent interactive props, a canonical Gardener
reference and a three-pose Hound of Silence animation source. The decoration README records the
intended moving parts so animation can be implemented as continuous sprite/tween motion rather
than slideshow replacement.

The follow-up Garden pass adds paired day/night Sun Little One art, four Gardener poses, closed/open
and night-active states for the three mandatory mechanisms, and four independent item/quest icons.
