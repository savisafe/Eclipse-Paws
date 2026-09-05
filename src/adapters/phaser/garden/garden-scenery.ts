import Phaser from 'phaser';
import type { CampaignLevelDefinition } from '@content/index';
import type { Destroyable } from '../destroyable';

/**
 * The dressing of «Сад первой зари» (ECLIPSE_PAWS_SCENARIO.md §12, «Визуальный образ» /
 * «Ландшафт»): flower beds along the banks, golden seeds hanging over the paths, dew that never
 * dries, and a soft far plane so the garden reads as a big place rather than a strip of ground.
 *
 * Everything here is built from the level's own drawn props (`src/assets/decorations/garden`) and
 * the painted background — the garden has no drawn ground/root pieces of its own, so the terrain
 * itself is painted in `arena-decoration.ts` and this module gives it life on top.
 */
export class GardenScenery implements Destroyable {
  readonly #objects: Phaser.GameObjects.GameObject[] = [];
  readonly #scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, level: CampaignLevelDefinition, reducedMotion: boolean) {
    this.#scene = scene;
    this.#addFlowerBeds(level, reducedMotion);
    this.#addFrozenDew(level, reducedMotion);
  }

  destroy(): void {
    this.#objects.forEach((object) => {
      this.#scene.tweens.killTweensOf(object);
      object.destroy();
    });
    this.#objects.length = 0;
  }

  #track<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.#objects.push(object);
    return object;
  }

  // Flower beds punctuate the banks instead of carpeting them. Large quiet gaps around authored
  // props keep the route and the two cats readable at a glance.
  #addFlowerBeds(level: CampaignLevelDefinition, reducedMotion: boolean): void {
    const banks = level.platforms.filter((platform) => platform.height > 40);
    banks.forEach((bank, bankIndex) => {
      const top = bank.y - bank.height / 2;
      const left = bank.x - bank.width / 2;
      for (let offset = 90; offset < bank.width - 90; offset += 290) {
        const index = bankIndex + offset;
        const open = index % 3 !== 0;
        const scale = 28 + (index % 4) * 5;
        const flower = this.#track(
          this.#scene.add
            .image(
              left + offset,
              top - scale * 0.42,
              open ? 'garden-flower-open' : 'garden-flower-closed',
            )
            .setDepth(2)
            .setAlpha(0.72),
        );
        flower.setDisplaySize(scale, scale * (flower.height / flower.width));
        if (reducedMotion) continue;
        // Огромные цветы «медленно поворачиваются вслед за Лумусом» — a slow, endless sway.
        this.#scene.tweens.add({
          targets: flower,
          angle: index % 2 === 0 ? 4 : -4,
          duration: 2600 + (index % 5) * 320,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      }
    });
  }

  // «капли росы не высыхают» — the dew keeps catching the light and never goes.
  #addFrozenDew(level: CampaignLevelDefinition, reducedMotion: boolean): void {
    const banks = level.platforms.filter((platform) => platform.height > 40);
    banks.forEach((bank, bankIndex) => {
      const top = bank.y - bank.height / 2;
      const left = bank.x - bank.width / 2;
      for (let offset = 55; offset < bank.width - 30; offset += 148) {
        const drop = this.#track(
          this.#scene.add.circle(left + offset, top - 2, 2, 0xffffff, 0.55).setDepth(2),
        );
        if (reducedMotion) continue;
        this.#scene.tweens.add({
          targets: drop,
          alpha: 0.25,
          duration: 1400 + ((bankIndex + offset) % 6) * 260,
          yoyo: true,
          repeat: -1,
        });
      }
    });
  }
}
