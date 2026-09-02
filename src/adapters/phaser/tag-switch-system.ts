import Phaser from 'phaser';
import type { CatId } from '@core/index';
import { setCatPose } from './sprite-atlas';

export class TagSwitchSystem {
  readonly #actors: Record<CatId, Phaser.Physics.Arcade.Sprite>;
  readonly #reducedMotion: boolean;
  readonly #scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    actors: Record<CatId, Phaser.Physics.Arcade.Sprite>,
    reducedMotion: boolean,
  ) {
    this.#scene = scene;
    this.#actors = actors;
    this.#reducedMotion = reducedMotion;
  }

  animate(previousId: CatId, nextId: CatId, onComplete: () => void): void {
    const previous = this.#actors[previousId];
    const next = this.#actors[nextId];
    const position = { x: previous.x, y: previous.y };
    const effect = this.#createEffect(nextId, position.x, position.y);
    const duration = this.#reducedMotion ? 1 : 150;
    previous.setVelocity(0, 0);
    this.#scene.tweens.add({
      targets: previous,
      alpha: 0,
      scale: 0.18,
      duration,
      onComplete: () => {
        previous.disableBody(true, true).setAlpha(1).setScale(0.58);
        next.enableBody(true, position.x, position.y, true, true).setAlpha(0).setScale(0.2);
        next.setFlipX(previous.flipX);
        setCatPose(next, nextId, 'ability');
        this.#scene.cameras.main.startFollow(next, true, 0.09, 0.09);
        this.#scene.tweens.add({
          targets: next,
          alpha: 1,
          scale: 0.58,
          duration: this.#reducedMotion ? 1 : 210,
          onComplete,
        });
      },
    });
    this.#scene.tweens.add({
      targets: effect,
      alpha: 0,
      scale: nextId === 'luma' ? 2.8 : 2.1,
      angle: nextId === 'luma' ? 0 : 110,
      duration: this.#reducedMotion ? 1 : 380,
      onComplete: () => effect.destroy(),
    });
  }

  #createEffect(catId: CatId, x: number, y: number): Phaser.GameObjects.Graphics {
    const graphics = this.#scene.add.graphics().setPosition(x, y).setDepth(16);
    if (catId === 'luma') {
      graphics.lineStyle(7, 0xffdd72, 0.95);
      graphics.strokeCircle(0, 0, 34);
      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12;
        graphics.lineBetween(
          Math.cos(angle) * 44,
          Math.sin(angle) * 44,
          Math.cos(angle) * 76,
          Math.sin(angle) * 76,
        );
      }
    } else {
      graphics.lineStyle(8, 0x8f55df, 0.9);
      graphics.strokeCircle(0, 0, 48);
      graphics.lineStyle(5, 0x4c248c, 0.85);
      graphics.arc(0, 0, 72, 0.2, 4.9);
      graphics.strokePath();
      graphics.fillStyle(0xb78aff, 0.8);
      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8;
        graphics.fillCircle(Math.cos(angle) * 66, Math.sin(angle) * 38, 5);
      }
    }
    return graphics;
  }
}
