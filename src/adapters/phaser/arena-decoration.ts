import Phaser from 'phaser';
import type { CampaignLevelDefinition } from '@content/index';
import gardenBackgroundUrl from '../../assets/environments/garden-first-dawn-background-v1.jpg?url';
import gardenPlatformUrl from '../../assets/environments/garden-stone-platform-tile-v1.png?url';
import forestBackgroundUrl from '../../assets/environments/whispering-forest-background-v1.jpg?url';
import libraryBackgroundUrl from '../../assets/environments/celestial-library-background-v1.jpg?url';
import fortressBackgroundUrl from '../../assets/environments/clock-fortress-background-v1.jpg?url';
import eclipseBackgroundUrl from '../../assets/environments/eclipse-heart-background-v1.jpg?url';

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

function addPlatformAccent(
  scene: Phaser.Scene,
  level: CampaignLevelDefinition,
  platform: CampaignLevelDefinition['platforms'][number],
  index: number,
): void {
  const top = platform.y - platform.height / 2;
  if (level.background === 'garden') {
    for (let offset = -platform.width / 2 + 34; offset < platform.width / 2; offset += 72) {
      scene.add
        .circle(platform.x + offset, top - 5, 4, index % 2 === 0 ? 0xffdf7b : 0x79d9ed, 0.9)
        .setDepth(3);
    }
    return;
  }
  if (level.background === 'forest') {
    const roots = scene.add.graphics().setDepth(2);
    roots.lineStyle(5, 0x334d3b, 0.9);
    for (let offset = -platform.width / 2 + 45; offset < platform.width / 2; offset += 95) {
      roots.beginPath();
      roots.moveTo(platform.x + offset, top + 5);
      roots.lineTo(platform.x + offset + 12, top + 28 + (index % 3) * 8);
      roots.lineTo(platform.x + offset - 5, top + 47 + (index % 2) * 10);
      roots.strokePath();
    }
    return;
  }
  if (level.background === 'library') {
    for (let offset = -platform.width / 2 + 38; offset < platform.width / 2; offset += 82) {
      scene.add
        .polygon(
          platform.x + offset,
          top + 3,
          [0, -8, 8, 0, 0, 8, -8, 0],
          index % 2 === 0 ? 0x9fe8ff : 0xffdc83,
          0.9,
        )
        .setDepth(3);
    }
    return;
  }
  if (level.background === 'fortress') {
    for (let offset = -platform.width / 2 + 24; offset < platform.width / 2; offset += 58) {
      scene.add
        .circle(platform.x + offset, top + 4, 5, 0x3b2e2a, 1)
        .setStrokeStyle(2, 0xffbd68, 0.85)
        .setDepth(3);
    }
    return;
  }
  for (let offset = -platform.width / 2 + 35; offset < platform.width / 2; offset += 76) {
    scene.add
      .triangle(
        platform.x + offset,
        top + 11,
        -9,
        7,
        0,
        -15 - (index % 3) * 4,
        9,
        7,
        index % 2 === 0 ? 0xb774ff : 0xffc86b,
        0.82,
      )
      .setDepth(3);
  }
}

export function drawArena(
  scene: Phaser.Scene,
  level: CampaignLevelDefinition,
): PlatformerWorldView {
  addParallax(scene);
  const platforms = scene.physics.add.staticGroup();

  level.platforms.forEach((platform, index) => {
    const edgeColor =
      level.background === 'garden'
        ? 0xf4d676
        : level.background === 'forest'
          ? 0x70e4c6
          : level.background === 'library'
            ? 0x9bdcff
            : level.background === 'fortress'
              ? 0xffb85c
              : 0xc17cff;
    scene.add
      .rectangle(
        platform.x + 8,
        platform.y + 13,
        platform.width + 10,
        platform.height + 12,
        0x050915,
        0.78,
      )
      .setStrokeStyle(3, 0x050915, 0.9)
      .setDepth(0);
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
    scene.add
      .rectangle(
        platform.x,
        platform.y - platform.height / 2 + 3,
        platform.width - 4,
        6,
        edgeColor,
        0.95,
      )
      .setStrokeStyle(2, 0xffffff, 0.24)
      .setDepth(2);
    addPlatformAccent(scene, level, platform, index);
  });

  level.coverZones.forEach((cover, index) => {
    const color =
      level.background === 'forest'
        ? 0x315d4b
        : level.background === 'library'
          ? 0x354d75
          : level.background === 'fortress'
            ? 0x55453f
            : 0x4b3269;
    scene.add
      .ellipse(cover.x, cover.y, cover.width, cover.height, color, 0.76)
      .setStrokeStyle(4, index % 2 === 0 ? 0x83e0c4 : 0xc3a8ef, 0.7)
      .setDepth(4);
    scene.add
      .text(cover.x, cover.y - cover.height / 2 - 18, 'УКРЫТИЕ · S / ↓', {
        color: '#eafff6',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        stroke: '#10152e',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(5);
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
