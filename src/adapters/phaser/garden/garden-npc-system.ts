import Phaser from 'phaser';
import { GARDEN_NPCS, type GardenNpc } from '@content/index';
import type { Phase } from '@core/index';
import type { Destroyable } from '../destroyable';
import type { GardenLine } from './garden-dialogue-panel';
import { GardenPrompt } from './garden-prompt';
import gardenerIdleUrl from '../../../assets/sprites/npcs/gardener-idle-v1.png?url';
import gardenerNightUrl from '../../../assets/sprites/npcs/gardener-night-reaction-v1.png?url';
import littleOneDayUrl from '../../../assets/sprites/npcs/sun-little-one-day-v1.png?url';
import littleOneNightUrl from '../../../assets/sprites/npcs/sun-little-one-night-v1.png?url';

const TEXTURES = {
  'garden-npc-gardener': gardenerIdleUrl,
  'garden-npc-gardener-night': gardenerNightUrl,
  'garden-npc-little-one': littleOneDayUrl,
  'garden-npc-little-one-night': littleOneNightUrl,
} as const;

const TALK_RANGE = 130;

interface NpcView {
  config: GardenNpc;
  spokenAtNight: boolean;
  spokenByDay: boolean;
  view: Phaser.GameObjects.Image;
}

function textureFor(npc: GardenNpc, phase: Phase): string {
  if (npc.art === 'gardener') {
    return phase === 'night' ? 'garden-npc-gardener-night' : 'garden-npc-gardener';
  }
  return phase === 'night' ? 'garden-npc-little-one-night' : 'garden-npc-little-one';
}

/**
 * The garden's inhabitants (ECLIPSE_PAWS_SCENARIO.md §12): the Gardener, who saw Элиас pass
 * through the gate, and the sun little ones, who are friendly but scattered by day. After
 * nightfall their glowing bodies go out and their shadows speak instead — the same character with
 * two sides of one conversation, "днём он показывает приятное воспоминание; ночью его тень
 * раскрывает чувство, спрятанное внутри этого воспоминания".
 */
export class GardenNpcSystem implements Destroyable {
  readonly #npcs = new Map<string, NpcView>();
  readonly #prompt: GardenPrompt;
  readonly #scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, reducedMotion: boolean) {
    this.#scene = scene;
    GARDEN_NPCS.forEach((config) => {
      const view = scene.add.image(config.x, config.y, textureFor(config, 'day')).setDepth(5);
      const width = config.art === 'gardener' ? 136 : 88;
      view.setDisplaySize(width, width * (view.height / view.width));
      if (!reducedMotion) {
        scene.tweens.add({
          targets: view,
          y: view.y - 6,
          duration: 1800 + config.x * 0.1,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
        // Small idle gestures keep inhabitants from reading as pasted-on signposts. Their motion
        // is deliberately slower than the heroes' animation so it never steals focus.
        scene.tweens.add({
          targets: view,
          angle: config.art === 'gardener' ? 1.5 : config.x % 2 === 0 ? 3 : -3,
          duration: config.art === 'gardener' ? 2600 : 1700,
          delay: (config.x % 5) * 120,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      }
      this.#npcs.set(config.id, { config, spokenAtNight: false, spokenByDay: false, view });
    });

    this.#prompt = new GardenPrompt(scene);
  }

  static preload(scene: Phaser.Scene): void {
    Object.entries(TEXTURES).forEach(([key, url]) => scene.load.image(key, url));
  }

  applyPhase(phase: Phase): void {
    this.#npcs.forEach((npc) => {
      npc.view.setTexture(textureFor(npc.config, phase));
      const width = npc.config.art === 'gardener' ? 136 : 88;
      npc.view.setDisplaySize(width, width * (npc.view.height / npc.view.width));
      // At night the little ones' bodies go out and only their shadows are readable.
      npc.view.setAlpha(phase === 'night' && npc.config.art !== 'gardener' ? 0.82 : 1);
    });
  }

  nearest(x: number, y: number): GardenNpc | null {
    let best: NpcView | null = null;
    let bestDistance = TALK_RANGE;
    this.#npcs.forEach((npc) => {
      const distance = Phaser.Math.Distance.Between(x, y, npc.view.x, npc.view.y);
      if (distance < bestDistance) {
        best = npc;
        bestDistance = distance;
      }
    });
    return best ? (best as NpcView).config : null;
  }

  /** Lines for the NPC in reach, or null. Each side of a character is offered once. */
  talk(x: number, y: number, phase: Phase): readonly GardenLine[] | null {
    const config = this.nearest(x, y);
    if (!config) return null;
    const npc = this.#npcs.get(config.id);
    if (!npc) return null;
    const night = phase === 'night';
    const spoken = night ? npc.spokenAtNight : npc.spokenByDay;
    const lines = night ? config.nightLines : config.dayLines;
    if (spoken || lines.length === 0) return null;
    if (night) npc.spokenAtNight = true;
    else npc.spokenByDay = true;
    // The lines already name their own speaker: the Gardener scene is an exchange between three
    // characters, and at night a little one is answered by its shadow instead (§12).
    return lines.map((line) => ({ ...line }));
  }

  hasSpoken(npcId: string, phase: Phase): boolean {
    const npc = this.#npcs.get(npcId);
    if (!npc) return false;
    return phase === 'night' ? npc.spokenAtNight : npc.spokenByDay;
  }

  update(x: number, y: number, phase: Phase): void {
    const config = this.nearest(x, y);
    const npc = config ? this.#npcs.get(config.id) : null;
    if (!config || !npc) {
      this.#prompt.hide();
      return;
    }
    const spoken = phase === 'night' ? npc.spokenAtNight : npc.spokenByDay;
    this.#prompt.show(
      spoken ? config.name : `${config.name} · поговорить [E]`,
      npc.view.x,
      npc.view.y - npc.view.displayHeight / 2 - 20,
    );
  }

  destroy(): void {
    this.#npcs.forEach((npc) => {
      this.#scene.tweens.killTweensOf(npc.view);
      npc.view.destroy();
    });
    this.#npcs.clear();
    this.#prompt.destroy();
  }
}
