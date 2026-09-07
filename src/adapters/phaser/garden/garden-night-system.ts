import Phaser from 'phaser';
import type { CampaignLevelDefinition } from '@content/index';
import type { CatId } from '@core/index';
import type { Destroyable } from '../destroyable';
import type { EffectTarget } from '../platformer-effects';

const HOLE_KEY = 'garden-night-hole';
const GLOW_KEY = 'garden-night-glow';
const HOLE_SIZE = 1024;
const GLOW_SIZE = 256;

// The darkness is one pre-baked sprite with a soft hole in the middle plus four plain rectangles
// that fill the rest of the screen. That keeps the night at a handful of draw calls per frame —
// an every-frame render-texture erase was heavy enough to visibly cost frame rate.
function ensureHoleTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(HOLE_KEY)) return;
  const canvas = document.createElement('canvas');
  canvas.width = HOLE_SIZE;
  canvas.height = HOLE_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is required for the garden night mask.');
  context.fillStyle = '#05060f';
  context.fillRect(0, 0, HOLE_SIZE, HOLE_SIZE);
  const centre = HOLE_SIZE / 2;
  const gradient = context.createRadialGradient(
    centre,
    centre,
    centre * 0.12,
    centre,
    centre,
    centre,
  );
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.62, 'rgba(255,255,255,0.75)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.globalCompositeOperation = 'destination-out';
  context.fillStyle = gradient;
  context.fillRect(0, 0, HOLE_SIZE, HOLE_SIZE);
  scene.textures.addCanvas(HOLE_KEY, canvas);
}

function ensureGlowTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(GLOW_KEY)) return;
  const canvas = document.createElement('canvas');
  canvas.width = GLOW_SIZE;
  canvas.height = GLOW_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is required for the garden night glow.');
  const centre = GLOW_SIZE / 2;
  const gradient = context.createRadialGradient(centre, centre, 4, centre, centre, centre);
  gradient.addColorStop(0, 'rgba(255, 225, 160, 0.85)');
  gradient.addColorStop(1, 'rgba(255, 225, 160, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);
  scene.textures.addCanvas(GLOW_KEY, canvas);
}

/**
 * The garden's first real night (ECLIPSE_PAWS_SCENARIO.md §12, «Первое наступление ночи»):
 * "Это должна быть настоящая ночь, а не фиолетовый цветовой фильтр." Most of the garden goes
 * dark, the active cat keeps a limited circle of vision, the other cat is only a faint warm glow,
 * the nearest safe surfaces get silver contours, and creatures show their eyes before their
 * bodies.
 *
 * The darkness sits below the dialogue and tutorial cards and never touches the DOM HUD, so §14's
 * "интерфейс остаётся читаемым и не затемняется вместе с игровой сценой" holds, and its strength
 * follows the player's own night-brightness setting.
 */
export class GardenNightSystem implements Destroyable {
  readonly #contours: Phaser.GameObjects.Graphics;
  readonly #edges: Phaser.GameObjects.Rectangle[];
  readonly #eyes: Phaser.GameObjects.Graphics;
  readonly #glow: Phaser.GameObjects.Image;
  readonly #hole: Phaser.GameObjects.Image;
  readonly #level: CampaignLevelDefinition;
  readonly #scene: Phaser.Scene;
  #brightness: number;

  constructor(scene: Phaser.Scene, level: CampaignLevelDefinition, nightBrightness: number) {
    this.#level = level;
    this.#scene = scene;
    this.#brightness = Phaser.Math.Clamp(nightBrightness, 0, 100);
    ensureHoleTexture(scene);
    ensureGlowTexture(scene);

    this.#hole = scene.add.image(0, 0, HOLE_KEY).setScrollFactor(0).setDepth(24).setVisible(false);
    this.#edges = Array.from({ length: 4 }, () =>
      scene.add
        .rectangle(0, 0, 10, 10, 0x05060f, 1)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(24)
        .setVisible(false),
    );
    this.#glow = scene.add
      .image(0, 0, GLOW_KEY)
      .setScrollFactor(0)
      .setDepth(25)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(false);
    this.#contours = scene.add.graphics().setDepth(25).setVisible(false);
    this.#eyes = scene.add.graphics().setDepth(26).setVisible(false);
  }

  setBrightness(nightBrightness: number): void {
    this.#brightness = Phaser.Math.Clamp(nightBrightness, 0, 100);
  }

  setActive(active: boolean): void {
    this.#hole.setVisible(active);
    this.#glow.setVisible(active);
    this.#edges.forEach((edge) => edge.setVisible(active));
    this.#contours.setVisible(active);
    this.#eyes.setVisible(active);
  }

  update(
    actors: Record<CatId, Phaser.Physics.Arcade.Sprite>,
    activeCat: CatId,
    enemies: readonly EffectTarget[],
  ): void {
    if (!this.#hole.visible) return;
    const camera = this.#scene.cameras.main;
    const active = actors[activeCat];
    const companion = actors[activeCat === 'luma' ? 'nox' : 'luma'];
    // Even at 0 % brightness the night is never a black screen: the player must always keep some
    // orientation (§12).
    const darkness = 0.96 - (this.#brightness / 100) * 0.3;
    // A limited circle of vision, not a lit screen: ~250px around Нокс, tighter around Люмус,
    // whose own glow is warm but small ("Люмус виден неподалёку благодаря слабому тёплому
    // свечению, но не освещает весь экран").
    const visionScale = activeCat === 'nox' ? 0.5 : 0.4;

    // Measured against the live view, not the authored 1280×720: the darkness has to reach the
    // edges of whatever screen the player is holding (see `../viewport.ts`).
    const viewWidth = camera.width;
    const viewHeight = camera.height;
    const screenX = active.x - camera.scrollX;
    const screenY = active.y - camera.scrollY;
    this.#hole.setAlpha(darkness).setScale(visionScale).setPosition(screenX, screenY);

    const half = (HOLE_SIZE * visionScale) / 2;
    const left = screenX - half;
    const right = screenX + half;
    const top = screenY - half;
    const bottom = screenY + half;
    this.#placeEdge(0, 0, 0, viewWidth, Math.max(0, top), darkness);
    this.#placeEdge(1, 0, bottom, viewWidth, Math.max(0, viewHeight - bottom), darkness);
    this.#placeEdge(2, 0, Math.max(0, top), Math.max(0, left), bottom - top, darkness);
    this.#placeEdge(
      3,
      right,
      Math.max(0, top),
      Math.max(0, viewWidth - right),
      bottom - top,
      darkness,
    );

    this.#glow.setPosition(companion.x - camera.scrollX, companion.y - camera.scrollY);

    this.#contours.clear();
    this.#contours.lineStyle(2, 0xcfe4ff, 0.5);
    [...this.#level.platforms, ...this.#level.phasePlatforms].forEach((platform) => {
      if (Math.abs(platform.x - active.x) > platform.width / 2 + 420) return;
      const platformTop = platform.y - platform.height / 2;
      this.#contours.lineBetween(
        platform.x - platform.width / 2,
        platformTop,
        platform.x + platform.width / 2,
        platformTop,
      );
    });

    // Eyes first, bodies later: an enemy outside the circle of vision is only two glints.
    this.#eyes.clear();
    enemies.forEach(({ sprite }) => {
      if (!sprite.active) return;
      const distance = Phaser.Math.Distance.Between(active.x, active.y, sprite.x, sprite.y);
      if (distance > 640 || distance < HOLE_SIZE * visionScale * 0.42) return;
      const facing = sprite.flipX ? -1 : 1;
      this.#eyes.fillStyle(0xff9d7a, 0.9);
      this.#eyes.fillCircle(sprite.x - facing * 9, sprite.y - 18, 4);
      this.#eyes.fillCircle(sprite.x + facing * 9, sprite.y - 18, 4);
    });
  }

  destroy(): void {
    this.#hole.destroy();
    this.#glow.destroy();
    this.#edges.forEach((edge) => edge.destroy());
    this.#contours.destroy();
    this.#eyes.destroy();
  }

  #placeEdge(
    index: number,
    x: number,
    y: number,
    width: number,
    height: number,
    alpha: number,
  ): void {
    const edge = this.#edges[index];
    if (!edge) return;
    edge.setPosition(x, y).setSize(Math.max(0, width), Math.max(0, height)).setAlpha(alpha);
  }
}
