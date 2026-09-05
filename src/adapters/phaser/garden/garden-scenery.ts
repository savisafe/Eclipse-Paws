import Phaser from 'phaser';
import { GARDEN_ZONES, type CampaignLevelDefinition } from '@content/index';
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
    this.#addFallingSeeds(level, reducedMotion);
    this.#addFrozenDew(level, reducedMotion);
    this.#addZoneMarkers();
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

  // Flower beds sit on the banks between the props, densest where the level wants the player to
  // stop and look: the landing bed, the alley and the greenhouse.
  #addFlowerBeds(level: CampaignLevelDefinition, reducedMotion: boolean): void {
    const banks = level.platforms.filter((platform) => platform.height > 40);
    banks.forEach((bank, bankIndex) => {
      const top = bank.y - bank.height / 2;
      const left = bank.x - bank.width / 2;
      for (let offset = 60; offset < bank.width - 60; offset += 150) {
        const index = bankIndex + offset;
        const open = index % 3 !== 0;
        const scale = 46 + (index % 4) * 7;
        const flower = this.#track(
          this.#scene.add
            .image(
              left + offset,
              top - scale * 0.42,
              open ? 'garden-flower-open' : 'garden-flower-closed',
            )
            .setDepth(3)
            .setAlpha(0.95),
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

  // «над дорожками висят золотые семена» — they hang, they never land, because the morning here
  // never moves on.
  #addFallingSeeds(level: CampaignLevelDefinition, reducedMotion: boolean): void {
    for (let x = 220; x < level.worldWidth; x += 340) {
      const index = Math.round(x / 340);
      const seed = this.#track(
        this.#scene.add
          .image(x, 170 + (index % 4) * 55, 'garden-seed')
          .setDepth(4)
          .setAlpha(0.8),
      );
      const width = 34 + (index % 3) * 8;
      seed.setDisplaySize(width, width * (seed.height / seed.width));
      if (reducedMotion) continue;
      this.#scene.tweens.add({
        targets: seed,
        y: seed.y + 26,
        x: seed.x + (index % 2 === 0 ? 22 : -22),
        angle: index % 2 === 0 ? 8 : -8,
        duration: 4200 + (index % 5) * 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }

  // «капли росы не высыхают» — the dew keeps catching the light and never goes.
  #addFrozenDew(level: CampaignLevelDefinition, reducedMotion: boolean): void {
    const banks = level.platforms.filter((platform) => platform.height > 40);
    banks.forEach((bank, bankIndex) => {
      const top = bank.y - bank.height / 2;
      const left = bank.x - bank.width / 2;
      for (let offset = 30; offset < bank.width - 20; offset += 74) {
        const drop = this.#track(
          this.#scene.add.circle(left + offset, top - 2, 2.4, 0xffffff, 0.75).setDepth(4),
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

  // «Каждая зона получает собственный силуэт и доминирующую деталь»: a quiet marker at the seam
  // between zones so the change of place is readable from the ground.
  #addZoneMarkers(): void {
    GARDEN_ZONES.slice(1).forEach((zone, index) => {
      const arch = this.#track(this.#scene.add.graphics().setDepth(2));
      const x = zone.xStart;
      const foot = 560 + (index % 2) * 14;
      // Half-ruined stone arches at the seams between zones, in the same sandstone as the
      // terraces, so a change of place is announced by the architecture (§12).
      arch.fillStyle(0x2b2a1b, 0.16);
      arch.fillEllipse(x, foot + 8, 236, 22);
      arch.lineStyle(20, 0xb69d79, 0.92);
      arch.beginPath();
      arch.arc(x, foot - 96, 96, Math.PI * 1.04, Math.PI * 1.96);
      arch.strokePath();
      arch.lineStyle(6, 0xd6c3a0, 0.75);
      arch.beginPath();
      arch.arc(x, foot - 96, 104, Math.PI * 1.1, Math.PI * 1.9);
      arch.strokePath();
      arch.fillStyle(0xb69d79, 0.92);
      arch.fillRoundedRect(x - 106, foot - 100, 22, 100 - (index % 3) * 14, 5);
      arch.fillRoundedRect(x + 84, foot - 100, 22, 100 - ((index + 1) % 3) * 18, 5);
      arch.fillStyle(0x6f9350, 0.8);
      arch.fillCircle(x - 95, foot - 96 - (index % 3) * 10, 15);
      arch.fillCircle(x + 95, foot - 84 + (index % 2) * 8, 12);
      arch.fillStyle(0x8bb267, 0.7);
      arch.fillCircle(x + 90, foot - 100, 9);
    });
  }
}
