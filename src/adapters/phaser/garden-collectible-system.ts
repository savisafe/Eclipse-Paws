import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { LevelPoint } from '@content/index';
import memoryEchoUrl from '../../assets/icons/cards/memory-echo-v1.png?url';

const ICON_KEY = 'memory-echo-icon';

/**
 * The optional memories scattered through a level (§14, «Исследование и награды»: the reward is
 * visible in advance so exploring never becomes checking every wall). Each one is the drawn
 * memory-echo icon with a soft aura — it used to be a procedural star under a black text label,
 * which read as a debug marker on top of the painted level.
 */
export class GardenCollectibleSystem {
  readonly #gameplay: GameplayController;
  readonly #sparks: Array<{ id: string; view: Phaser.GameObjects.Container }>;

  constructor(scene: Phaser.Scene, gameplay: GameplayController, sparks: readonly LevelPoint[]) {
    this.#gameplay = gameplay;
    this.#sparks = sparks.map((spark) => {
      const aura = scene.add.circle(0, 0, 30, 0x8be9f2, 0.14).setStrokeStyle(2, 0xa8f3ff, 0.5);
      const glow = scene.add.circle(0, 0, 20, 0xffe9a8, 0.35).setBlendMode(Phaser.BlendModes.ADD);
      const icon = scene.add.image(0, 0, ICON_KEY).setDisplaySize(52, 52);
      const view = scene.add.container(spark.x, spark.y, [aura, glow, icon]).setDepth(8);
      scene.tweens.add({
        targets: aura,
        scale: 1.24,
        alpha: 0.05,
        duration: 1100,
        yoyo: true,
        repeat: -1,
      });
      scene.tweens.add({
        targets: view,
        y: spark.y - 9,
        duration: 1400,
        ease: 'Sine.inOut',
        yoyo: true,
        repeat: -1,
      });
      return { id: spark.id, view };
    });
  }

  static preload(scene: Phaser.Scene): void {
    scene.load.image(ICON_KEY, memoryEchoUrl);
  }

  update(active: Phaser.Physics.Arcade.Sprite): void {
    this.#sparks.forEach((spark) => {
      if (!spark.view.active) return;
      if (Phaser.Math.Distance.Between(active.x, active.y, spark.view.x, spark.view.y) > 72) return;
      if (this.#gameplay.collectSpark(spark.id)) spark.view.destroy();
    });
  }
}
