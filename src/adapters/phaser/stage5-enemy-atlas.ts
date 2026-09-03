import Phaser from 'phaser';
import enemyAtlasUrl from '../../assets/sprites/stage5-enemy-atlas-v1.png?url';

export const STAGE5_ENEMY_TEXTURE = 'stage5-enemy-atlas';
const SOURCE_KEY = 'stage5-enemy-atlas-source';

export const STAGE5_ENEMY_FRAMES: Readonly<Record<string, number>> = {
  'clockwork-mite': 0,
  'eclipse-knight': 1,
  'pendulum-wraith': 2,
  'fortress-golem': 3,
  'dawn-fragment': 4,
  'void-maw': 5,
  'eclipse-sentinel': 6,
  'dawn-devourer': 7,
};

export function preloadStage5EnemyAtlas(scene: Phaser.Scene): void {
  scene.load.image(SOURCE_KEY, enemyAtlasUrl);
}

export function prepareStage5EnemyAtlas(scene: Phaser.Scene): void {
  const source = scene.textures.get(SOURCE_KEY).getSourceImage() as CanvasImageSource;
  const working = document.createElement('canvas');
  working.width = 1536;
  working.height = 1024;
  const context = working.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D is required for the stage 5 enemy atlas.');
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
  if (!atlasContext) throw new Error('Canvas 2D is required to normalize stage 5 frames.');
  for (let frame = 0; frame < 8; frame += 1) {
    atlasContext.drawImage(
      working,
      (frame % 4) * 384,
      Math.floor(frame / 4) * 512,
      384,
      512,
      (frame % 4) * 256 + 32,
      Math.floor(frame / 4) * 256,
      192,
      256,
    );
  }
  const texture = scene.textures.addCanvas(STAGE5_ENEMY_TEXTURE, atlas);
  if (!texture) throw new Error('Could not register stage 5 enemy atlas.');
  for (let frame = 0; frame < 8; frame += 1) {
    texture.add(frame, 0, (frame % 4) * 256, Math.floor(frame / 4) * 256, 256, 256);
  }
  scene.textures.remove(SOURCE_KEY);
}
