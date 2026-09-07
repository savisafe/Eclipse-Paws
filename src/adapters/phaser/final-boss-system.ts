import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import { BossPhaseTracker } from '@core/index';
import { hudSafeTop, sceneViewport } from './viewport';

export class FinalBossSystem {
  readonly #bossId: string;
  readonly #gameplay: GameplayController;
  readonly #label: Phaser.GameObjects.Text;
  readonly #reducedMotion: boolean;
  readonly #scene: Phaser.Scene;
  readonly #tracker: BossPhaseTracker;
  #refillMs = 0;

  constructor(
    scene: Phaser.Scene,
    gameplay: GameplayController,
    bossId: string,
    maximumHealth: number,
    reducedMotion: boolean,
  ) {
    this.#scene = scene;
    this.#gameplay = gameplay;
    this.#bossId = bossId;
    this.#reducedMotion = reducedMotion;
    this.#tracker = new BossPhaseTracker(maximumHealth);
    this.#label = scene.add
      .text(0, 0, 'Пожиратель Зари · Фаза 1', {
        color: '#fff2c2',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
        stroke: '#201537',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(35);
  }

  update(deltaMs: number): void {
    // Re-anchored and re-sized every frame instead of once: the view changes shape whenever the
    // device rotates or a mobile browser's toolbar slides away (see `viewport.ts`).
    const view = sceneViewport(this.#scene);
    this.#label
      .setPosition(view.width / 2, hudSafeTop(view))
      .setFontSize(19 * view.ui)
      .setStroke('#201537', 5 * view.ui);
    const snapshot = this.#gameplay.getSnapshot();
    const health = snapshot.enemies.find((enemy) => enemy.id === this.#bossId)?.health ?? 0;
    const result = this.#tracker.update(health);
    if (result.changed) {
      this.#label.setText(`Пожиратель Зари · Фаза ${result.phase}`);
      if (!this.#reducedMotion) this.#scene.cameras.main.flash(180, 180, 125, 255, false);
    }
    if (result.phase !== 3 || health <= 0) return;
    this.#refillMs -= deltaMs;
    if (snapshot.eclipseMeter < snapshot.maxEclipseMeter && this.#refillMs <= 0) {
      this.#refillMs = 500;
      this.#gameplay.rewardEclipse(100);
    }
  }
}
