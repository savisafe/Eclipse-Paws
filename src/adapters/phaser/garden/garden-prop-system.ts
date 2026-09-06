import Phaser from 'phaser';
import { GARDEN_PROPS, type GardenProp } from '@content/index';
import type { CatId, Phase } from '@core/index';
import type { Destroyable } from '../destroyable';
import { JUMP_SPEED } from '../movement-constants';
import { GardenPrompt } from './garden-prompt';
import sundialUrl from '../../../assets/decorations/garden/ancient-sundial-v1.png?url';
import sundialNightUrl from '../../../assets/decorations/garden/ancient-sundial-night-active-v1.png?url';
import bellsUrl from '../../../assets/decorations/garden/garden-bells-v1.png?url';
import flowerClosedUrl from '../../../assets/decorations/garden/light-flower-closed-v1.png?url';
import flowerOpenUrl from '../../../assets/decorations/garden/light-flower-open-v1.png?url';
import hedgeClosedUrl from '../../../assets/decorations/garden/living-hedge-gate-closed-v2.png?url';
import hedgeOpenUrl from '../../../assets/decorations/garden/living-hedge-gate-open-v1.png?url';
import gateUrl from '../../../assets/icons/items/garden-memory-gate-v1.png?url';

const TEXTURES = {
  'garden-sundial': sundialUrl,
  'garden-sundial-night': sundialNightUrl,
  'garden-bells': bellsUrl,
  'garden-flower-closed': flowerClosedUrl,
  'garden-flower-open': flowerOpenUrl,
  'garden-hedge': hedgeClosedUrl,
  'garden-hedge-open': hedgeOpenUrl,
  'garden-gate': gateUrl,
} as const;

const INTERACT_RANGE = 118;
const HEDGE_OPEN_MS = 6_000;
const GARDEN_GROUND_Y = 620;
// The hedge is a route gate, not a platform. Its body reaches above the camera so neither cat can
// land on its crown and skip the light interaction with a normal jump.
const HEDGE_COLLIDER_HEIGHT = 760;

interface PropView {
  activated: boolean;
  body: Phaser.GameObjects.Rectangle | null;
  config: GardenProp;
  view: Phaser.GameObjects.Image;
}

export interface PropReaction {
  line: string;
  propId: string;
  role: GardenProp['role'];
}

function textureFor(prop: GardenProp, activated: boolean): string {
  switch (prop.art) {
    case 'light-flower':
      return activated ? 'garden-flower-open' : 'garden-flower-closed';
    case 'living-hedge':
      return activated ? 'garden-hedge-open' : 'garden-hedge';
    case 'ancient-sundial':
      return activated ? 'garden-sundial-night' : 'garden-sundial';
    case 'garden-bells':
      return 'garden-bells';
    case 'memory-gate':
      return 'garden-gate';
  }
}

function displayWidthFor(prop: GardenProp): number {
  switch (prop.role) {
    case 'hedge':
      return 360;
    case 'sundial-light':
    case 'sundial-shadow':
      return 150;
    case 'gate':
      return 170;
    default:
      return 104;
  }
}

/**
 * Every interactive object of «Сад первой зари» (ECLIPSE_PAWS_SCENARIO.md §12, «Интерактивные
 * элементы сада»). The scenario makes three of them mandatory — light flowers, the living hedge
 * and the sundial — and lets the rest be optional colour; all of them are here, but only those
 * three gate progress.
 *
 * Each prop answers to one cat's power, which is what gives the player a reason to switch heroes
 * before the first fight ("Кошачьи способности используются и для характера перемещения").
 */
export class GardenPropSystem implements Destroyable {
  readonly #props = new Map<string, PropView>();
  readonly #prompt: GardenPrompt;
  readonly #scene: Phaser.Scene;
  readonly #solids: Phaser.Physics.Arcade.StaticGroup;
  #hedgeTimerMs = 0;
  #hedgeLatched = false;

  constructor(scene: Phaser.Scene, actors: Record<CatId, Phaser.Physics.Arcade.Sprite>) {
    this.#scene = scene;
    this.#solids = scene.physics.add.staticGroup();

    GARDEN_PROPS.forEach((config) => {
      const view = scene.add
        .image(config.x, config.y, textureFor(config, false))
        .setDepth(config.role === 'gate' ? 6 : 4);
      const width = displayWidthFor(config);
      view.setDisplaySize(width, width * (view.height / view.width));
      let body: Phaser.GameObjects.Rectangle | null = null;

      // The hedge is the level's one real blocker until Лумус opens it. Its collision box is an
      // explicit invisible rectangle rather than the decoration sprite itself: a static body
      // taken from a 1536x1024 source image would wall off a third of the zone.
      if (config.role === 'hedge') {
        body = scene.add.rectangle(
          config.x,
          GARDEN_GROUND_Y - HEDGE_COLLIDER_HEIGHT / 2,
          170,
          HEDGE_COLLIDER_HEIGHT,
          0x000000,
          0,
        );
        scene.physics.add.existing(body, true);
        this.#solids.add(body);
      }
      this.#props.set(config.id, { activated: false, body, config, view });
    });

    scene.physics.add.collider(Object.values(actors), this.#solids);

    this.#prompt = new GardenPrompt(scene);
  }

  static preload(scene: Phaser.Scene): void {
    Object.entries(TEXTURES).forEach(([key, url]) => scene.load.image(key, url));
  }

  /** How many halves of the sundial are awake (0-2) — the level's one mandatory joint action. */
  get sundialHalves(): number {
    return ['sundial-light', 'sundial-shadow'].filter(
      (id) => this.#props.get(id)?.activated ?? false,
    ).length;
  }

  get sundialReady(): boolean {
    return (
      (this.#props.get('sundial-light')?.activated ?? false) &&
      (this.#props.get('sundial-shadow')?.activated ?? false)
    );
  }

  get openedFlowers(): number {
    return [...this.#props.values()].filter(
      (prop) => prop.config.art === 'light-flower' && prop.activated,
    ).length;
  }

  get hedgeOpen(): boolean {
    return this.#hedgeLatched || this.#hedgeTimerMs > 0;
  }

  /** Targets Нокс' Теневой наскок can reach — §12: "позволяет нажимать удалённые переключатели". */
  dashTargets(): readonly { id: string; x: number; y: number }[] {
    return [...this.#props.values()]
      .filter((prop) => prop.config.role === 'hedge-switch' && !prop.activated)
      .map((prop) => ({ id: prop.config.id, x: prop.view.x, y: prop.view.y }));
  }

  triggerDashTarget(propId: string): PropReaction | null {
    const prop = this.#props.get(propId);
    if (!prop || prop.activated) return null;
    prop.activated = true;
    this.#hedgeLatched = true;
    this.#openHedge();
    this.#pulse(prop.view);
    return { line: prop.config.lineDay, propId, role: prop.config.role };
  }

  /** Оглушающий крик reaches the bells even though it is not an [E] interaction (§12). */
  shoutAt(x: number, y: number): PropReaction | null {
    const bells = [...this.#props.values()].find(
      (prop) =>
        prop.config.role === 'bells' &&
        Phaser.Math.Distance.Between(x, y, prop.view.x, prop.view.y) < 210,
    );
    if (!bells || bells.activated) return null;
    bells.activated = true;
    this.#pulse(bells.view);
    const flower = this.#props.get('flower-alley');
    if (flower && !flower.activated) this.#activateFlower(flower);
    return { line: bells.config.lineDay, propId: bells.config.id, role: 'bells' };
  }

  interact(active: Phaser.Physics.Arcade.Sprite, catId: CatId, phase: Phase): PropReaction | null {
    const prop = this.#nearest(active, catId);
    if (!prop) return null;
    const config = prop.config;
    const line = phase === 'night' && config.lineNight ? config.lineNight : config.lineDay;

    switch (config.role) {
      case 'flower-trampoline':
      case 'flower-trail':
        // Night closes the flowers again and changes the route (§12).
        if (phase === 'night')
          return { line: config.lineNight ?? line, propId: config.id, role: config.role };
        if (prop.activated) return null;
        this.#activateFlower(prop);
        break;
      case 'hedge':
        if (this.hedgeOpen) return null;
        this.#openHedge();
        this.#hedgeTimerMs = HEDGE_OPEN_MS;
        break;
      case 'sundial-light':
      case 'sundial-shadow':
        if (prop.activated) return null;
        prop.activated = true;
        prop.view.setTexture('garden-sundial-night');
        this.#pulse(prop.view);
        break;
      case 'gate':
        break;
      default:
        return null;
    }
    return { line, propId: config.id, role: config.role };
  }

  update(active: Phaser.Physics.Arcade.Sprite, catId: CatId, deltaMs: number): void {
    if (this.#hedgeTimerMs > 0 && !this.#hedgeLatched) {
      this.#hedgeTimerMs -= deltaMs;
      if (this.#hedgeTimerMs <= 0) this.#closeHedge();
    }
    this.#updateParachute(active);

    const prop = this.#nearest(active, catId);
    if (prop) {
      this.#prompt.show(
        prop.config.hint,
        prop.view.x,
        prop.view.y - prop.view.displayHeight / 2 - 22,
      );
      return;
    }
    // The remote switch is not an [E] interaction — it is what Нокс' Теневой наскок is for — but
    // it still has to announce itself, or the ability has nothing telling the player to use it.
    const switchTarget = this.#reachableSwitch(active, catId);
    if (!switchTarget) {
      this.#prompt.hide();
      return;
    }
    this.#prompt.show(
      switchTarget.config.hint,
      switchTarget.view.x,
      switchTarget.view.y - switchTarget.view.displayHeight / 2 - 22,
    );
  }

  openGate(): void {
    const gate = this.#props.get('memory-gate');
    if (!gate) return;
    gate.activated = true;
    gate.view.setAlpha(1).setTint(0xfff0b8);
    this.#pulse(gate.view);
  }

  destroy(): void {
    this.#props.forEach((prop) => {
      this.#scene.tweens.killTweensOf(prop.view);
      prop.view.destroy();
      prop.body?.destroy();
    });
    this.#props.clear();
    this.#solids.destroy(true);
    this.#prompt.destroy();
  }

  #nearest(active: Phaser.Physics.Arcade.Sprite, catId: CatId): PropView | null {
    let best: PropView | null = null;
    let bestDistance = INTERACT_RANGE;
    this.#props.forEach((prop) => {
      if (prop.config.role === 'hedge-switch') return;
      if (prop.config.role === 'hedge' && this.hedgeOpen) return;
      if (prop.config.owner !== 'any' && prop.config.owner !== catId) return;
      const distance = Phaser.Math.Distance.Between(active.x, active.y, prop.view.x, prop.view.y);
      if (distance < bestDistance) {
        best = prop;
        bestDistance = distance;
      }
    });
    return best;
  }

  #reachableSwitch(active: Phaser.Physics.Arcade.Sprite, catId: CatId): PropView | null {
    if (catId !== 'nox') return null;
    let best: PropView | null = null;
    this.#props.forEach((prop) => {
      if (prop.config.role !== 'hedge-switch' || prop.activated) return;
      if (Math.abs(prop.view.x - active.x) > 340 || Math.abs(prop.view.y - active.y) > 220) return;
      best = prop;
    });
    return best;
  }

  #activateFlower(prop: PropView): void {
    prop.activated = true;
    prop.view.setTexture('garden-flower-open');
    this.#pulse(prop.view);
  }

  // Пыльца/лепестки: a bounce instead of a hard platform, so a missed jump never punishes.
  #updateParachute(active: Phaser.Physics.Arcade.Sprite): void {
    const body = active.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;
    this.#props.forEach((prop) => {
      if (prop.config.role === 'flower-trampoline' && prop.activated) {
        // An open flower bounces the cat instead of being a solid pad: a knee-high static body
        // in the middle of the path would read as a wall, and a miss would punish (§14 asks
        // level 1 never to).
        const onPad =
          Math.abs(active.x - prop.view.x) < 78 &&
          Math.abs(active.y - (prop.view.y - 40)) < 46 &&
          body.velocity.y >= 0;
        if (onPad) active.setVelocityY(-JUMP_SPEED * 1.22);
      }
    });
  }

  #openHedge(): void {
    const hedge = this.#props.get('hedge-descent');
    if (!hedge?.body?.body) return;
    (hedge.body.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.#animateHedge(hedge, true);
  }

  #closeHedge(): void {
    const hedge = this.#props.get('hedge-descent');
    if (!hedge?.body?.body) return;
    this.#animateHedge(hedge, false);
  }

  // The foliage visibly parts before the collision changes back. A texture pop made the hedge
  // look like it vanished; squeezing the branches towards the trunks makes Лумус' light feel as
  // though it is physically clearing a path.
  #animateHedge(hedge: PropView, opening: boolean): void {
    const body = hedge.body?.body as Phaser.Physics.Arcade.StaticBody | undefined;
    const fullScaleX = displayWidthFor(hedge.config) / hedge.view.width;
    this.#scene.tweens.killTweensOf(hedge.view);
    this.#scene.tweens.add({
      targets: hedge.view,
      scaleX: fullScaleX * 0.08,
      alpha: 0.72,
      duration: 230,
      ease: 'Sine.In',
      onComplete: () => {
        hedge.view.setTexture(opening ? 'garden-hedge-open' : 'garden-hedge');
        if (!opening && body) body.enable = true;
        this.#scene.tweens.add({
          targets: hedge.view,
          scaleX: fullScaleX,
          alpha: 1,
          duration: 310,
          ease: 'Back.Out',
        });
      },
    });
  }

  #pulse(view: Phaser.GameObjects.Image): void {
    this.#scene.tweens.add({
      targets: view,
      scale: view.scale * 1.1,
      duration: 190,
      yoyo: true,
    });
  }
}
