import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { LevelPoint } from '@content/index';

export class GardenCollectibleSystem {
  readonly #gameplay: GameplayController;
  readonly #sparks: Array<{ id: string; view: Phaser.GameObjects.Container }>;

  constructor(scene: Phaser.Scene, gameplay: GameplayController, sparks: readonly LevelPoint[]) {
    this.#gameplay = gameplay;
    this.#sparks = sparks.map((spark) => {
      const aura = scene.add.circle(0, 0, 28, 0x6ee8ff, 0.13).setStrokeStyle(2, 0x8cf2ff, 0.65);
      const rays = scene.add.star(0, 0, 8, 13, 31, 0xffca5f, 0.42);
      const core = scene.add.star(0, 0, 6, 7, 18, 0xfff2a6, 1).setStrokeStyle(2, 0xffffff, 0.9);
      const gem = scene.add.circle(0, 0, 6, 0x78eaff, 1);
      const beam = scene.add
        .rectangle(0, 17, 5, 76, 0x8eeeff, 0.2)
        .setBlendMode(Phaser.BlendModes.ADD);
      const label = scene.add
        .text(0, -43, 'ИСКРА · коснись', {
          color: '#fff4b0',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
          stroke: '#11162f',
          strokeThickness: 4,
        })
        .setOrigin(0.5);
      const view = scene.add
        .container(spark.x, spark.y, [beam, aura, rays, core, gem, label])
        .setDepth(8);
      scene.tweens.add({ targets: rays, angle: 360, duration: 2500, repeat: -1 });
      scene.tweens.add({ targets: core, angle: -360, duration: 1800, repeat: -1 });
      scene.tweens.add({
        targets: aura,
        scale: 1.28,
        alpha: 0.05,
        duration: 760,
        yoyo: true,
        repeat: -1,
      });
      scene.tweens.add({
        targets: view,
        y: spark.y - 9,
        duration: 920,
        ease: 'Sine.inOut',
        yoyo: true,
        repeat: -1,
      });
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
