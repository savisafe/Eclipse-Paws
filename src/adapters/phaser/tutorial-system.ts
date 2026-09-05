import Phaser from 'phaser';
import type { Destroyable } from './destroyable';

export interface TutorialSignals {
  attacked: boolean;
  interacted: boolean;
  jumped: boolean;
  moved: boolean;
  switched: boolean;
}

const STEPS = [
  '1/5 · ДВИЖЕНИЕ\nA / D или ◀ / ▶',
  '2/5 · ПРЫЖОК\nSPACE / W или ▲',
  '3/5 · АТАКА\n1 или ✦',
  '4/5 · СМЕНА КОТА\nTAB или ↔',
  '5/5 · ПЕРВАЯ ПЕЧАТЬ\nПодойди к руне 1 и нажми E',
] as const;

export class TutorialSystem implements Destroyable {
  readonly #icon: Phaser.GameObjects.Arc;
  readonly #panel: Phaser.GameObjects.Container;
  readonly #reducedMotion: boolean;
  readonly #scene: Phaser.Scene;
  readonly #text: Phaser.GameObjects.Text;
  #completionCall: Phaser.Time.TimerEvent | null = null;
  #finished = false;
  #step = 0;

  constructor(scene: Phaser.Scene, reducedMotion: boolean) {
    this.#scene = scene;
    this.#reducedMotion = reducedMotion;
    const backdrop = scene.add
      .rectangle(0, 0, 310, 76, 0x111633, 0.94)
      .setStrokeStyle(3, 0x80e9e2, 0.82);
    const icon = scene.add.circle(-126, 0, 23, 0x2d315d, 1).setStrokeStyle(3, 0xffd873, 0.9);
    this.#icon = icon;
    const paw = scene.add
      .text(-126, -1, '✦', {
        color: '#ffe49a',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.#text = scene.add
      .text(-91, 0, STEPS[0], {
        color: '#fff5d7',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        lineSpacing: 5,
      })
      .setOrigin(0, 0.5);
    this.#panel = scene.add
      .container(640, 165, [backdrop, icon, paw, this.#text])
      .setScrollFactor(0)
      .setDepth(38);
    if (!reducedMotion) {
      scene.tweens.add({
        targets: icon,
        scale: 1.12,
        duration: 720,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    }
  }

  observe(signals: TutorialSignals, actor: Phaser.Physics.Arcade.Sprite): void {
    if (this.#finished) return;
    const completed =
      (this.#step === 0 && signals.moved) ||
      (this.#step === 1 && signals.jumped) ||
      (this.#step === 2 && signals.attacked) ||
      (this.#step === 3 && signals.switched) ||
      (this.#step === 4 && signals.interacted && Math.abs(actor.x - 900) < 115);
    if (!completed) return;
    this.#step += 1;
    if (this.#step < STEPS.length) {
      this.#text.setText(`✓  ${STEPS[this.#step]}`).setColor('#b9ffe5');
      return;
    }
    this.#finished = true;
    this.#text.setText('✓ ОБУЧЕНИЕ ЗАВЕРШЕНО').setColor('#ffe18a');
    this.#completionCall = this.#scene.time.delayedCall(this.#reducedMotion ? 500 : 1000, () => {
      this.#scene.tweens.add({
        targets: this.#panel,
        alpha: 0,
        y: 135,
        duration: this.#reducedMotion ? 1 : 420,
        onComplete: () => this.#panel.destroy(true),
      });
    });
  }

  // The pulsing icon tween (`repeat: -1`) and the completion delayedCall outlive `observe()` calls
  // — Phaser's TweenManager/Clock already kill both on scene shutdown, but destroy() makes that
  // explicit and lets this system be torn down independently of a full scene shutdown (ARC-010).
  destroy(): void {
    this.#scene.tweens.killTweensOf(this.#icon);
    this.#completionCall?.remove(false);
    this.#panel.destroy(true);
  }
}
