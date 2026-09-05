import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { GameInputState } from '@adapters/input/index';
import type { CatId } from '@core/index';
import type { Destroyable } from './destroyable';
import { updateCatAnimation } from './cat-animation';
import { JUMP_SPEED, PLAYER_SPEED } from './movement-constants';
import { setCatFacing } from './sprite-atlas';

export class PlayerMovementSystem implements Destroyable {
  readonly #actionLockMs: Record<CatId, number>;
  readonly #actors: Record<CatId, Phaser.Physics.Arcade.Sprite>;
  readonly #facing: Record<CatId, number>;
  readonly #gameplay: GameplayController;
  readonly #input: GameInputState;
  #coyoteMs = 0;
  #jumpBufferMs = 0;
  #lastX = Number.NaN;
  #stuckMs = 0;

  constructor(options: {
    actionLockMs: Record<CatId, number>;
    actors: Record<CatId, Phaser.Physics.Arcade.Sprite>;
    facing: Record<CatId, number>;
    gameplay: GameplayController;
    input: GameInputState;
  }) {
    this.#actionLockMs = options.actionLockMs;
    this.#actors = options.actors;
    this.#facing = options.facing;
    this.#gameplay = options.gameplay;
    this.#input = options.input;
  }

  update(deltaMs: number): void {
    const activeId = this.#gameplay.getSnapshot().activeCat;
    const active = this.#actors[activeId];
    const horizontal =
      Number(this.#input.isPressed('move-right')) - Number(this.#input.isPressed('move-left'));
    active.setVelocityX(horizontal * PLAYER_SPEED);
    if (horizontal !== 0) {
      this.#facing[activeId] = horizontal < 0 ? -1 : 1;
      setCatFacing(active, horizontal < 0 ? -1 : 1);
    }

    const body = active.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down;
    if (!Number.isFinite(this.#lastX)) this.#lastX = active.x;
    const moved = Math.abs(active.x - this.#lastX);
    this.#lastX = active.x;
    this.#stuckMs = horizontal !== 0 && grounded && moved < 0.35 ? this.#stuckMs + deltaMs : 0;
    if (this.#stuckMs > 1400) {
      active.setVelocity(horizontal * PLAYER_SPEED, -JUMP_SPEED * 0.72);
      this.#stuckMs = 0;
    }
    this.#coyoteMs = grounded ? 120 : Math.max(0, this.#coyoteMs - deltaMs);
    this.#jumpBufferMs = Math.max(0, this.#jumpBufferMs - deltaMs);
    if (this.#input.consume('jump')) this.#jumpBufferMs = 130;
    if (this.#jumpBufferMs > 0 && (grounded || this.#coyoteMs > 0)) {
      active.setVelocityY(-JUMP_SPEED);
      this.#jumpBufferMs = 0;
      this.#coyoteMs = 0;
    }
    updateCatAnimation(active, activeId, this.#actionLockMs, deltaMs);
  }

  // No owned Phaser resources (tweens/timers/game objects) or subscriptions of its own — it only
  // mutates sprites the scene owns. Present to satisfy the uniform Destroyable contract (ARC-010).
  destroy(): void {
    // Intentionally empty.
  }
}
