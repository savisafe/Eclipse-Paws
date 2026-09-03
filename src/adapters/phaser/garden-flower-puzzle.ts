import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { CatId } from '@core/index';
import { SequencePuzzle } from '@core/index';

const FLOWERS = [
  { id: 'sun', x: 900, color: 0xffd45f, accent: 0xfff3b0 },
  { id: 'twilight', x: 1240, color: 0x55dbe8, accent: 0xc5fbff },
  { id: 'moon', x: 1500, color: 0xa986ef, accent: 0xeadbff },
] as const;

type FlowerId = (typeof FLOWERS)[number]['id'];

interface FlowerView {
  activated: boolean;
  id: FlowerId;
  idleTexture: string;
  pressedTexture: string;
  view: Phaser.GameObjects.Image;
}

function point(center: number, radius: number, angle: number): Phaser.Math.Vector2 {
  return new Phaser.Math.Vector2(
    center + Math.cos(angle) * radius,
    center + Math.sin(angle) * radius,
  );
}

function createFlowerTexture(
  scene: Phaser.Scene,
  id: FlowerId,
  color: number,
  accent: number,
  pressed: boolean,
): string {
  const key = `garden-rune-${id}-${pressed ? 'pressed' : 'idle'}`;
  if (scene.textures.exists(key)) return key;
  const graphics = scene.add.graphics();
  const center = 80;

  graphics.fillStyle(0x080c23, pressed ? 0.34 : 0.78);
  graphics.fillCircle(center, center + 5, pressed ? 67 : 61);
  graphics.lineStyle(pressed ? 7 : 5, pressed ? accent : color, pressed ? 0.9 : 0.72);
  graphics.strokeCircle(center, center, pressed ? 65 : 58);
  graphics.lineStyle(2, 0xffffff, pressed ? 0.72 : 0.3);
  graphics.strokeCircle(center, center, pressed ? 55 : 49);

  const petals = pressed ? 12 : 8;
  for (let index = 0; index < petals; index += 1) {
    const angle = (index / petals) * Math.PI * 2 - Math.PI / 2;
    const left = point(center, pressed ? 22 : 20, angle - 0.19);
    const tip = point(center, pressed ? 57 : 48, angle);
    const right = point(center, pressed ? 22 : 20, angle + 0.19);
    graphics.fillStyle(index % 2 === 0 ? color : accent, pressed ? 0.95 : 0.72);
    graphics.fillTriangle(left.x, left.y, tip.x, tip.y, right.x, right.y);
    const veinStart = point(center, 24, angle);
    const veinEnd = point(center, pressed ? 50 : 42, angle);
    graphics.lineStyle(2, pressed ? 0xffffff : 0x1c2445, pressed ? 0.62 : 0.72);
    graphics.lineBetween(veinStart.x, veinStart.y, veinEnd.x, veinEnd.y);
  }

  graphics.fillStyle(0x171a3b, 1);
  graphics.fillCircle(center, center, pressed ? 26 : 29);
  graphics.lineStyle(3, pressed ? accent : color, 1);
  graphics.strokeCircle(center, center, pressed ? 25 : 28);
  graphics.fillStyle(pressed ? accent : color, pressed ? 1 : 0.85);
  if (id === 'sun') {
    graphics.fillCircle(center, center, pressed ? 13 : 10);
    graphics.lineStyle(2, 0xffffff, 0.8);
    graphics.strokeCircle(center, center, pressed ? 16 : 13);
  } else if (id === 'twilight') {
    graphics.fillTriangle(center, center - 15, center + 15, center + 12, center - 15, center + 12);
    graphics.fillStyle(0x171a3b, 1);
    graphics.fillTriangle(center, center - 7, center + 7, center + 7, center - 7, center + 7);
  } else {
    graphics.fillCircle(center, center, pressed ? 15 : 12);
    graphics.fillStyle(0x171a3b, 1);
    graphics.fillCircle(center + 7, center - 5, pressed ? 14 : 11);
  }

  if (pressed) {
    graphics.lineStyle(3, accent, 0.8);
    for (let index = 0; index < 4; index += 1) {
      const angle = Math.PI / 4 + index * (Math.PI / 2);
      const start = point(center, 68, angle);
      const end = point(center, 76, angle);
      graphics.lineBetween(start.x, start.y, end.x, end.y);
    }
  }

  graphics.generateTexture(key, 160, 160);
  graphics.destroy();
  return key;
}

export class GardenFlowerPuzzle {
  readonly #barrier: Phaser.GameObjects.Rectangle;
  readonly #flowers: FlowerView[];
  readonly #gameplay: GameplayController;
  readonly #scene: Phaser.Scene;
  readonly #sequence = new SequencePuzzle(FLOWERS.map((flower) => flower.id));

  constructor(
    scene: Phaser.Scene,
    gameplay: GameplayController,
    actors: Record<CatId, Phaser.Physics.Arcade.Sprite>,
  ) {
    this.#scene = scene;
    this.#gameplay = gameplay;
    this.#flowers = FLOWERS.map((flower, index) => {
      const idleTexture = createFlowerTexture(scene, flower.id, flower.color, flower.accent, false);
      const pressedTexture = createFlowerTexture(
        scene,
        flower.id,
        flower.color,
        flower.accent,
        true,
      );
      const view = scene.add.image(flower.x, 558, idleTexture).setScale(0.72).setDepth(7);
      scene.tweens.add({
        targets: view,
        scale: 0.77,
        duration: 820 + index * 110,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
      scene.add
        .text(flower.x, 485, `${index + 1}`, {
          color: '#fff7d8',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '20px',
          fontStyle: 'bold',
          stroke: '#10152e',
          strokeThickness: 6,
        })
        .setOrigin(0.5)
        .setDepth(8);
      return { activated: false, id: flower.id, idleTexture, pressedTexture, view };
    });
    this.#barrier = scene.add.rectangle(1590, 510, 34, 220, 0x79e1e5, 0.5).setDepth(9);
    scene.physics.add.existing(this.#barrier, true);
    scene.physics.add.collider(Object.values(actors), this.#barrier);
  }

  get solved(): boolean {
    return this.#sequence.solved;
  }

  interact(active: Phaser.Physics.Arcade.Sprite): void {
    if (this.#sequence.solved) return;
    const nearest = this.#flowers.find(
      (flower) =>
        Phaser.Math.Distance.Between(active.x, active.y, flower.view.x, flower.view.y) < 92,
    );
    if (!nearest) return;
    const result = this.#sequence.activate(nearest.id);
    if (!result.accepted) {
      this.#flowers.forEach((flower) => this.#setPressed(flower, false));
      nearest.view.setTint(0xff496f);
      this.#scene.time.delayedCall(180, () => nearest.view.clearTint());
      return;
    }
    this.#setPressed(nearest, true);
    if (result.solved) this.#complete();
  }

  #setPressed(flower: FlowerView, pressed: boolean): void {
    flower.activated = pressed;
    this.#scene.tweens.killTweensOf(flower.view);
    flower.view
      .setTexture(pressed ? flower.pressedTexture : flower.idleTexture)
      .setScale(pressed ? 0.88 : 0.72)
      .setAngle(pressed ? 0 : -5)
      .setAlpha(pressed ? 1 : 0.96);
    if (!pressed) {
      this.#scene.tweens.add({
        targets: flower.view,
        scale: 0.77,
        duration: 850,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
      return;
    }
    this.#scene.tweens.add({
      targets: flower.view,
      angle: 360,
      duration: 520,
      ease: 'Back.out',
    });
  }

  #complete(): void {
    this.#gameplay.rewardEclipse(25);
    const body = this.#barrier.body as Phaser.Physics.Arcade.StaticBody;
    body.enable = false;
    this.#scene.tweens.add({
      targets: this.#barrier,
      alpha: 0,
      scaleY: 0,
      duration: 420,
      onComplete: () => this.#barrier.destroy(),
    });
  }
}
