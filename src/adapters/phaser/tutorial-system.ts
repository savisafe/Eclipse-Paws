import Phaser from 'phaser';
import type { Destroyable } from './destroyable';

export interface TutorialSignals {
  attacked: boolean;
  interacted: boolean;
  jumped: boolean;
  moved: boolean;
  switched: boolean;
}

export interface TutorialStep {
  /** Which input signal completes the step, if it is completed by input at all. */
  signal?: keyof TutorialSignals;
  text: string;
}

const DEFAULT_STEPS: readonly TutorialStep[] = [
  { text: '1/5 · ДВИЖЕНИЕ\nA / D или ◀ / ▶', signal: 'moved' },
  { text: '2/5 · ПРЫЖОК\nSPACE / W или ▲', signal: 'jumped' },
  { text: '3/5 · АТАКА\n1 или ✦', signal: 'attacked' },
  { text: '4/5 · СМЕНА КОТА\nTAB или ↔', signal: 'switched' },
  { text: '5/5 · ПЕРВАЯ ПЕЧАТЬ\nПодойди к руне 1 и нажми E', signal: 'interacted' },
];

// ECLIPSE_PAWS_SCENARIO.md §12, «Начало уровня»: the garden teaches movement, the second cat,
// then each level-1 ability on a safe object, and only then names the goal. Steps 4-6 are
// completed by the level's own script (bells, switch, Gardener), not by a raw key press.
export const GARDEN_TUTORIAL_STEPS: readonly TutorialStep[] = [
  { text: 'Иди вправо  ·  A / D', signal: 'moved' },
  { text: 'Перепрыгни преграду  ·  SPACE', signal: 'jumped' },
  { text: 'Позови Нокса  ·  TAB', signal: 'switched' },
  { text: 'Разбуди колокольчики  ·  1' },
  { text: 'Достань до переключателя Ноксом  ·  1' },
  { text: 'Иди к домику Садовника  ·  →' },
];

export class TutorialSystem implements Destroyable {
  readonly #icon: Phaser.GameObjects.Arc;
  readonly #panel: Phaser.GameObjects.Container;
  readonly #reducedMotion: boolean;
  readonly #scene: Phaser.Scene;
  readonly #text: Phaser.GameObjects.Text;
  #completionCall: Phaser.Time.TimerEvent | null = null;
  #finished = false;
  #step = 0;

  readonly #steps: readonly TutorialStep[];

  constructor(
    scene: Phaser.Scene,
    reducedMotion: boolean,
    steps: readonly TutorialStep[] = DEFAULT_STEPS,
  ) {
    this.#scene = scene;
    this.#reducedMotion = reducedMotion;
    this.#steps = steps;
    const backdrop = scene.add
      .rectangle(0, 0, 390, 48, 0x111633, 0.88)
      .setStrokeStyle(2, 0x80e9e2, 0.72);
    const icon = scene.add.circle(-169, 0, 16, 0x2d315d, 1).setStrokeStyle(2, 0xffd873, 0.9);
    this.#icon = icon;
    const paw = scene.add
      .text(-169, -1, '✦', {
        color: '#ffe49a',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.#text = scene.add
      .text(-143, 0, steps[0]?.text ?? '', {
        color: '#fff5d7',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        lineSpacing: 2,
      })
      .setOrigin(0, 0.5);
    this.#panel = scene.add
      .container(640, 104, [backdrop, icon, paw, this.#text])
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
    const step = this.#steps[this.#step];
    if (!step?.signal || !signals[step.signal]) return;
    // The legacy rune step also asks the player to stand next to the first rune.
    if (step.signal === 'interacted' && Math.abs(actor.x - 900) >= 115) return;
    this.#advance();
  }

  /** Completes a step the level script owns (a prop answered, an NPC was found). */
  complete(stepIndex: number): void {
    if (this.#finished || this.#step !== stepIndex) return;
    this.#advance();
  }

  #advance(): void {
    this.#step += 1;
    if (this.#step < this.#steps.length) {
      this.#text.setText(this.#steps[this.#step]?.text ?? '').setColor('#fff5d7');
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
