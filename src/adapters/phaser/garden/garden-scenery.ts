import Phaser from 'phaser';
import type { CampaignLevelDefinition } from '@content/index';
import type { Destroyable } from '../destroyable';
import gardenerCottageUrl from '../../../assets/decorations/garden/gardener-cottage-v1.png?url';
import { gardenMapObjects, gardenMapProperty, type GardenMapObject } from './garden-map-layout';

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

    const landscape = gardenMapObjects(this.#scene, 'Landscape');
    const terrain = this.#track(this.#scene.add.graphics().setDepth(0));
    terrain.fillStyle(0x8d7655, 0.98);
    landscape
      .filter((object) => object.type === 'terrain' && object.polygon)
      .forEach((object) => {
        const points = object.polygon?.map(
          (point) => new Phaser.Math.Vector2(object.x + (point.x ?? 0), object.y + (point.y ?? 0)),
        );
        if (!points || points.length < 3) return;
        terrain.fillPoints(points, true);

        // Only the authored upper edge gets a grass cap; the closing points at the bottom belong
        // to the soil body. Editing the polygon in Tiled now edits the visible silhouette too.
        const upperEdge = points.slice(0, -2);
        terrain.lineStyle(17, 0x668b4e, 1);
        terrain.strokePoints(upperEdge, false);
        terrain.lineStyle(6, 0x91b86c, 0.92);
        terrain.strokePoints(upperEdge, false);
      });

    // Root descent: broad organic rails visually replace a stack of abstract platforms.
    const rootPath = this.#requiredLandscapeObject(landscape, 'roots');
    const roots = this.#track(this.#scene.add.graphics().setDepth(2));
    roots.lineStyle(22, 0x6c5338, 0.92);
    roots.beginPath();
    this.#tracePolyline(roots, rootPath);
    roots.strokePath();
    roots.lineStyle(5, 0xb18a58, 0.45);
    roots.beginPath();
    this.#tracePolyline(roots, rootPath, -6);
    roots.strokePath();

    // Shallow stream in the greenhouse zone. It is scenery, not instant-death water.
    const stream = this.#requiredLandscapeObject(landscape, 'water');
    const water = this.#track(this.#scene.add.graphics().setDepth(2));
    water.fillStyle(0x62cbd1, 0.48);
    water.fillRoundedRect(stream.x, stream.y, stream.width, stream.height, stream.height / 2);
    water.lineStyle(3, 0xd7ffff, 0.5);
    for (let x = stream.x + 30; x < stream.x + stream.width - 40; x += 105) {
      water.beginPath();
      water.moveTo(x, stream.y + 6);
      water.lineTo(x + 52, stream.y + 10);
      water.strokePath();
    }

    // Greenhouse and gardener's cottage are deliberately large silhouettes: landmarks anchor
    // nearby props and make the zone readable before the player reaches it.
    const greenhouseArea = this.#requiredLandscapeObject(landscape, 'greenhouse');
    const greenhouse = this.#track(this.#scene.add.graphics().setDepth(-1));
    greenhouse.fillStyle(0xddecc5, 0.16);
    greenhouse.fillRoundedRect(
      greenhouseArea.x,
      greenhouseArea.y,
      greenhouseArea.width,
      greenhouseArea.height,
      24,
    );
    greenhouse.lineStyle(9, 0x566b4d, 0.65);
    greenhouse.strokeRoundedRect(
      greenhouseArea.x,
      greenhouseArea.y,
      greenhouseArea.width,
      greenhouseArea.height,
      24,
    );
    for (let x = greenhouseArea.x + 110; x < greenhouseArea.x + greenhouseArea.width; x += 145)
      greenhouse.lineBetween(
        x,
        greenhouseArea.y + 7,
        x,
        greenhouseArea.y + greenhouseArea.height - 2,
      );
    greenhouse.lineBetween(
      greenhouseArea.x + 6,
      greenhouseArea.y + greenhouseArea.height / 2,
      greenhouseArea.x + greenhouseArea.width - 6,
      greenhouseArea.y + greenhouseArea.height / 2,
    );

    const cottage = this.#requiredLandscapeObject(landscape, 'cottage');
    this.#track(
      this.#scene.add
        .image(cottage.x + cottage.width / 2, cottage.y + cottage.height, 'garden-cottage')
        .setDisplaySize(cottage.width, cottage.height)
        .setOrigin(0.5, 1)
        // The painted asset carries a very soft black-to-gold atmospheric matte. Screen makes
        // black disappear into the garden and retains only its warm window/lantern bloom.
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setDepth(-1),
    );
  }

  #addResponsiveGarden(reducedMotion: boolean): void {
    const ambient = gardenMapObjects(this.#scene, 'Ambient');
    const flowerLine = this.#requiredLandscapeObject(ambient, 'flower-line');
    const flowerXs: number[] = [];
    for (
      let x = flowerLine.x;
      x <= flowerLine.x + flowerLine.width;
      x += gardenMapProperty(flowerLine, 'spacing', 310)
    )
      flowerXs.push(x);
    flowerXs.forEach((x, index) => {
      const flower = this.#track(
        this.#scene.add
          .image(
            x,
            flowerLine.y - (index % 2) * 8,
            index % 3 === 0 ? 'garden-flower-closed' : 'garden-seed',
          )
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
    const dewLine = this.#requiredLandscapeObject(ambient, 'dew-line');
    for (
      let x = dewLine.x;
      x < dewLine.x + dewLine.width;
      x += gardenMapProperty(dewLine, 'spacing', 310)
    ) {
      const view = this.#track(this.#scene.add.circle(x, dewLine.y, 4, 0xeaffff, 0.72).setDepth(4));
      this.#touchDew.push({ burst: false, view });
    }
  }

  #requiredLandscapeObject(objects: readonly GardenMapObject[], type: string): GardenMapObject {
    const object = objects.find((candidate) => candidate.type === type);
    if (!object) throw new Error(`Garden map is missing a "${type}" object`);
    return object;
  }

  #tracePolyline(
    graphics: Phaser.GameObjects.Graphics,
    object: GardenMapObject,
    yOffset = 0,
  ): void {
    const [first, ...rest] = object.polyline ?? [];
    if (!first) throw new Error(`Garden map object "${object.name}" has no polyline`);
    graphics.moveTo(object.x + (first.x ?? 0), object.y + (first.y ?? 0) + yOffset);
    rest.forEach((point) =>
      graphics.lineTo(object.x + (point.x ?? 0), object.y + (point.y ?? 0) + yOffset),
    );
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
