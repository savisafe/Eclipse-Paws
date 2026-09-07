import Phaser from 'phaser';
import type { CampaignLevelDefinition } from '@content/index';
import gardenPlatformUrl from '../../assets/environments/garden-stone-platform-tile-v1.png?url';
import { environmentForLevel } from './dream-environment-manifest';
import { sceneViewport, type UiViewport } from './viewport';

export const PLATFORMER_WORLD_HEIGHT = 720;

export function preloadEnvironment(scene: Phaser.Scene, level: CampaignLevelDefinition): void {
  scene.load.image('level-background', environmentForLevel(level.index).imageUrl);
  scene.load.image('garden-platform-tile', gardenPlatformUrl);
}

/**
 * Everything behind the level is screen-space (scroll factor 0 or near it), so it has to be laid
 * out against the current field of view rather than the authored 1280×720 — otherwise a wide
 * phone shows the painted backdrop ending mid-screen. `layout` re-runs on every viewport change.
 */
function addParallax(
  scene: Phaser.Scene,
  level: CampaignLevelDefinition,
  reducedMotion: boolean,
): (view: UiViewport) => void {
  const art = environmentForLevel(level.index);
  const background = scene.add.image(0, 0, 'level-background').setScrollFactor(0).setDepth(-30);
  const glow = scene.add
    .ellipse(0, 0, 900, 430, art.accent, 0.045)
    .setScrollFactor(0.035)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(-25);
  const motes = Array.from({ length: 18 }, (_, index) =>
    scene.add
      .circle(0, 0, 1.5 + (index % 3), art.accent, 0.28)
      .setScrollFactor(0.06 + (index % 4) * 0.025)
      .setDepth(-22),
  );
  const tint = scene.add.rectangle(0, 0, 10, 10, 0x173447, 0.08).setScrollFactor(0).setDepth(-20);
  // Tweens are rebuilt on every layout because each of them animates away from a base value the
  // layout has just changed (the backdrop's cover scale, a mote's seeded position).
  let drifts: Phaser.Tweens.Tween[] = [];

  return (view: UiViewport) => {
    const source = background.texture.getSourceImage();
    // Cover, not stretch: the painted backdrop keeps its own proportions and overflows the short
    // axis. The 1.5 % overscan hides the seam the breathing tween would otherwise open up.
    const cover =
      Math.max(view.width / source.width, view.height / source.height) *
      (reducedMotion ? 1 : 1.015);
    background
      .setPosition(view.width / 2, view.height / 2)
      .setDisplaySize(source.width * cover, source.height * cover);
    glow.setPosition(view.width / 2, view.height * 0.44);
    tint.setPosition(view.width / 2, view.height / 2).setSize(view.width, view.height);
    motes.forEach((mote, index) => {
      mote.setPosition(
        (view.width / 18) * (index + 0.5) + ((index * 137) % 90),
        70 + ((index * 83) % Math.max(120, view.height - 160)),
      );
    });

    drifts.forEach((tween) => tween.remove());
    drifts = [];
    if (reducedMotion) return;
    drifts.push(
      scene.tweens.add({
        targets: background,
        scaleX: background.scaleX * 1.012,
        scaleY: background.scaleY * 1.012,
        duration: art.motion === 'pulse' ? 6200 : 9800,
        ease: 'Sine.InOut',
        yoyo: true,
        repeat: -1,
      }),
      scene.tweens.add({
        targets: glow,
        alpha: 0.1,
        duration: 3600,
        ease: 'Sine.InOut',
        yoyo: true,
        repeat: -1,
      }),
      ...motes.map((mote, index) =>
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
        }),
      ),
    );
  };
}

export interface PlatformerWorldView {
  /** Re-anchors every screen-space piece of the arena to a new field of view. */
  layout: (view: UiViewport) => void;
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

export function drawArena(
  scene: Phaser.Scene,
  level: CampaignLevelDefinition,
  reducedMotion = false,
): PlatformerWorldView {
  const layoutParallax = addParallax(scene, level, reducedMotion);
  const platforms = scene.physics.add.staticGroup();

  level.platforms.forEach((platform, index) => {
    if (level.background === 'garden') {
      const body = scene.add
        .tileSprite(platform.x, platform.y, platform.width, platform.height, 'garden-platform-tile')
        .setVisible(false);
      scene.physics.add.existing(body, true);
      platforms.add(body);
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

  // Screen-space rather than world-space: the night tint has to cover the whole view, including
  // the sky and ground a screen squarer than 16:9 reveals beyond the authored band.
  const phaseOverlay = scene.add
    .rectangle(0, 0, 10, 10, 0x251c52, 0)
    .setOrigin(0)
    .setScrollFactor(0)
    .setDepth(20);
  const layout = (view: UiViewport): void => {
    layoutParallax(view);
    phaseOverlay.setSize(view.width, view.height);
  };
  layout(sceneViewport(scene));
  return { layout, phaseOverlay, platforms };
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
