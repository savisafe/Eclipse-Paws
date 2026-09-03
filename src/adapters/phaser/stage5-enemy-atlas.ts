import Phaser from 'phaser';
import fortressAtlasUrl from '../../assets/sprites/fortress-enemy-animation-atlas-v1.png?url';
import eclipseAtlasUrl from '../../assets/sprites/eclipse-enemy-animation-atlas-v1.png?url';
import {
  createEnemyAnimations,
  prepareAnimatedEnemyAtlas,
  type AnimatedEnemyFrames,
} from './animated-enemy-atlas';

const FORTRESS_SOURCE = 'fortress-enemy-animation-source';
const ECLIPSE_SOURCE = 'eclipse-enemy-animation-source';
const FORTRESS_TEXTURE = 'fortress-enemy-animation';
const ECLIPSE_TEXTURE = 'eclipse-enemy-animation';

function frames(texture: string, column: number): AnimatedEnemyFrames {
  return { texture, idle: column, move: 4 + column, attack: 8 + column };
}

export const STAGE5_ENEMY_FRAMES: Readonly<Record<string, AnimatedEnemyFrames>> = {
  'clockwork-mite': frames(FORTRESS_TEXTURE, 0),
  'eclipse-knight': frames(FORTRESS_TEXTURE, 1),
  'pendulum-wraith': frames(FORTRESS_TEXTURE, 2),
  'fortress-golem': frames(FORTRESS_TEXTURE, 3),
  'dawn-fragment': frames(ECLIPSE_TEXTURE, 0),
  'void-maw': frames(ECLIPSE_TEXTURE, 1),
  'eclipse-sentinel': frames(ECLIPSE_TEXTURE, 2),
  'dawn-devourer': frames(ECLIPSE_TEXTURE, 3),
};

export function preloadStage5EnemyAtlas(scene: Phaser.Scene): void {
  scene.load.image(FORTRESS_SOURCE, fortressAtlasUrl);
  scene.load.image(ECLIPSE_SOURCE, eclipseAtlasUrl);
}

export function prepareStage5EnemyAtlas(scene: Phaser.Scene): void {
  prepareAnimatedEnemyAtlas(scene, FORTRESS_SOURCE, FORTRESS_TEXTURE);
  prepareAnimatedEnemyAtlas(scene, ECLIPSE_SOURCE, ECLIPSE_TEXTURE);
  createEnemyAnimations(scene, STAGE5_ENEMY_FRAMES);
}
