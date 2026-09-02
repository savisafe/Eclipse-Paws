import Phaser from 'phaser';
import type { GameplayController } from '@application/index';

const SPARKS = [
  { id: 'spark-sunrise', x: 650, y: 430 },
  { id: 'spark-well', x: 2320, y: 420 },
  { id: 'spark-ruins', x: 4480, y: 350 },
] as const;

export class GardenCollectibleSystem {
  readonly #gameplay: GameplayController;
  readonly #sparks: Array<{ id: string; view: Phaser.GameObjects.Star }>;

  constructor(scene: Phaser.Scene, gameplay: GameplayController) {
    this.#gameplay = gameplay;
    this.#sparks = SPARKS.map((spark) => {
      const view = scene.add.star(spark.x, spark.y, 8, 8, 22, 0xffdf72, 0.95).setDepth(8);
      scene.tweens.add({ targets: view, angle: 360, duration: 2800, repeat: -1 });
      return { id: spark.id, view };
    });
  }

  update(active: Phaser.Physics.Arcade.Sprite): void {
    this.#sparks.forEach((spark) => {
      if (!spark.view.active) return;
      if (Phaser.Math.Distance.Between(active.x, active.y, spark.view.x, spark.view.y) > 72) return;
      if (this.#gameplay.collectSpark(spark.id)) spark.view.destroy();
    });
  }
}
