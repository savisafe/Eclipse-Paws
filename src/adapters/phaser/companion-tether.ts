import Phaser from 'phaser';
import type { CatId } from '@core/index';

const FOLLOW_DISTANCE = 82;
const SPIRIT_DISTANCE = 290;
const SPIRIT_SPEED = 520;

function arcadeBody(sprite: Phaser.Physics.Arcade.Sprite): Phaser.Physics.Arcade.Body {
  return sprite.body as Phaser.Physics.Arcade.Body;
}

export class CompanionTether {
  readonly #actors: Record<CatId, Phaser.Physics.Arcade.Sprite>;
  readonly #scene: Phaser.Scene;
  #lastDistance = 0;
  #spiritCat: CatId | null = null;
  #stuckMs = 0;
  #trailMs = 0;

  constructor(scene: Phaser.Scene, actors: Record<CatId, Phaser.Physics.Arcade.Sprite>) {
    this.#scene = scene;
    this.#actors = actors;
  }

  update(activeId: CatId, deltaMs: number): CatId {
    const followerId = activeId === 'luma' ? 'nox' : 'luma';
    const active = this.#actors[activeId];
    const follower = this.#actors[followerId];
    const dx = active.x - follower.x;
    const dy = active.y - follower.y;
    const distance = Phaser.Math.Distance.Between(follower.x, follower.y, active.x, active.y);

    if (this.#spiritCat === followerId) {
      this.#updateSpirit(followerId, active, follower, distance, deltaMs);
      return followerId;
    }

    const blocked = arcadeBody(follower).blocked.left || arcadeBody(follower).blocked.right;
    const progress = this.#lastDistance - distance;
    this.#stuckMs = distance > 150 && (blocked || progress < 0.35) ? this.#stuckMs + deltaMs : 0;
    this.#lastDistance = distance;
    if (distance > SPIRIT_DISTANCE || Math.abs(dy) > 210 || this.#stuckMs > 720) {
      this.#enterSpirit(followerId);
      return followerId;
    }

    if (Math.abs(dx) > FOLLOW_DISTANCE) {
      follower.setVelocityX(Math.sign(dx) * 235).setFlipX(dx < 0);
    } else follower.setVelocityX(0);
    if (dy < -38 && arcadeBody(follower).blocked.down) follower.setVelocityY(-520);
    return followerId;
  }

  onActiveCatChanged(activeId: CatId): void {
    if (this.#spiritCat === activeId) {
      const other = this.#actors[activeId === 'luma' ? 'nox' : 'luma'];
      this.#materialize(activeId, other.x + (other.flipX ? 76 : -76), other.y - 8);
    }
  }

  isSpirit(catId: CatId): boolean {
    return this.#spiritCat === catId;
  }

  reset(): void {
    if (this.#spiritCat) this.#materialize(this.#spiritCat);
    this.#lastDistance = 0;
    this.#stuckMs = 0;
  }

  stop(): void {
    if (this.#spiritCat) this.#actors[this.#spiritCat].setVelocity(0, 0);
  }

  #enterSpirit(catId: CatId): void {
    this.#spiritCat = catId;
    const sprite = this.#actors[catId];
    const body = arcadeBody(sprite);
    body.setAllowGravity(false);
    body.checkCollision.none = true;
    sprite
      .setAlpha(0.62)
      .setTint(catId === 'luma' ? 0x8feaff : 0xa970ff)
      .setDepth(10);
  }

  #updateSpirit(
    catId: CatId,
    active: Phaser.Physics.Arcade.Sprite,
    spirit: Phaser.Physics.Arcade.Sprite,
    distance: number,
    deltaMs: number,
  ): void {
    this.#scene.physics.moveToObject(spirit, active, SPIRIT_SPEED);
    this.#trailMs -= deltaMs;
    if (this.#trailMs <= 0) {
      this.#trailMs = 90;
      const mote = this.#scene.add
        .circle(spirit.x, spirit.y, 9, catId === 'luma' ? 0x78e9ff : 0x9b63ef, 0.65)
        .setDepth(5);
      this.#scene.tweens.add({
        targets: mote,
        alpha: 0,
        scale: 0.2,
        duration: 260,
        onComplete: () => mote.destroy(),
      });
    }
    if (distance < 105)
      this.#materialize(catId, active.x - (active.flipX ? -78 : 78), active.y - 8);
  }

  #materialize(catId: CatId, x?: number, y?: number): void {
    const sprite = this.#actors[catId];
    const body = arcadeBody(sprite);
    sprite
      .setPosition(x ?? sprite.x, y ?? sprite.y)
      .setVelocity(0, 0)
      .setAlpha(1)
      .clearTint()
      .setDepth(6);
    body.setAllowGravity(true);
    body.checkCollision.none = false;
    this.#spiritCat = null;
    this.#stuckMs = 0;
  }
}
