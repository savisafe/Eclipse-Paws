import Phaser from 'phaser';
import { PROTOTYPE_SPAWNS } from '@content/index';
import gardenBackgroundUrl from '../../assets/environments/garden-first-dawn-background-v1.png?url';
import gardenPlatformUrl from '../../assets/environments/garden-stone-platform-tile-v1.png?url';

export const PLATFORMER_WORLD = { width: 5200, height: 720 } as const;

const PLATFORM_RECTS = [
  { x: 350, y: 670, width: 700, height: 100 },
  { x: 1045, y: 670, width: 410, height: 100 },
  { x: 1625, y: 670, width: 550, height: 100 },
  { x: 2170, y: 670, width: 360, height: 100 },
  { x: 2630, y: 670, width: 380, height: 100 },
  { x: 3150, y: 670, width: 500, height: 100 },
  { x: 600, y: 545, width: 250, height: 26 },
  { x: 980, y: 435, width: 210, height: 30 },
  { x: 1325, y: 535, width: 180, height: 30 },
  { x: 1640, y: 570, width: 150, height: 24 },
  { x: 1810, y: 520, width: 270, height: 28 },
  { x: 2310, y: 520, width: 230, height: 30 },
  { x: 2780, y: 425, width: 230, height: 30 },
  { x: 3650, y: 670, width: 500, height: 100 },
  { x: 4180, y: 670, width: 460, height: 100 },
  { x: 4810, y: 670, width: 780, height: 100 },
  { x: 3380, y: 510, width: 220, height: 28 },
  { x: 3720, y: 425, width: 220, height: 28 },
  { x: 4100, y: 535, width: 190, height: 26 },
  { x: 4520, y: 455, width: 230, height: 28 },
  { x: 4920, y: 535, width: 280, height: 28 },
] as const;

export function preloadEnvironment(scene: Phaser.Scene): void {
  scene.load.image('garden-background', gardenBackgroundUrl);
  scene.load.image('garden-platform-tile', gardenPlatformUrl);
}

function addParallax(scene: Phaser.Scene): void {
  scene.add
    .image(640, 360, 'garden-background')
    .setDisplaySize(1280, 720)
    .setScrollFactor(0)
    .setDepth(-30);
  scene.add.rectangle(640, 360, 1280, 720, 0x173447, 0.08).setScrollFactor(0).setDepth(-20);
}

export interface PlatformerWorldView {
  phaseOverlay: Phaser.GameObjects.Rectangle;
  platforms: Phaser.Physics.Arcade.StaticGroup;
}

export function drawArena(scene: Phaser.Scene): PlatformerWorldView {
  addParallax(scene);
  const platforms = scene.physics.add.staticGroup();

  PLATFORM_RECTS.forEach((platform) => {
    if (platform.height < 40) {
      scene.add
        .rectangle(platform.x + 7, platform.y + 12, platform.width, platform.height, 0x081a1a, 0.55)
        .setDepth(0);
    }
    const tile = scene.add
      .tileSprite(platform.x, platform.y, platform.width, platform.height, 'garden-platform-tile')
      .setTileScale(0.24)
      .setDepth(1);
    scene.physics.add.existing(tile, true);
    platforms.add(tile);
  });

  scene.add
    .text(95, 70, 'САД ПЕРВОЙ ЗАРИ · ПЛАТФОРМЕР', {
      color: '#fff4ce',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '21px',
      fontStyle: 'bold',
      letterSpacing: 3,
      stroke: '#1a2d39',
      strokeThickness: 5,
    })
    .setScrollFactor(0.65);
  scene.add
    .text(95, 105, 'ЦЕЛЬ: цветы 1→2→3 [E] · голем · осколок в конце сада', {
      color: '#fff8dd',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      stroke: '#142235',
      strokeThickness: 4,
    })
    .setScrollFactor(0.65);

  const phaseOverlay = scene.add
    .rectangle(0, 0, PLATFORMER_WORLD.width, PLATFORMER_WORLD.height, 0x251c52, 0)
    .setOrigin(0)
    .setDepth(20);
  return { phaseOverlay, platforms };
}

export function drawCheckpoints(scene: Phaser.Scene): void {
  PROTOTYPE_SPAWNS.checkpoints.forEach((point) => {
    scene.add.image(point.x, point.y, 'checkpoint').setAlpha(0.8).setDepth(3);
    scene.add
      .text(
        point.x,
        point.y - 62,
        point.id === 'garden-gate'
          ? 'Врата сада'
          : point.id === 'moon-well'
            ? 'Лунный колодец'
            : 'Осколок Маятника · ФИНИШ',
        {
          color: '#fff4ce',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          stroke: '#172339',
          strokeThickness: 4,
        },
      )
      .setOrigin(0.5);
  });
}
