import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { LevelPoint } from '@content/index';
import type { CatId, Phase } from '@core/index';

interface HazardView {
  activePhase: Phase;
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
}

export class PlatformerHazardSystem {
  readonly #actors: Record<CatId, Phaser.Physics.Arcade.Sprite>;
  readonly #gameplay: GameplayController;
  readonly #hazards: HazardView[];
  readonly #scene: Phaser.Scene;
  readonly #reducedMotion: boolean;
  #damageCooldownMs = 0;

  constructor(
    scene: Phaser.Scene,
    gameplay: GameplayController,
    actors: Record<CatId, Phaser.Physics.Arcade.Sprite>,
    reducedMotion: boolean,
    hazards: readonly (LevelPoint & { activePhase: Phase })[],
  ) {
    this.#scene = scene;
    this.#gameplay = gameplay;
    this.#actors = actors;
    this.#reducedMotion = reducedMotion;
    this.#hazards = hazards.map((hazard) => ({ ...hazard, graphics: this.#draw(hazard) }));
  }

  update(deltaMs: number): void {
    this.#damageCooldownMs = Math.max(0, this.#damageCooldownMs - deltaMs);
    const phase = this.#gameplay.getSnapshot().phase;
    this.#hazards.forEach((hazard) => {
      const hazardActive = hazard.activePhase === phase;
      hazard.graphics.setAlpha(hazardActive ? 0.95 : 0.18);
      if (!hazardActive || this.#damageCooldownMs > 0) return;
      const activeCat = this.#actors[this.#gameplay.getSnapshot().activeCat];
      const hit = Phaser.Math.Distance.Between(activeCat.x, activeCat.y, hazard.x, hazard.y) < 62;
      if (hit) {
        this.#damageCooldownMs = 1250;
        this.#gameplay.takeDamage(1);
        if (!this.#reducedMotion) this.#scene.cameras.main.flash(80, 214, 42, 86, false);
      }
    });
  }

  #draw(hazard: Omit<HazardView, 'graphics'>): Phaser.GameObjects.Graphics {
    const graphics = this.#scene.add.graphics().setDepth(4);
    const color = hazard.activePhase === 'day' ? 0xffa33f : 0x8e48de;
    graphics.fillStyle(color, 0.9);
    for (let index = 0; index < 5; index += 1) {
      const x = hazard.x - 48 + index * 24;
      graphics.fillTriangle(x - 12, hazard.y + 10, x, hazard.y - 48, x + 12, hazard.y + 10);
    }
    graphics.lineStyle(3, 0xffe8ad, 0.55);
    graphics.lineBetween(hazard.x - 55, hazard.y + 10, hazard.x + 55, hazard.y + 10);
    return graphics;
  }
}
