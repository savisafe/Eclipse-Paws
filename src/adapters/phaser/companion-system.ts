import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { CatId } from '@core/index';
import { updateCatAnimation } from './cat-animation';
import type { Destroyable } from './destroyable';
import { JUMP_SPEED, PLAYER_SPEED } from './movement-constants';
import { CAT_DISPLAY_SCALE, catFacing, setCatFacing } from './sprite-atlas';

const FOLLOW_SPEED = PLAYER_SPEED * 0.92;
const FOLLOW_DEADZONE_X = 70;
const JUMP_ASSIST_DY = -40;
const JUMP_ASSIST_MAX_DX = 220;
const WARP_DISTANCE_X = 480;
const WARP_DISTANCE_Y = 260;
const WARP_STUCK_MS = 2200;

/**
 * GAM-014: the cat the player isn't currently controlling is a visible, always-present
 * companion, not a disabled/hidden body (see docs/HANDOFFS/GAM-014.md for why the previous
 * teleport-swap design didn't match the scenario's "two heroes" requirement). It follows the
 * active cat, makes a best-effort jump when the active cat is above it or it's blocked, and
 * warps next to the active cat if it stays far away or stuck for too long — exactly the
 * fallback the scenario itself calls for ("телепортируется ближе, если сильно отстал").
 */
export class CompanionSystem implements Destroyable {
  readonly #actionLockMs: Record<CatId, number>;
  readonly #actors: Record<CatId, Phaser.Physics.Arcade.Sprite>;
  readonly #gameplay: GameplayController;
  readonly #reducedMotion: boolean;
  readonly #scene: Phaser.Scene;
  #farMs = 0;

  constructor(options: {
    actionLockMs: Record<CatId, number>;
    actors: Record<CatId, Phaser.Physics.Arcade.Sprite>;
    gameplay: GameplayController;
    reducedMotion: boolean;
    scene: Phaser.Scene;
  }) {
    this.#actionLockMs = options.actionLockMs;
    this.#actors = options.actors;
    this.#gameplay = options.gameplay;
    this.#reducedMotion = options.reducedMotion;
    this.#scene = options.scene;
  }

  update(deltaMs: number): void {
    const activeId = this.#gameplay.getSnapshot().activeCat;
    const companionId: CatId = activeId === 'luma' ? 'nox' : 'luma';
    const active = this.#actors[activeId];
    const companion = this.#actors[companionId];

    const dx = active.x - companion.x;
    const dy = active.y - companion.y;
    const farAway = Math.abs(dx) > WARP_DISTANCE_X || Math.abs(dy) > WARP_DISTANCE_Y;
    this.#farMs = farAway ? this.#farMs + deltaMs : 0;
    if (this.#farMs > WARP_STUCK_MS) {
      this.#warpToward(companion, active);
      this.#farMs = 0;
      return;
    }

    const body = companion.body as Phaser.Physics.Arcade.Body;
    if (Math.abs(dx) > FOLLOW_DEADZONE_X) {
      companion.setVelocityX(Math.sign(dx) * FOLLOW_SPEED);
      setCatFacing(companion, dx < 0 ? -1 : 1);
    } else {
      companion.setVelocityX(0);
    }

    const activeIsAbove = dy < JUMP_ASSIST_DY && Math.abs(dx) < JUMP_ASSIST_MAX_DX;
    const blockedAhead =
      Math.abs(dx) > FOLLOW_DEADZONE_X && (dx > 0 ? body.blocked.right : body.blocked.left);
    if (body.blocked.down && (activeIsAbove || blockedAhead)) companion.setVelocityY(-JUMP_SPEED);

    updateCatAnimation(companion, companionId, this.#actionLockMs, deltaMs);
  }

  #warpToward(companion: Phaser.Physics.Arcade.Sprite, active: Phaser.Physics.Arcade.Sprite): void {
    const behind = -catFacing(active);
    companion.setPosition(active.x + behind * 40, active.y).setVelocity(0, 0);
    if (this.#reducedMotion) return;
    companion.setScale(CAT_DISPLAY_SCALE).setAlpha(0.2);
    this.#scene.tweens.add({
      targets: companion,
      alpha: 1,
      duration: 220,
      ease: 'Back.out',
    });
  }

  // Nothing owned beyond the shared sprites/tweens the scene already manages (see
  // destroyable.ts) — the warp tween is on a sprite Phaser's DisplayList already destroys on
  // shutdown. Present for the uniform Destroyable contract (ARC-010).
  destroy(): void {
    // Intentionally empty.
  }
}
