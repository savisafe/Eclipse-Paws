import Phaser from 'phaser';
import type { CatId } from '@core/index';
import lumusAbility from '../../assets/sprites/heroes/cards/lumus-ability-v1.png?url';
import lumusAttack from '../../assets/sprites/heroes/cards/lumus-attack-v1.png?url';
import lumusIdle from '../../assets/sprites/heroes/cards/lumus-idle-v1.png?url';
import lumusJump from '../../assets/sprites/heroes/cards/lumus-jump-v1.png?url';
import lumusRunContact from '../../assets/sprites/heroes/cards/lumus-run-contact-v1.png?url';
import lumusRunPassing from '../../assets/sprites/heroes/cards/lumus-run-passing-v1.png?url';
import noxAbility from '../../assets/sprites/heroes/cards/nox-ability-v1.png?url';
import noxAttack from '../../assets/sprites/heroes/cards/nox-attack-v1.png?url';
import noxIdle from '../../assets/sprites/heroes/cards/nox-idle-v1.png?url';
import noxJump from '../../assets/sprites/heroes/cards/nox-jump-v1.png?url';
import noxRunContact from '../../assets/sprites/heroes/cards/nox-run-contact-v1.png?url';
import noxRunPassing from '../../assets/sprites/heroes/cards/nox-run-passing-v1.png?url';
import lightBeamIcon from '../../assets/icons/cards/lumus-light-beam-v1.png?url';
import shadowNeedlesIcon from '../../assets/icons/cards/nox-shadow-needles-v1.png?url';

export const ATLAS_TEXTURE_KEY = 'painted-character-atlas';
export const CAT_DISPLAY_SCALE = 0.7;

type CatPose = 'ability' | 'attack' | 'idle' | 'jump';

// The cats are built from their canonical drawn poses in `src/assets/sprites/heroes` — six per
// cat, in this order. The old build sliced them out of `eclipse-paws-character-atlas-v1.png`, a
// legacy sheet the art index marks as superseded, which is why the cats used to look nothing like
// their reference art.
const POSE_SOURCES: readonly { key: string; url: string }[] = [
  { key: 'hero-lumus-idle', url: lumusIdle },
  { key: 'hero-lumus-run-contact', url: lumusRunContact },
  { key: 'hero-lumus-run-passing', url: lumusRunPassing },
  { key: 'hero-lumus-jump', url: lumusJump },
  { key: 'hero-lumus-attack', url: lumusAttack },
  { key: 'hero-lumus-ability', url: lumusAbility },
  { key: 'hero-nox-idle', url: noxIdle },
  { key: 'hero-nox-run-contact', url: noxRunContact },
  { key: 'hero-nox-run-passing', url: noxRunPassing },
  { key: 'hero-nox-jump', url: noxJump },
  { key: 'hero-nox-attack', url: noxAttack },
  { key: 'hero-nox-ability', url: noxAbility },
];

const CELL = 320;
const COLUMNS = 6;
const NORMALIZED_CAT_HEIGHT = 170;
const MAX_CAT_WIDTH = 292;

const CAT_FRAMES: Readonly<Record<CatId, Readonly<Record<CatPose, number>>>> = {
  luma: { idle: 0, jump: 3, attack: 4, ability: 5 },
  nox: { idle: 6, jump: 9, attack: 10, ability: 11 },
};

// Ability effects are drawn art too: the light-beam and shadow-needle icons stand in for the
// flashes those abilities leave behind.
export const EFFECT_TEXTURES = {
  lightBeam: 'effect-light-beam',
  shadowNeedles: 'effect-shadow-needles',
} as const;

export function preloadSpriteAtlas(scene: Phaser.Scene): void {
  POSE_SOURCES.forEach(({ key, url }) => scene.load.image(key, url));
  scene.load.image(EFFECT_TEXTURES.lightBeam, lightBeamIcon);
  scene.load.image(EFFECT_TEXTURES.shadowNeedles, shadowNeedlesIcon);
}

interface Bounds {
  height: number;
  width: number;
  x: number;
  y: number;
}

// The drawn poses sit on a tall, mostly empty canvas, so each one is trimmed to the cat itself
// before it goes into the atlas — otherwise the transparent margin eats most of the cell and the
// cats come out tiny.
function trimToContent(source: CanvasImageSource & { height: number; width: number }): Bounds {
  const trimmer = document.createElement('canvas');
  trimmer.width = source.width;
  trimmer.height = source.height;
  const context = trimmer.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D is required to trim a hero pose.');
  context.drawImage(source, 0, 0);
  const { data } = context.getImageData(0, 0, source.width, source.height);
  const visited = new Uint8Array(source.width * source.height);
  const stack = new Int32Array(source.width * source.height);
  let largest: Bounds | null = null;
  let largestSize = 0;

  for (let start = 0; start < visited.length; start += 1) {
    if (visited[start] || (data[start * 4 + 3] ?? 0) <= 12) continue;
    let stackSize = 1;
    let componentSize = 0;
    let minX = source.width;
    let minY = source.height;
    let maxX = -1;
    let maxY = -1;
    stack[0] = start;
    visited[start] = 1;

    while (stackSize > 0) {
      const index = stack[(stackSize -= 1)] ?? 0;
      const x = index % source.width;
      const y = Math.floor(index / source.width);
      componentSize += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      const neighbours = [index - 1, index + 1, index - source.width, index + source.width];
      neighbours.forEach((next, direction) => {
        if (
          next < 0 ||
          next >= visited.length ||
          visited[next] ||
          (direction === 0 && x === 0) ||
          (direction === 1 && x === source.width - 1) ||
          (data[next * 4 + 3] ?? 0) <= 12
        )
          return;
        visited[next] = 1;
        stack[stackSize] = next;
        stackSize += 1;
      });
    }

    if (componentSize > largestSize) {
      largestSize = componentSize;
      largest = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
    }
  }

  if (!largest) {
    return { x: 0, y: 0, width: source.width, height: source.height };
  }
  return largest;
}

export function prepareSpriteAtlas(scene: Phaser.Scene): void {
  if (scene.textures.exists(ATLAS_TEXTURE_KEY)) return;
  const atlas = document.createElement('canvas');
  atlas.width = CELL * COLUMNS;
  atlas.height = CELL * 2;
  const context = atlas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is required to prepare the hero atlas.');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const poses = POSE_SOURCES.map(({ key }) => {
    const source = scene.textures.get(key).getSourceImage() as CanvasImageSource & {
      height: number;
      width: number;
    };
    return { bounds: trimToContent(source), source };
  });

  poses.forEach(({ bounds, source }, frame) => {
    // Height represents the cat's scale more reliably than its longest dimension: running and
    // attack poses are naturally wide because of the tail and stretched legs. Keep the same
    // visible height in every pose, with a safety cap for unusually wide artwork.
    const scale = Math.min(NORMALIZED_CAT_HEIGHT / bounds.height, MAX_CAT_WIDTH / bounds.width);
    const width = bounds.width * scale;
    const height = bounds.height * scale;
    const column = frame % COLUMNS;
    const row = Math.floor(frame / COLUMNS);
    context.drawImage(
      source,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      column * CELL + (CELL - width) / 2,
      // Sit the cat on the bottom of its cell so idle, run and jump share one ground line.
      row * CELL + (CELL - height) - 10,
      width,
      height,
    );
  });

  const texture = scene.textures.addCanvas(ATLAS_TEXTURE_KEY, atlas);
  if (!texture) throw new Error('Could not register the hero atlas.');
  POSE_SOURCES.forEach((_, frame) => {
    const column = frame % COLUMNS;
    const row = Math.floor(frame / COLUMNS);
    texture.add(frame, 0, column * CELL, row * CELL, CELL, CELL);
  });
  POSE_SOURCES.forEach(({ key }) => scene.textures.remove(key));
}

export function createAtlasAnimations(scene: Phaser.Scene): void {
  const animations = [
    { key: 'luma-run', frames: [1, 2], frameRate: 9 },
    { key: 'nox-run', frames: [7, 8], frameRate: 9 },
  ] as const;

  animations.forEach((animation) => {
    if (scene.anims.exists(animation.key)) return;
    scene.anims.create({
      key: animation.key,
      frames: animation.frames.map((frame) => ({ key: ATLAS_TEXTURE_KEY, frame })),
      frameRate: animation.frameRate,
      repeat: -1,
      yoyo: true,
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

// The canonical hero art faces left. Keep that art-specific detail here so movement, following
// and switching all agree on which visual flip represents a world-space direction.
export function setCatFacing(sprite: Phaser.Physics.Arcade.Sprite, direction: -1 | 1): void {
  sprite.setFlipX(direction > 0);
}

export function catFacing(sprite: Phaser.Physics.Arcade.Sprite): -1 | 1 {
  return sprite.flipX ? 1 : -1;
}
