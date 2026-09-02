import Phaser from 'phaser';
import spriteAtlasUrl from '../../assets/sprites/eclipse-paws-character-atlas-v1.png?url';
import type { CatId } from '@core/index';

export const ATLAS_TEXTURE_KEY = 'painted-character-atlas';
const ATLAS_SOURCE_KEY = 'painted-character-atlas-source';

type CatPose = 'ability' | 'attack' | 'idle' | 'jump';

const CAT_FRAMES: Readonly<Record<CatId, Readonly<Record<CatPose, number>>>> = {
  luma: { idle: 0, jump: 3, attack: 4, ability: 5 },
  nox: { idle: 6, jump: 9, attack: 10, ability: 11 },
};

interface MonsterFrameSet {
  attack: number;
  idle: number;
  move: number;
}

export const MONSTER_FRAMES: Readonly<Record<string, MonsterFrameSet>> = {
  shadefang: { idle: 12, move: 13, attack: 18 },
  'spore-beast': { idle: 14, move: 15, attack: 19 },
  'twilight-golem': { idle: 14, move: 15, attack: 19 },
  'light-wisp': { idle: 16, move: 17, attack: 20 },
};

export const EFFECT_FRAMES = { lightning: 21, shadowSpikes: 22 } as const;

interface SourceCrop {
  height: number;
  width: number;
  x: number;
  y: number;
  yOffset?: number;
}

const SOURCE_CROPS: readonly (SourceCrop | null)[] = [
  { x: 0, y: 0, width: 280, height: 300 },
  { x: 280, y: 0, width: 370, height: 300 },
  { x: 280, y: 0, width: 370, height: 300, yOffset: 5 },
  { x: 650, y: 0, width: 320, height: 300 },
  { x: 930, y: 0, width: 330, height: 300 },
  { x: 1210, y: 0, width: 326, height: 300 },
  { x: 0, y: 270, width: 290, height: 300 },
  { x: 285, y: 270, width: 370, height: 300 },
  { x: 285, y: 270, width: 370, height: 300, yOffset: 5 },
  { x: 650, y: 270, width: 320, height: 300 },
  { x: 940, y: 270, width: 320, height: 300 },
  { x: 1210, y: 270, width: 326, height: 300 },
  { x: 0, y: 550, width: 300, height: 220 },
  { x: 270, y: 550, width: 360, height: 220 },
  { x: 600, y: 540, width: 260, height: 230 },
  { x: 840, y: 540, width: 270, height: 230 },
  { x: 1080, y: 570, width: 250, height: 200 },
  { x: 1290, y: 570, width: 246, height: 200 },
  { x: 0, y: 750, width: 320, height: 274 },
  { x: 285, y: 750, width: 330, height: 274 },
  { x: 600, y: 750, width: 300, height: 274 },
  { x: 875, y: 750, width: 260, height: 274 },
  { x: 1100, y: 750, width: 280, height: 274 },
  null,
];

function isBackgroundPixel(data: Uint8ClampedArray, offset: number): boolean {
  const red = data[offset] ?? 0;
  const green = data[offset + 1] ?? 0;
  const blue = data[offset + 2] ?? 0;
  return (
    Math.min(red, green, blue) >= 238 &&
    Math.max(red, green, blue) - Math.min(red, green, blue) <= 5
  );
}

function removeConnectedCheckerboard(image: ImageData): void {
  const { data, width, height } = image;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const enqueue = (index: number) => {
    if (visited[index] === 1 || !isBackgroundPixel(data, index * 4)) return;
    visited[index] = 1;
    queue[tail] = index;
    tail += 1;
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
    const index = queue[head] ?? 0;
    head += 1;
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

function createNormalizedAtlas(source: HTMLCanvasElement): HTMLCanvasElement {
  const atlas = document.createElement('canvas');
  atlas.width = 1536;
  atlas.height = 1024;
  const context = atlas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is required to normalize sprite frames.');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  SOURCE_CROPS.forEach((crop, frame) => {
    if (!crop) return;
    const column = frame % 6;
    const row = Math.floor(frame / 6);
    const maximumSize = frame >= 21 ? 244 : 226;
    const scale = Math.min(maximumSize / crop.width, maximumSize / crop.height);
    const width = crop.width * scale;
    const height = crop.height * scale;
    const x = column * 256 + (256 - width) / 2;
    const y = row * 256 + (256 - height) / 2 + (crop.yOffset ?? 0);
    context.drawImage(source, crop.x, crop.y, crop.width, crop.height, x, y, width, height);
  });
  return atlas;
}

export function preloadSpriteAtlas(scene: Phaser.Scene): void {
  scene.load.image(ATLAS_SOURCE_KEY, spriteAtlasUrl);
}

export function prepareSpriteAtlas(scene: Phaser.Scene): void {
  const source = scene.textures.get(ATLAS_SOURCE_KEY).getSourceImage() as CanvasImageSource;
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 1024;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D is required to prepare the sprite atlas.');
  context.drawImage(source, 0, 0);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  removeConnectedCheckerboard(image);
  context.putImageData(image, 0, 0);
  const normalizedAtlas = createNormalizedAtlas(canvas);
  const processedTexture = scene.textures.addCanvas(ATLAS_TEXTURE_KEY, normalizedAtlas);
  if (!processedTexture) throw new Error('Could not register the processed sprite atlas.');
  for (let frame = 0; frame < 24; frame += 1) {
    const column = frame % 6;
    const row = Math.floor(frame / 6);
    processedTexture.add(frame, 0, column * 256, row * 256, 256, 256);
  }
  scene.textures.remove(ATLAS_SOURCE_KEY);
}

export function createAtlasAnimations(scene: Phaser.Scene): void {
  const animations = [
    { key: 'luma-run', frames: [1, 2], frameRate: 9 },
    { key: 'nox-run', frames: [7, 8], frameRate: 9 },
    { key: 'shadefang-move', frames: [12, 13], frameRate: 8 },
    { key: 'spore-beast-move', frames: [14, 15], frameRate: 5 },
    { key: 'twilight-golem-move', frames: [14, 15], frameRate: 3 },
    { key: 'light-wisp-move', frames: [16, 17], frameRate: 7 },
  ] as const;

  animations.forEach((animation) => {
    if (scene.anims.exists(animation.key)) return;
    scene.anims.create({
      key: animation.key,
      frames: animation.frames.map((frame) => ({ key: ATLAS_TEXTURE_KEY, frame })),
      frameRate: animation.frameRate,
      repeat: -1,
    });
  });
}

export function setCatPose(
  sprite: Phaser.Physics.Arcade.Sprite,
  catId: CatId,
  pose: CatPose,
): void {
  sprite.setTexture(ATLAS_TEXTURE_KEY, CAT_FRAMES[catId][pose]);
}
