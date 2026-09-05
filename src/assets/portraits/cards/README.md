# Portrait cards

In-game-size copies of the canonical dialogue portraits in `src/assets/portraits/<character>/`,
downscaled to 362px tall (~90KB each instead of ~700KB). The dialogue card in
`src/adapters/phaser/garden/garden-dialogue-panel.ts` draws a portrait about 190px wide, so the
full-resolution originals would cost several megabytes of download for no visible difference.

The originals stay canonical: regenerate these whenever a portrait is redrawn, e.g.

```bash
sips -Z 362 --out src/assets/portraits/cards/<character>-<emotion>-v1.png \
  src/assets/portraits/<character>/<emotion>-v1.png
```
