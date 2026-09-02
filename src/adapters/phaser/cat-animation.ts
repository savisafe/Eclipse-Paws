import Phaser from 'phaser';
import type { CatId } from '@core/index';
import { setCatPose } from './sprite-atlas';

export function updateCatAnimation(
  sprite: Phaser.Physics.Arcade.Sprite,
  catId: CatId,
  actionLockMs: Record<CatId, number>,
  deltaMs: number,
): void {
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  actionLockMs[catId] = Math.max(0, actionLockMs[catId] - deltaMs);
  if (actionLockMs[catId] > 0) return;
  if (!body.blocked.down) {
    sprite.anims.stop();
    setCatPose(sprite, catId, 'jump');
  } else if (Math.abs(body.velocity.x) > 15) {
    sprite.anims.play(`${catId}-run`, true);
  } else {
    sprite.anims.stop();
    setCatPose(sprite, catId, 'idle');
  }
}
