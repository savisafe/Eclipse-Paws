import Phaser from 'phaser';
import forestAtlasUrl from '../../assets/sprites/forest-enemy-animation-atlas-v1.png?url';
import libraryAtlasUrl from '../../assets/sprites/library-enemy-animation-atlas-v1.png?url';
import {
  createEnemyAnimations,
  prepareAnimatedEnemyAtlas,
  type AnimatedEnemyFrames,
} from './animated-enemy-atlas';

const FOREST_SOURCE = 'forest-enemy-animation-source';
const LIBRARY_SOURCE = 'library-enemy-animation-source';
const FOREST_TEXTURE = 'forest-enemy-animation';
const LIBRARY_TEXTURE = 'library-enemy-animation';

function frames(texture: string, column: number): AnimatedEnemyFrames {
  return { texture, idle: column, move: 4 + column, attack: 8 + column };
}

export const STAGE4_ENEMY_FRAMES: Readonly<Record<string, AnimatedEnemyFrames>> = {
  'thorn-stalker': frames(FOREST_TEXTURE, 0),
  'lantern-moth': frames(FOREST_TEXTURE, 1),
  'elder-spore': frames(FOREST_TEXTURE, 2),
  'great-mushroom': frames(FOREST_TEXTURE, 3),
  'mirror-harpy': frames(LIBRARY_TEXTURE, 0),
  'ink-sprite': frames(LIBRARY_TEXTURE, 1),
  'echo-owl': frames(LIBRARY_TEXTURE, 2),
  'archivist-echo': frames(LIBRARY_TEXTURE, 3),
};

export function preloadStage4EnemyAtlas(scene: Phaser.Scene): void {
  scene.load.image(FOREST_SOURCE, forestAtlasUrl);
  scene.load.image(LIBRARY_SOURCE, libraryAtlasUrl);
}

export function prepareStage4EnemyAtlas(scene: Phaser.Scene): void {
  prepareAnimatedEnemyAtlas(scene, FOREST_SOURCE, FOREST_TEXTURE);
  prepareAnimatedEnemyAtlas(scene, LIBRARY_SOURCE, LIBRARY_TEXTURE);
  createEnemyAnimations(scene, STAGE4_ENEMY_FRAMES);
}
