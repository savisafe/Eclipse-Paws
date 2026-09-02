import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { CatId } from '@core/index';
import { SequencePuzzle } from '@core/index';

const FLOWERS = [
  { id: 'sun', x: 900, color: 0xffd45f },
  { id: 'twilight', x: 1240, color: 0x72dce8 },
  { id: 'moon', x: 1500, color: 0xa986ef },
] as const;

export class GardenFlowerPuzzle {
  readonly #barrier: Phaser.GameObjects.Rectangle;
  readonly #flowers: Array<{ id: string; view: Phaser.GameObjects.Star }>;
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
      const view = scene.add.star(flower.x, 570, 7, 12, 34, flower.color, 0.55).setDepth(7);
      scene.add
        .text(flower.x, 515, `${index + 1}`, {
          color: '#fff7d8',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
          stroke: '#18233a',
          strokeThickness: 4,
        })
        .setOrigin(0.5);
      return { id: flower.id, view };
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
        Phaser.Math.Distance.Between(active.x, active.y, flower.view.x, flower.view.y) < 85,
    );
    if (!nearest) return;
    const result = this.#sequence.activate(nearest.id);
    if (!result.accepted) {
      this.#flowers.forEach((flower) => flower.view.setAlpha(0.55).setScale(1));
      return;
    }
    nearest.view.setAlpha(1).setScale(1.25);
    if (result.solved) this.#complete();
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
