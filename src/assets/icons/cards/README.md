# Icon cards

In-game-size copies of the canonical icons in `src/assets/icons/`, downscaled to 160px. The game
draws these at 40-60px, so shipping the 1254px originals would cost megabytes for no visible
difference. Regenerate whenever an icon is redrawn:

```bash
sips -Z 160 --out src/assets/icons/cards/<name>-v1.png src/assets/icons/items/<name>-v1.png
```
