import Phaser from 'phaser';
import gardenAtlasUrl from '../../assets/sprites/garden-enemy-animation-atlas-v1.png?url';
import shadefangAtlasUrl from '../../assets/sprites/shadefang-animation-strip-v1.png?url';
import {
  createEnemyAnimations,
  prepareAnimatedEnemyAtlas,
  type AnimatedEnemyFrames,
} from './animated-enemy-atlas';

const SOURCE = 'garden-enemy-animation-source';
const TEXTURE = 'garden-enemy-animation';
const SHADEFANG_SOURCE = 'shadefang-animation-source';
const SHADEFANG_TEXTURE = 'shadefang-animation';

function frames(column: number): AnimatedEnemyFrames {
  return { texture: TEXTURE, idle: column, move: 4 + column, attack: 8 + column };
}

export const GARDEN_ENEMY_FRAMES: Readonly<Record<string, AnimatedEnemyFrames>> = {
  shadefang: { texture: SHADEFANG_TEXTURE, idle: 0, move: 1, attack: 2 },
  'spore-beast': frames(1),
  'light-wisp': frames(2),
  'twilight-golem': frames(3),
};

export function preloadGardenEnemyAtlas(scene: Phaser.Scene): void {
  scene.load.image(SOURCE, gardenAtlasUrl);
  scene.load.image(SHADEFANG_SOURCE, shadefangAtlasUrl);
}

export function prepareGardenEnemyAtlas(scene: Phaser.Scene): void {
  prepareAnimatedEnemyAtlas(scene, SOURCE, TEXTURE);
  prepareAnimatedEnemyAtlas(scene, SHADEFANG_SOURCE, SHADEFANG_TEXTURE, 1);
  createEnemyAnimations(scene, GARDEN_ENEMY_FRAMES);
}
