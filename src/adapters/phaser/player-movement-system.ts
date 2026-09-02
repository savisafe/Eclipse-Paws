import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { GameInputState } from '@adapters/input/index';
import type { CatId } from '@core/index';
import { updateCatAnimation } from './cat-animation';

const PLAYER_SPEED = 255;
const JUMP_SPEED = 560;

export class PlayerMovementSystem {
  readonly #actionLockMs: Record<CatId, number>;
  readonly #actors: Record<CatId, Phaser.Physics.Arcade.Sprite>;
  readonly #facing: Record<CatId, number>;
  readonly #gameplay: GameplayController;
  readonly #input: GameInputState;
  #coyoteMs = 0;
  #jumpBufferMs = 0;

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
      active.setFlipX(horizontal < 0);
    }

    const body = active.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down;
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
}
