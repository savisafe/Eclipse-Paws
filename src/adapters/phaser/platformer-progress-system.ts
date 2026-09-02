import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { CampaignLevelDefinition } from '@content/index';
import { PLATFORMER_WORLD_HEIGHT } from './arena-decoration';

export class PlatformerProgressSystem {
  readonly #gameplay: GameplayController;
  readonly #onLevelCompleted: () => void;
  readonly #level: CampaignLevelDefinition;
  #finished = false;

  constructor(
    gameplay: GameplayController,
    onLevelCompleted: () => void,
    level: CampaignLevelDefinition,
  ) {
    this.#gameplay = gameplay;
    this.#onLevelCompleted = onLevelCompleted;
    this.#level = level;
  }

  update(active: Phaser.Physics.Arcade.Sprite, canFinish: boolean): void {
    const moonWell = this.#level.checkpoints[1];
    if (Phaser.Math.Distance.Between(active.x, active.y, moonWell.x, moonWell.y) < 90) {
      this.#gameplay.reachCheckpoint(moonWell.id);
    }

    const finish = this.#level.checkpoints[2];
    if (!this.#finished && canFinish && active.x >= finish.x - 55) {
      this.#finished = true;
      this.#onLevelCompleted();
    }

    if (active.y > PLATFORMER_WORLD_HEIGHT + 90) this.#gameplay.takeDamage(3);
  }
}
