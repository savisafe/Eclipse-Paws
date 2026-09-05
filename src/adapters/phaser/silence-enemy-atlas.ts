import Phaser from 'phaser';
import houndIdleUrl from '../../assets/sprites/enemies/hound-of-silence-idle-v1.png?url';
import houndLeapUrl from '../../assets/sprites/enemies/hound-of-silence-leap-v1.png?url';
import houndTelegraphUrl from '../../assets/sprites/enemies/hound-of-silence-telegraph-v1.png?url';
import { createEnemyAnimations, type AnimatedEnemyFrames } from './animated-enemy-atlas';

// The hounds of Silence (ECLIPSE_PAWS_SCENARIO.md §12, «Перелом») ship as three separate
// transparent PNGs rather than one strip, so they skip `prepareAnimatedEnemyAtlas`'s
// white-background slicing and are simply composed into a 3-cell canvas atlas here.
const SOURCES = [
  { key: 'hound-of-silence-idle', url: houndIdleUrl },
  { key: 'hound-of-silence-leap', url: houndLeapUrl },
  { key: 'hound-of-silence-telegraph', url: houndTelegraphUrl },
] as const;

const TEXTURE = 'silence-enemy-animation';
const CELL = 256;

const HOUND_FRAMES: AnimatedEnemyFrames = { texture: TEXTURE, idle: 0, move: 1, attack: 2 };

export const SILENCE_ENEMY_FRAMES: Readonly<Record<string, AnimatedEnemyFrames>> = {
  'silence-hound': HOUND_FRAMES,
  'silence-hound-alpha': HOUND_FRAMES,
};

export function preloadSilenceEnemyAtlas(scene: Phaser.Scene): void {
  SOURCES.forEach(({ key, url }) => scene.load.image(key, url));
}

export function prepareSilenceEnemyAtlas(scene: Phaser.Scene): void {
  if (!scene.textures.exists(TEXTURE)) {
    const output = document.createElement('canvas');
    output.width = CELL * SOURCES.length;
    output.height = CELL;
    const context = output.getContext('2d');
    if (!context) throw new Error('Canvas 2D is required for the Silence enemy atlas.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    SOURCES.forEach(({ key }, column) => {
      const source = scene.textures.get(key).getSourceImage() as CanvasImageSource & {
        width: number;
        height: number;
      };
      const scale = Math.min((CELL - 24) / source.width, (CELL - 24) / source.height, 1);
      const width = source.width * scale;
      const height = source.height * scale;
      context.drawImage(
        source,
        column * CELL + (CELL - width) / 2,
        (CELL - height) / 2,
        width,
        height,
      );
    });

    const texture = scene.textures.addCanvas(TEXTURE, output);
    if (!texture) throw new Error('Could not register the Silence enemy atlas.');
    SOURCES.forEach((_, column) => texture.add(column, 0, column * CELL, 0, CELL, CELL));
    SOURCES.forEach(({ key }) => scene.textures.remove(key));
  }
  createEnemyAnimations(scene, SILENCE_ENEMY_FRAMES);
}
