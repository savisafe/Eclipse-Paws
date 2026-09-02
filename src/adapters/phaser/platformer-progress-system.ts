import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import { PROTOTYPE_SPAWNS } from '@content/index';
import { PLATFORMER_WORLD } from './arena-decoration';

export class PlatformerProgressSystem {
  readonly #gameplay: GameplayController;
  readonly #onLevelCompleted: () => void;
  #finished = false;

  constructor(gameplay: GameplayController, onLevelCompleted: () => void) {
    this.#gameplay = gameplay;
    this.#onLevelCompleted = onLevelCompleted;
  }

  update(active: Phaser.Physics.Arcade.Sprite, canFinish: boolean): void {
    const moonWell = PROTOTYPE_SPAWNS.checkpoints[1];
    if (Phaser.Math.Distance.Between(active.x, active.y, moonWell.x, moonWell.y) < 90) {
      this.#gameplay.reachCheckpoint(moonWell.id);
    }

    const finish = PROTOTYPE_SPAWNS.checkpoints[2];
    if (!this.#finished && canFinish && active.x >= finish.x - 55) {
      this.#finished = true;
      this.#onLevelCompleted();
    }

    if (active.y > PLATFORMER_WORLD.height + 90) this.#gameplay.takeDamage(3);
  }
}
