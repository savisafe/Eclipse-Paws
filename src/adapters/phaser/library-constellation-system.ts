import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import { SequencePuzzle, type CatId, type Phase } from '@core/index';

const MIRRORS = [
  { id: 'sun', x: 1120, required: 'day' },
  { id: 'moon', x: 2550, required: 'night' },
  { id: 'eclipse', x: 3970, required: 'day' },
] as const;

export class LibraryConstellationSystem {
  readonly #barrier: Phaser.GameObjects.Rectangle;
  readonly #gameplay: GameplayController;
  readonly #mirrors: Array<{ id: string; required: Phase; view: Phaser.GameObjects.Arc }>;
  readonly #puzzle = new SequencePuzzle(MIRRORS.map((mirror) => mirror.id));
  readonly #scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    gameplay: GameplayController,
    actors: Record<CatId, Phaser.Physics.Arcade.Sprite>,
  ) {
    this.#scene = scene;
    this.#gameplay = gameplay;
    this.#mirrors = MIRRORS.map((mirror) => {
      const view = scene.add
        .circle(mirror.x, 535, 36, mirror.required === 'day' ? 0xffd46f : 0x8b79da, 0.32)
        .setStrokeStyle(7, 0xe8ecff, 0.8)
        .setDepth(7);
      scene.add
        .text(mirror.x, 480, mirror.required === 'day' ? '☀' : '☾', {
          color: '#fff8de',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '24px',
          stroke: '#17213b',
          strokeThickness: 4,
        })
        .setOrigin(0.5);
      return { ...mirror, view };
    });
    this.#barrier = scene.add.rectangle(4300, 505, 36, 230, 0xc7d5ff, 0.48).setDepth(9);
    scene.physics.add.existing(this.#barrier, true);
    scene.physics.add.collider(Object.values(actors), this.#barrier);
  }

  get solved(): boolean {
    return this.#puzzle.solved;
  }

  interact(active: Phaser.Physics.Arcade.Sprite, phase: Phase): void {
    const mirror = this.#mirrors.find(
      (candidate) =>
        Phaser.Math.Distance.Between(active.x, active.y, candidate.view.x, candidate.view.y) < 90,
    );
    if (!mirror || mirror.required !== phase) return;
    const result = this.#puzzle.activate(mirror.id);
    if (!result.accepted) return;
    mirror.view.setAlpha(0.95).setScale(1.2);
    if (result.solved) this.#complete();
  }

  #complete(): void {
    this.#gameplay.rewardEclipse(30);
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
