import Phaser from 'phaser';
import type { CampaignLevelDefinition } from '@content/index';
import gardenPlatformUrl from '../../assets/environments/garden-stone-platform-tile-v1.png?url';
import { environmentForLevel } from './dream-environment-manifest';

export const PLATFORMER_WORLD_HEIGHT = 720;

export function preloadEnvironment(scene: Phaser.Scene, level: CampaignLevelDefinition): void {
  scene.load.image('level-background', environmentForLevel(level.index).imageUrl);
  scene.load.image('garden-platform-tile', gardenPlatformUrl);
}

function addParallax(
  scene: Phaser.Scene,
  level: CampaignLevelDefinition,
  reducedMotion: boolean,
): void {
  const art = environmentForLevel(level.index);
  const background = scene.add
    .image(640, 360, 'level-background')
    .setDisplaySize(1296, 729)
    .setScrollFactor(0)
    .setDepth(-30);
  const glow = scene.add
    .ellipse(640, 315, 900, 430, art.accent, 0.045)
    .setScrollFactor(0.035)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(-25);
  const motes = Array.from({ length: 18 }, (_, index) =>
    scene.add
      .circle(
        70 + ((index * 137) % 1160),
        80 + ((index * 83) % 520),
        1.5 + (index % 3),
        art.accent,
        0.28,
      )
      .setScrollFactor(0.06 + (index % 4) * 0.025)
      .setDepth(-22),
  );
  if (!reducedMotion) {
    scene.tweens.add({
      targets: background,
      scaleX: background.scaleX * 1.012,
      scaleY: background.scaleY * 1.012,
      duration: art.motion === 'pulse' ? 6200 : 9800,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });
    scene.tweens.add({
      targets: glow,
      alpha: 0.1,
      duration: 3600,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });
    motes.forEach((mote, index) => {
      scene.tweens.add({
        targets: mote,
        x: mote.x + 24 + (index % 4) * 9,
        y: mote.y - 18 - (index % 5) * 7,
        alpha: 0.08,
        duration: 3600 + (index % 6) * 620,
        delay: index * 90,
        ease: 'Sine.InOut',
        yoyo: true,
        repeat: -1,
      });
    });
  }
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

// «Сад первой зари» is authored content, so its ground is drawn as garden terrain instead of the
// prototype's tile + hard offset shadow: soil with a grass cap, tufts spilling over the edge and a
// soft shadow directly underneath. The old look read as black bars floating over the painting.
function drawGardenPlatform(
  scene: Phaser.Scene,
  platform: CampaignLevelDefinition['platforms'][number],
  index: number,
): void {
  const width = platform.width;
  const height = platform.height;
  const left = platform.x - width / 2;
  const top = platform.y - height / 2;
  const radius = Math.min(16, height / 2);
  const grassHeight = Math.min(19, Math.max(9, height * 0.34));
  const ledge = height <= 40;

  // Palette taken from the painted background: warm sandstone terraces with a mossy edge, so the
  // geometry reads as part of the garden instead of a bright green bar laid over it.
  const ground = scene.add.graphics().setDepth(1);
  ground.fillStyle(0x2b2a1b, 0.2);
  ground.fillEllipse(platform.x, top + height - 4, width * 0.92, Math.min(20, height * 0.36));
  ground.fillStyle(ledge ? 0xb49a76 : 0xa78e6b, 1);
  ground.fillRoundedRect(left, top + grassHeight * 0.5, width, height - grassHeight * 0.5, {
    tl: radius,
    tr: radius,
    bl: radius * 0.7,
    br: radius * 0.7,
  });
  ground.fillStyle(0x87714f, 0.55);
  ground.fillRoundedRect(left, top + height * 0.6, width, height * 0.4, {
    tl: 0,
    tr: 0,
    bl: radius * 0.7,
    br: radius * 0.7,
  });
  ground.fillStyle(0x6f9350, 0.92);
  ground.fillRoundedRect(left - 3, top, width + 6, grassHeight, radius);
  ground.fillStyle(0x8bb267, 0.85);
  ground.fillRoundedRect(left - 3, top, width + 6, grassHeight * 0.55, radius);

  // Broad, low-contrast soil patches break the platform's flat vector fill without competing
  // with characters or interactive props.
  ground.fillStyle(0x6f5b43, 0.2);
  for (let offset = 180 + index * 37; offset < width - 100; offset += 520) {
    ground.fillEllipse(left + offset, top + grassHeight + 28, 190, 34);
  }

  // Blades hanging over the edge break the straight silhouette of the rectangle.
  const tufts = scene.add.graphics().setDepth(2);
  tufts.fillStyle(0x6f9350, 0.9);
  for (let offset = 12; offset < width - 12; offset += 46) {
    const blade = ((index + offset) % 3) * 2;
    tufts.fillTriangle(
      left + offset,
      top + grassHeight - 1,
      left + offset + 6,
      top + grassHeight + 5 + blade,
      left + offset + 12,
      top + grassHeight - 1,
    );
  }
  // A few flowers, sparse enough to stay decoration rather than pattern.
  const flowers = scene.add.graphics().setDepth(3);
  for (let offset = 44 + (index % 3) * 34; offset < width - 30; offset += 236) {
    const warm = (index + offset) % 2 === 0;
    flowers.fillStyle(warm ? 0xfff0be : 0xe6d8ff, 0.9);
    flowers.fillCircle(left + offset, top + 3, 3.4);
    flowers.fillStyle(warm ? 0xffc978 : 0xb0a0ee, 0.9);
    flowers.fillCircle(left + offset, top + 3, 1.5);
  }

  // Sparse stones give the walking plane contact and scale; keeping them below paw height makes
  // them texture, not apparent obstacles.
  const stones = scene.add.graphics().setDepth(2);
  for (let offset = 250 + (index % 4) * 41; offset < width - 80; offset += 410) {
    const stoneWidth = 12 + ((offset + index) % 3) * 4;
    stones.fillStyle((offset / 410) % 2 === 0 ? 0x8f8068 : 0xb3a184, 0.52);
    stones.fillEllipse(left + offset, top + 7, stoneWidth, 5 + (index % 2) * 2);
  }
}

export function drawArena(
  scene: Phaser.Scene,
  level: CampaignLevelDefinition,
  reducedMotion = false,
): PlatformerWorldView {
  addParallax(scene, level, reducedMotion);
  const platforms = scene.physics.add.staticGroup();

  level.platforms.forEach((platform, index) => {
    if (level.background === 'garden') {
      const body = scene.add
        .tileSprite(platform.x, platform.y, platform.width, platform.height, 'garden-platform-tile')
        .setVisible(false);
      scene.physics.add.existing(body, true);
      platforms.add(body);
      drawGardenPlatform(scene, platform, index);
      return;
    }
    const edgeColor =
      level.background === 'forest'
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

  const phaseOverlay = scene.add
    .rectangle(0, 0, level.worldWidth, PLATFORMER_WORLD_HEIGHT, 0x251c52, 0)
    .setOrigin(0)
    .setDepth(20);
  return { phaseOverlay, platforms };
}

export function drawCheckpoints(scene: Phaser.Scene, level: CampaignLevelDefinition): void {
  level.checkpoints.forEach((point, index) => {
    // In the garden a checkpoint is one of its own light flowers, opened and glowing, instead of
    // the prototype's teal ring with a caption over it.
    if (level.background === 'garden') {
      const glow = scene.add
        .circle(point.x, point.y + 6, 34, 0xffe9a8, 0.22)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(3);
      const flower = scene.add
        .image(point.x, point.y, 'garden-flower-open')
        .setDisplaySize(76, 76)
        .setDepth(4);
      scene.tweens.add({
        targets: glow,
        scale: 1.2,
        alpha: 0.1,
        duration: 1600,
        yoyo: true,
        repeat: -1,
      });
      scene.tweens.add({
        targets: flower,
        y: point.y - 5,
        duration: 2200,
        ease: 'Sine.inOut',
        yoyo: true,
        repeat: -1,
      });
      return;
    }
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
