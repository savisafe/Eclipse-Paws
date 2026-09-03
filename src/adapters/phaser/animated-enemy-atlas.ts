import Phaser from 'phaser';

export interface AnimatedEnemyFrames {
  attack: number;
  idle: number;
  move: number;
  texture: string;
}

function isWhiteBackground(data: Uint8ClampedArray, offset: number): boolean {
  const red = data[offset] ?? 0;
  const green = data[offset + 1] ?? 0;
  const blue = data[offset + 2] ?? 0;
  return (
    Math.min(red, green, blue) >= 242 &&
    Math.max(red, green, blue) - Math.min(red, green, blue) <= 14
  );
}

function clearConnectedBackground(image: ImageData): void {
  const { data, width, height } = image;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const enqueue = (index: number) => {
    if (visited[index] === 1 || !isWhiteBackground(data, index * 4)) return;
    visited[index] = 1;
    queue[tail++] = index;
  };
  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }
  while (head < tail) {
    const index = queue[head++] ?? 0;
    const x = index % width;
    if (x > 0) enqueue(index - 1);
    if (x < width - 1) enqueue(index + 1);
    if (index >= width) enqueue(index - width);
    if (index < width * (height - 1)) enqueue(index + width);
  }
  for (let index = 0; index < visited.length; index += 1) {
    if (visited[index] === 1) data[index * 4 + 3] = 0;
  }
}

export function prepareAnimatedEnemyAtlas(
  scene: Phaser.Scene,
  sourceKey: string,
  textureKey: string,
  columns = 4,
): void {
  if (scene.textures.exists(textureKey)) return;
  const source = scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
  const sourceWidth = source.naturalWidth || source.width;
  const sourceHeight = source.naturalHeight || source.height;
  const output = document.createElement('canvas');
  output.width = columns * 256;
  output.height = 768;
  const outputContext = output.getContext('2d');
  if (!outputContext) throw new Error('Canvas 2D is required for animated enemy sprites.');
  outputContext.imageSmoothingEnabled = true;
  outputContext.imageSmoothingQuality = 'high';

  for (let row = 0; row < 3; row += 1) {
    const sourceY = Math.round((row * sourceHeight) / 3);
    const nextY = Math.round(((row + 1) * sourceHeight) / 3);
    for (let column = 0; column < columns; column += 1) {
      const cell = document.createElement('canvas');
      cell.width = Math.round(sourceWidth / columns);
      cell.height = nextY - sourceY;
      const cellContext = cell.getContext('2d', { willReadFrequently: true });
      if (!cellContext) throw new Error('Canvas 2D is required for enemy frame cleanup.');
      cellContext.drawImage(
        source,
        Math.round((column * sourceWidth) / columns),
        sourceY,
        Math.round(((column + 1) * sourceWidth) / columns) -
          Math.round((column * sourceWidth) / columns),
        cell.height,
        0,
        0,
        cell.width,
        cell.height,
      );
      const image = cellContext.getImageData(0, 0, cell.width, cell.height);
      clearConnectedBackground(image);
      cellContext.putImageData(image, 0, 0);
      outputContext.drawImage(cell, column * 256, row * 256, 256, 256);
    }
  }

  const texture = scene.textures.addCanvas(textureKey, output);
  if (!texture) throw new Error(`Could not register animated enemy atlas: ${textureKey}`);
  for (let frame = 0; frame < columns * 3; frame += 1) {
    texture.add(frame, 0, (frame % columns) * 256, Math.floor(frame / columns) * 256, 256, 256);
  }
  scene.textures.remove(sourceKey);
}

export function createEnemyAnimations(
  scene: Phaser.Scene,
  entries: Readonly<Record<string, AnimatedEnemyFrames>>,
): void {
  Object.entries(entries).forEach(([enemyId, frames]) => {
    const moveKey = `${enemyId}-move`;
    const attackKey = `${enemyId}-attack`;
    if (!scene.anims.exists(moveKey)) {
      scene.anims.create({
        key: moveKey,
        frames: [frames.idle, frames.move].map((frame) => ({ key: frames.texture, frame })),
        frameRate: 5,
        repeat: -1,
        yoyo: true,
      });
    }
    if (!scene.anims.exists(attackKey)) {
      scene.anims.create({
        key: attackKey,
        frames: [frames.attack, frames.idle].map((frame) => ({ key: frames.texture, frame })),
        frameRate: 7,
        repeat: 0,
      });
    }
  });
}
