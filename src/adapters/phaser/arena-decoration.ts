import Phaser from 'phaser';
import type { CampaignLevelDefinition } from '@content/index';
import gardenBackgroundUrl from '../../assets/environments/garden-first-dawn-background-v1.png?url';
import gardenPlatformUrl from '../../assets/environments/garden-stone-platform-tile-v1.png?url';
import forestBackgroundUrl from '../../assets/environments/whispering-forest-background-v1.png?url';
import libraryBackgroundUrl from '../../assets/environments/celestial-library-background-v1.png?url';
import fortressBackgroundUrl from '../../assets/environments/clock-fortress-background-v1.png?url';
import eclipseBackgroundUrl from '../../assets/environments/eclipse-heart-background-v1.png?url';

export const PLATFORMER_WORLD_HEIGHT = 720;

const BACKGROUNDS: Record<CampaignLevelDefinition['background'], string> = {
  garden: gardenBackgroundUrl,
  forest: forestBackgroundUrl,
  library: libraryBackgroundUrl,
  fortress: fortressBackgroundUrl,
  eclipse: eclipseBackgroundUrl,
};

export function preloadEnvironment(scene: Phaser.Scene, level: CampaignLevelDefinition): void {
  scene.load.image('level-background', BACKGROUNDS[level.background]);
  scene.load.image('garden-platform-tile', gardenPlatformUrl);
}

function addParallax(scene: Phaser.Scene): void {
  scene.add
    .image(640, 360, 'level-background')
    .setDisplaySize(1280, 720)
    .setScrollFactor(0)
    .setDepth(-30);
  scene.add.rectangle(640, 360, 1280, 720, 0x173447, 0.08).setScrollFactor(0).setDepth(-20);
}

export interface PlatformerWorldView {
  phaseOverlay: Phaser.GameObjects.Rectangle;
  platforms: Phaser.Physics.Arcade.StaticGroup;
}

export function drawArena(
  scene: Phaser.Scene,
  level: CampaignLevelDefinition,
): PlatformerWorldView {
  addParallax(scene);
  const platforms = scene.physics.add.staticGroup();

  level.platforms.forEach((platform) => {
    if (platform.height < 40) {
      scene.add
        .rectangle(platform.x + 7, platform.y + 12, platform.width, platform.height, 0x081a1a, 0.55)
        .setDepth(0);
    }
    const tile = scene.add
      .tileSprite(platform.x, platform.y, platform.width, platform.height, 'garden-platform-tile')
      .setTileScale(0.24)
      .setDepth(1);
    if (level.background === 'forest') tile.setTint(0x7795aa);
    if (level.background === 'library') tile.setTint(0xd7d6ee);
    if (level.background === 'fortress') tile.setTint(0x8f7e72);
    if (level.background === 'eclipse') tile.setTint(0x8b7bb6);
    scene.physics.add.existing(tile, true);
    platforms.add(tile);
  });

  scene.add
    .text(95, 70, `${level.title.toUpperCase()} · УРОВЕНЬ ${level.index}`, {
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
    .text(95, 105, `ЦЕЛЬ: ${level.objective}`, {
      color: '#fff8dd',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      stroke: '#142235',
      strokeThickness: 4,
    })
    .setScrollFactor(0.65);

  const phaseOverlay = scene.add
    .rectangle(0, 0, level.worldWidth, PLATFORMER_WORLD_HEIGHT, 0x251c52, 0)
    .setOrigin(0)
    .setDepth(20);
  return { phaseOverlay, platforms };
}

export function drawCheckpoints(scene: Phaser.Scene, level: CampaignLevelDefinition): void {
  level.checkpoints.forEach((point, index) => {
    scene.add.image(point.x, point.y, 'checkpoint').setAlpha(0.8).setDepth(3);
    scene.add
      .text(
        point.x,
        point.y - 62,
        index === 0 ? 'Начало' : index === 1 ? 'Контрольная точка' : 'Осколок · ФИНИШ',
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
