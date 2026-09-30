import type Phaser from 'phaser';

/**
 * Loads an image and caps the resolution it is kept at.
 *
 * The drawn art arrives far larger than the game ever draws it: the garden's bells are a
 * 1536×1024 painting shown 104 units wide, the light flowers 1230×1278 shown at 76. A texture
 * costs width × height × 4 bytes of GPU memory whatever size it is drawn at, so level 1 alone was
 * holding 103 MB of them — half of it in art oversampled more than tenfold. A phone answers that
 * by taking the WebGL context away mid-level, which freezes the picture (see `renderer-context.ts`
 * for what the game does when it happens); the cheapest way not to be asked is not to hold the
 * memory.
 *
 * The canvas is measured in world units, not device pixels — the backing store is the game size
 * (`viewport.ts`), so a prop drawn 360 units wide is never rasterised above 360 pixels on any
 * screen. The caps passed in here are that measured width with headroom to spare, which is why
 * this costs no visible quality.
 *
 * Only for single-frame images: an atlas or a sprite sheet carries frame coordinates that a
 * resize would invalidate.
 */
export function loadCappedImage(
  scene: Phaser.Scene,
  key: string,
  url: string,
  maxSize: number,
): void {
  // Call it from `preload`: the texture is replaced the moment it lands, before anything has been
  // built from it. A key the manager already holds is never fetched again and so never reports
  // complete, so that one is capped on the spot instead.
  if (scene.textures.exists(key)) {
    capTexture(scene, key, maxSize);
    return;
  }
  scene.load.image(key, url);
  scene.load.once(`filecomplete-image-${key}`, () => capTexture(scene, key, maxSize));
}

function capTexture(scene: Phaser.Scene, key: string, maxSize: number): void {
  const source = scene.textures.get(key)?.source[0];
  const image = source?.image as CanvasImageSource | undefined;
  if (!source || !image) return;

  const scale = maxSize / Math.max(source.width, source.height);
  if (scale >= 1) return;

  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = halve(image, source.width, source.height, width, height);
  if (!canvas) return;

  scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}

/**
 * Halves the picture until one more step would overshoot, then lands on the target.
 *
 * A single draw straight down from 1536 to 256 samples four pixels in sixty and speckles the
 * result; stepping keeps every pixel of the original contributing to the one that replaces it.
 * The first step reads the loaded image directly — copying it at full size first would cost more
 * than every reduction after it put together, and this runs while the level is loading.
 */
function halve(
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement | null {
  let source = image;
  let width = sourceWidth;
  let height = sourceHeight;
  while (width > targetWidth * 2 && height > targetHeight * 2) {
    width = Math.max(targetWidth, Math.round(width / 2));
    height = Math.max(targetHeight, Math.round(height / 2));
    const step = drawInto(source, width, height);
    if (!step) return null;
    source = step;
  }
  return drawInto(source, targetWidth, targetHeight);
}

function drawInto(
  source: CanvasImageSource,
  width: number,
  height: number,
): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, width, height);
  return canvas;
}
