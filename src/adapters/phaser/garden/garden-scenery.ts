import Phaser from 'phaser';
import type { CampaignLevelDefinition } from '@content/index';
import type { Destroyable } from '../destroyable';
import gardenerCottageUrl from '../../../assets/decorations/garden/gardener-cottage-v1.png?url';

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
  readonly #responsivePlants: Phaser.GameObjects.Image[] = [];
  readonly #touchDew: { burst: boolean; view: Phaser.GameObjects.Arc }[] = [];
  readonly #scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, level: CampaignLevelDefinition, reducedMotion: boolean) {
    this.#scene = scene;
    this.#addLandscape(level);
    this.#addFlowerBeds(level, reducedMotion);
    this.#addFrozenDew(level, reducedMotion);
    this.#addResponsiveGarden(reducedMotion);
  }

  static preload(scene: Phaser.Scene): void {
    scene.load.image('garden-cottage', gardenerCottageUrl);
  }

  /**
   * Small, wordless interactions keep the long safe opening playful: flowers turn to the active
   * cat, seed heads recoil from a passing tail and low dew scatters under paws. They never gate
   * progress, so the authored tutorial remains legible.
   */
  update(active: Phaser.Physics.Arcade.Sprite): void {
    this.#responsivePlants.forEach((plant) => {
      const distance = active.x - plant.x;
      // Never call setScale here: these large source paintings are sized with setDisplaySize,
      // and replacing that scale would restore their full-resolution (screen-filling) dimensions.
      // A small opacity lift reads as recognition without making rooted plants inexplicably lean.
      plant.setAlpha(Math.abs(distance) < 230 ? 0.96 : 0.78);
    });
    this.#touchDew.forEach((dew) => {
      if (
        dew.burst ||
        Phaser.Math.Distance.Between(active.x, active.y, dew.view.x, dew.view.y) > 58
      )
        return;
      dew.burst = true;
      this.#scene.tweens.add({
        targets: dew.view,
        y: dew.view.y - 22,
        alpha: 0,
        scale: 2.5,
        duration: 420,
        ease: 'Sine.Out',
      });
    });
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

  // A connected mid/foreground makes the garden read as a place, not props suspended over one
  // collision bar. The route stays forgiving and flat physically, while banks, roots and water
  // give each scripted zone its own grounded silhouette.
  #addLandscape(level: CampaignLevelDefinition): void {
    const horizon = this.#track(this.#scene.add.graphics().setDepth(-8));
    horizon.fillStyle(0x66895d, 0.28);
    for (let x = -180; x < level.worldWidth + 300; x += 520) {
      horizon.fillEllipse(x, 540 - ((x / 520) % 2) * 24, 720, 210);
    }

    const terrain = this.#track(this.#scene.add.graphics().setDepth(0));
    terrain.fillStyle(0x405b38, 0.52);
    terrain.fillEllipse(430, 630, 1120, 170);
    terrain.fillEllipse(1390, 638, 1040, 150);
    terrain.fillEllipse(2330, 640, 1060, 170);
    terrain.fillEllipse(3270, 650, 960, 125);
    terrain.fillEllipse(4140, 638, 1050, 150);
    terrain.fillEllipse(4940, 635, 970, 160);
    terrain.fillEllipse(5820, 642, 1060, 150);

    // Root descent: broad organic rails visually replace a stack of abstract platforms.
    const roots = this.#track(this.#scene.add.graphics().setDepth(2));
    roots.lineStyle(22, 0x6c5338, 0.92);
    roots.beginPath();
    roots.moveTo(1840, 617);
    roots.lineTo(2030, 574);
    roots.lineTo(2220, 598);
    roots.lineTo(2420, 654);
    roots.lineTo(2600, 638);
    roots.lineTo(2780, 616);
    roots.strokePath();
    roots.lineStyle(5, 0xb18a58, 0.45);
    roots.beginPath();
    roots.moveTo(1840, 611);
    roots.lineTo(2030, 568);
    roots.lineTo(2220, 592);
    roots.lineTo(2420, 648);
    roots.lineTo(2600, 632);
    roots.lineTo(2780, 610);
    roots.strokePath();

    // Shallow stream in the greenhouse zone. It is scenery, not instant-death water.
    const water = this.#track(this.#scene.add.graphics().setDepth(2));
    water.fillStyle(0x62cbd1, 0.48);
    water.fillRoundedRect(2890, 604, 720, 28, 14);
    water.lineStyle(3, 0xd7ffff, 0.5);
    for (let x = 2920; x < 3570; x += 105) {
      water.beginPath();
      water.moveTo(x, 610);
      water.lineTo(x + 52, 614);
      water.strokePath();
    }

    // Greenhouse and gardener's cottage are deliberately large silhouettes: landmarks anchor
    // nearby props and make the zone readable before the player reaches it.
    const greenhouse = this.#track(this.#scene.add.graphics().setDepth(-1));
    greenhouse.fillStyle(0xddecc5, 0.16);
    greenhouse.fillRoundedRect(2890, 375, 700, 235, 24);
    greenhouse.lineStyle(9, 0x566b4d, 0.65);
    greenhouse.strokeRoundedRect(2890, 375, 700, 235, 24);
    for (let x = 3000; x < 3580; x += 145) greenhouse.lineBetween(x, 382, x, 608);
    greenhouse.lineBetween(2896, 493, 3584, 493);

    this.#track(
      this.#scene.add
        .image(4110, 624, 'garden-cottage')
        .setDisplaySize(560, 373)
        .setOrigin(0.5, 1)
        // The painted asset carries a very soft black-to-gold atmospheric matte. Screen makes
        // black disappear into the garden and retains only its warm window/lantern bloom.
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setDepth(-1),
    );
  }

  #addResponsiveGarden(reducedMotion: boolean): void {
    [330, 650, 980, 1550, 2140, 2630, 3740, 4460].forEach((x, index) => {
      const flower = this.#track(
        this.#scene.add
          .image(x, 584 - (index % 2) * 8, index % 3 === 0 ? 'garden-flower-closed' : 'garden-seed')
          .setDisplaySize(index % 3 === 0 ? 54 : 38, index % 3 === 0 ? 54 : 52)
          .setOrigin(0.5, 1)
          .setAlpha(0.78)
          .setDepth(3),
      );
      this.#responsivePlants.push(flower);
      if (!reducedMotion) {
        this.#scene.tweens.add({
          targets: flower,
          y: flower.y - 5,
          duration: 1700 + index * 130,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      }
    });
    for (let x = 430; x < 4460; x += 310) {
      const view = this.#track(this.#scene.add.circle(x, 613, 4, 0xeaffff, 0.72).setDepth(4));
      this.#touchDew.push({ burst: false, view });
    }
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
