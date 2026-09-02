import Phaser from 'phaser';
import enemyAtlasUrl from '../../assets/sprites/stage4-enemy-atlas-v1.png?url';

export const STAGE4_ENEMY_TEXTURE = 'stage4-enemy-atlas';
const SOURCE_KEY = 'stage4-enemy-atlas-source';

export const STAGE4_ENEMY_FRAMES: Readonly<Record<string, number>> = {
  'thorn-stalker': 0,
  'lantern-moth': 1,
  'elder-spore': 2,
  'great-mushroom': 3,
  'mirror-harpy': 4,
  'ink-sprite': 5,
  'echo-owl': 6,
  'archivist-echo': 7,
};

export function preloadStage4EnemyAtlas(scene: Phaser.Scene): void {
  scene.load.image(SOURCE_KEY, enemyAtlasUrl);
}

export function prepareStage4EnemyAtlas(scene: Phaser.Scene): void {
  const source = scene.textures.get(SOURCE_KEY).getSourceImage() as CanvasImageSource;
  const working = document.createElement('canvas');
  working.width = 1536;
  working.height = 1024;
  const context = working.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D is required for the enemy atlas.');
  context.drawImage(source, 0, 0);
  const image = context.getImageData(0, 0, working.width, working.height);
  const data = image.data;
  for (let offset = 0; offset < data.length; offset += 4) {
    const red = data[offset] ?? 0;
    const green = data[offset + 1] ?? 0;
    const blue = data[offset + 2] ?? 0;
    if (
      Math.min(red, green, blue) > 244 &&
      Math.max(red, green, blue) - Math.min(red, green, blue) < 8
    ) {
      data[offset + 3] = 0;
    }
  }
  context.putImageData(image, 0, 0);

  const atlas = document.createElement('canvas');
  atlas.width = 1024;
  atlas.height = 512;
  const atlasContext = atlas.getContext('2d');
  if (!atlasContext) throw new Error('Canvas 2D is required to normalize enemy frames.');
  for (let frame = 0; frame < 8; frame += 1) {
    const sourceX = (frame % 4) * 384;
    const sourceY = Math.floor(frame / 4) * 512;
    const targetX = (frame % 4) * 256 + 32;
    const targetY = Math.floor(frame / 4) * 256;
    atlasContext.drawImage(working, sourceX, sourceY, 384, 512, targetX, targetY, 192, 256);
  }
  const texture = scene.textures.addCanvas(STAGE4_ENEMY_TEXTURE, atlas);
  if (!texture) throw new Error('Could not register stage 4 enemy atlas.');
  for (let frame = 0; frame < 8; frame += 1) {
    texture.add(frame, 0, (frame % 4) * 256, Math.floor(frame / 4) * 256, 256, 256);
  }
  scene.textures.remove(SOURCE_KEY);
}
