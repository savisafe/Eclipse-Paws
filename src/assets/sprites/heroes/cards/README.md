# Hero cards

In-game-size copies of the canonical hero poses in `src/assets/sprites/heroes/`, downscaled to
300px tall. The platformer draws a cat about 150px tall, so the full-resolution originals cost
megabytes of download for no visible difference. Regenerate whenever a pose is redrawn:

```bash
sips -Z 300 --out src/assets/sprites/heroes/cards/<hero>-<pose>-v1.png \
  src/assets/sprites/heroes/<hero>-<pose>-v1.png
```
