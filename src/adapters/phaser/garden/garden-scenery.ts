import Phaser from 'phaser';
import type { CampaignLevelDefinition } from '@content/index';
import type { Destroyable } from '../destroyable';
import gardenerCottageUrl from '../../../assets/decorations/garden/gardener-cottage-v1.png?url';
import { gardenMapObjects, type GardenMapObject } from './garden-map-layout';

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

  constructor(scene: Phaser.Scene, level: CampaignLevelDefinition) {
    this.#scene = scene;
    this.#addLandscape(level);
  }

  static preload(scene: Phaser.Scene): void {
    scene.load.image('garden-cottage', gardenerCottageUrl);
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

    // The sundial is not standing on an anonymous stretch of garden soil: it has its own broad,
    // old paved square in front of the Gardener's cottage (§12, "Площадь солнечных
    // часов"). A strip of untouched garden between the cottage and the first paving stones keeps
    // the two landmarks clearly separate instead of making the clock look like house decoration.
    const plaza = this.#requiredLandscapeObject(landscape, 'plaza');
    const paving = this.#track(this.#scene.add.graphics().setDepth(2));
    const centerX = plaza.x + plaza.width / 2;
    const centerY = plaza.y + plaza.height / 2;

    // A short procession of inset stones makes the distance from the cottage readable.
    paving.fillStyle(0xb8a989, 0.78);
    for (let step = 0; step < 4; step += 1) {
      paving.fillEllipse(plaza.x - 150 + step * 48, centerY + 8 - step * 2, 35, 14);
    }

    // Warm, time-worn paving with a darker stone rim. The flattened ellipse gives the square the
    // perspective of a ground plane while keeping the cats and the clock unobscured.
    paving.fillStyle(0x8b765e, 0.96);
    paving.fillEllipse(centerX, centerY + 8, plaza.width + 22, plaza.height + 24);
    paving.lineStyle(7, 0xd2c49d, 0.94);
    paving.strokeEllipse(centerX, centerY + 4, plaza.width, plaza.height);
    paving.fillStyle(0xc5b68f, 0.98);
    paving.fillEllipse(centerX, centerY, plaza.width - 18, plaza.height - 18);

    // Concentric rings and radial seams read as hand-laid flagstones and visually anchor the two
    // interactive halves of the sundial at the centre of one plaza.
    paving.lineStyle(3, 0x8d8068, 0.72);
    paving.strokeEllipse(centerX, centerY, plaza.width * 0.68, plaza.height * 0.64);
    paving.strokeEllipse(centerX, centerY, plaza.width * 0.29, plaza.height * 0.38);
    for (let spoke = 0; spoke < 12; spoke += 1) {
      const angle = (Math.PI * 2 * spoke) / 12;
      paving.beginPath();
      paving.moveTo(
        centerX + Math.cos(angle) * plaza.width * 0.16,
        centerY + Math.sin(angle) * plaza.height * 0.18,
      );
      paving.lineTo(
        centerX + Math.cos(angle) * plaza.width * 0.47,
        centerY + Math.sin(angle) * plaza.height * 0.45,
      );
      paving.strokePath();
    }

    // Small tufts soften the border without shrinking the clear playable space around the clock.
    const borderPlants = this.#track(this.#scene.add.graphics().setDepth(3));
    borderPlants.fillStyle(0x496b3f, 0.9);
    [plaza.x + 26, plaza.x + plaza.width - 26].forEach((x) => {
      borderPlants.fillEllipse(x, centerY + 35, 62, 25);
      borderPlants.fillStyle(0xe8ce73, 0.88);
      borderPlants.fillCircle(x - 12, centerY + 27, 4);
      borderPlants.fillCircle(x + 10, centerY + 31, 3);
      borderPlants.fillStyle(0x496b3f, 0.9);
    });

    // The painted background already contains the greenhouse. Only the cottage needs a separate
    // authored landmark sprite; duplicating the greenhouse with vector lines breaks the art style.
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
}
