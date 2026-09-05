import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import { GARDEN_BEATS, GARDEN_ZONES, type CampaignLevelDefinition } from '@content/index';
import type { CatId, Phase } from '@core/index';
import type { Destroyable } from '../destroyable';
import type { PlatformerEnemySystem } from '../platformer-enemy-system';
import { GardenDialoguePanel, type GardenLine } from './garden-dialogue-panel';
import { GardenNightSystem } from './garden-night-system';
import { GardenNpcSystem } from './garden-npc-system';
import { GardenPropSystem } from './garden-prop-system';
import { GardenScenery } from './garden-scenery';
import seedIconUrl from '../../../assets/icons/cards/garden-golden-seed-v1.png?url';
import handprintUrl from '../../../assets/decorations/heart/elias-real-hand-dream-wall-v1.png?url';

const HOUND_IDS = ['hound-1', 'hound-2', 'hound-3', 'hound-alpha'] as const;

type BeatId = (typeof GARDEN_BEATS)[number]['id'];

function beatLines(id: BeatId): readonly GardenLine[] {
  return GARDEN_BEATS.find((beat) => beat.id === id)?.lines ?? [];
}

/**
 * The authored script of level 1 «Сад первой зари» (ECLIPSE_PAWS_SCENARIO.md §12) and the owner of
 * everything that makes the level itself: its props, its inhabitants, its real night, and the
 * order of its beats.
 *
 * The shape of the level follows the scenario's rhythm exactly — a long safe stretch with no
 * enemies at all, the Gardener, the sundial that the two cats turn together, and only then the
 * turning point: the sleep notices them, the ground shakes and the hounds of Silence arrive. Time
 * snaps back to day in the middle of that fight, which is what hands the fight from Нокс to Лумус
 * ("днём главным бойцом является Лумус, ночью — Нокс").
 */
export class GardenLevelSystem implements Destroyable {
  readonly #actors: Record<CatId, Phaser.Physics.Arcade.Sprite>;
  readonly #dialogue: GardenDialoguePanel;
  readonly #done = new Set<BeatId>();
  readonly #enemies: PlatformerEnemySystem;
  readonly #gameplay: GameplayController;
  readonly #night: GardenNightSystem;
  readonly #npcs: GardenNpcSystem;
  readonly #props: GardenPropSystem;
  readonly #scenery: GardenScenery;
  readonly #onHandOver?: (catId: CatId) => void;
  readonly #onTutorialStep?: (stepIndex: number) => void;
  readonly #reducedMotion: boolean;
  readonly #scene: Phaser.Scene;
  readonly #zoneBanner: Phaser.GameObjects.Text;
  #cracks: Phaser.GameObjects.Graphics | null = null;
  #handprint: Phaser.GameObjects.Image | null = null;
  #seed: Phaser.GameObjects.Image | null = null;
  #zoneId = '';

  constructor(options: {
    actors: Record<CatId, Phaser.Physics.Arcade.Sprite>;
    enemies: PlatformerEnemySystem;
    gameplay: GameplayController;
    level: CampaignLevelDefinition;
    nightBrightness: number;
    /** Hands control to the cat whose half of the day it is (§12). */
    onHandOver?: (catId: CatId) => void;
    /** Completes the level-script-owned steps of the garden tutorial (§12, «Начало уровня»). */
    onTutorialStep?: (stepIndex: number) => void;
    reducedMotion: boolean;
    scene: Phaser.Scene;
  }) {
    this.#onHandOver = options.onHandOver;
    this.#onTutorialStep = options.onTutorialStep;
    this.#actors = options.actors;
    this.#enemies = options.enemies;
    this.#gameplay = options.gameplay;
    this.#reducedMotion = options.reducedMotion;
    this.#scene = options.scene;
    // Dressing first, so flower beds and dew sit behind the interactive props.
    this.#scenery = new GardenScenery(options.scene, options.level, options.reducedMotion);
    this.#props = new GardenPropSystem(options.scene, options.actors);
    this.#npcs = new GardenNpcSystem(options.scene, options.reducedMotion);
    this.#night = new GardenNightSystem(options.scene, options.level, options.nightBrightness);
    this.#dialogue = new GardenDialoguePanel(options.scene, options.reducedMotion);
    // Each zone announces itself once, so the player can navigate by landmarks instead of a
    // mini-map (§12: "Каждая зона получает собственный силуэт и доминирующую деталь").
    this.#zoneBanner = options.scene.add
      // Left-aligned under the level's objective line: the centre of the screen belongs to the
      // tutorial card during the garden's first minutes.
      .text(95, 132, '', {
        color: '#fff3cf',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        stroke: '#1a2436',
        strokeThickness: 5,
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(34)
      .setAlpha(0);

    options.scene.time.delayedCall(700, () => this.#play('landing'));
  }

  static preload(scene: Phaser.Scene): void {
    GardenPropSystem.preload(scene);
    GardenNpcSystem.preload(scene);
    GardenDialoguePanel.preload(scene);
    scene.load.image('garden-golden-seed', seedIconUrl);
    scene.load.image('garden-handprint', handprintUrl);
  }

  /** The level ends at the gate, and the gate only opens once the hounds are gone (§12). */
  get canFinish(): boolean {
    return this.#done.has('hounds-cleared');
  }

  get dialogueBusy(): boolean {
    return this.#dialogue.busy;
  }

  /**
   * Read-only view of the script for the level's end-to-end test (tests/e2e/garden-first-dawn).
   * Level 1 is authored content whose beats are invisible to the DOM, so its regression test needs
   * some way to see them; this exposes state only and can never move the script forward.
   */
  debugState(): {
    activeCat: string;
    activeX: number;
    beats: readonly string[];
    canFinish: boolean;
    houndsAwake: boolean;
    houndsDown: number;
    sundialHalves: number;
    sundialReady: boolean;
    zone: string;
  } {
    return {
      activeCat: this.#gameplay.getSnapshot().activeCat,
      activeX: Math.round(this.#actors[this.#gameplay.getSnapshot().activeCat].x),
      beats: [...this.#done],
      canFinish: this.canFinish,
      houndsAwake: HOUND_IDS.every((id) => !this.#enemies.isDormant(id)),
      houndsDown: this.#houndsDown(),
      sundialHalves: this.#props.sundialHalves,
      sundialReady: this.#props.sundialReady,
      zone: this.#zoneId,
    };
  }

  dashTargets(): readonly { id: string; x: number; y: number }[] {
    return this.#props.dashTargets();
  }

  triggerDashTarget(propId: string): void {
    const reaction = this.#props.triggerDashTarget(propId);
    if (!reaction) return;
    this.#dialogue.say([{ speaker: 'Голос сна', text: reaction.line }]);
    this.#onTutorialStep?.(4);
  }

  /** Called when Лумус uses Оглушающий крик, so the garden bells can answer it (§12). */
  onShout(x: number, y: number): void {
    const reaction = this.#props.shoutAt(x, y);
    if (!reaction) return;
    this.#dialogue.say([{ speaker: 'Голос сна', text: reaction.line }]);
    this.#onTutorialStep?.(3);
  }

  interact(active: Phaser.Physics.Arcade.Sprite, catId: CatId): void {
    if (this.#dialogue.advance()) return;
    const phase = this.#gameplay.getSnapshot().phase;

    const npcLines = this.#npcs.talk(active.x, active.y, phase);
    if (npcLines) {
      this.#dialogue.say(npcLines);
      return;
    }

    const reaction = this.#props.interact(active, catId, phase);
    if (!reaction) return;
    // What a cat notices (a statue, the gate) is said by that cat; what a mechanism does is
    // narrated by the dream itself.
    const observation = reaction.role === 'statue' || reaction.role === 'gate';
    this.#dialogue.say([
      observation
        ? {
            speaker: catId === 'luma' ? 'Лумус' : 'Нокс',
            text: reaction.line,
            emotion: reaction.role === 'gate' ? 'resolve' : 'worry',
          }
        : { speaker: 'Голос сна', text: reaction.line },
    ]);
  }

  applyPhase(phase: Phase): void {
    this.#npcs.applyPhase(phase);
    this.#night.setActive(phase === 'night');
  }

  setNightBrightness(nightBrightness: number): void {
    this.#night.setBrightness(nightBrightness);
  }

  update(deltaMs: number): void {
    const snapshot = this.#gameplay.getSnapshot();
    const catId = snapshot.activeCat;
    const active = this.#actors[catId];
    this.#props.update(active, catId, deltaMs);
    this.#npcs.update(active.x, active.y, snapshot.phase);
    this.#night.update(this.#actors, catId, this.#enemies.targets());
    this.#updateZone(active.x);
    this.#advanceScript(active);
  }

  destroy(): void {
    this.#scenery.destroy();
    this.#props.destroy();
    this.#npcs.destroy();
    this.#night.destroy();
    this.#dialogue.destroy();
    this.#zoneBanner.destroy();
    this.#cracks?.destroy();
    this.#seed?.destroy();
    this.#handprint?.destroy();
  }

  #advanceScript(active: Phaser.Physics.Arcade.Sprite): void {
    if (!this.#done.has('frozen-morning') && active.x > 620) this.#play('frozen-morning');

    if (!this.#done.has('gardener-met') && this.#npcs.hasSpoken('gardener', 'day')) {
      this.#play('gardener-met');
      this.#onTutorialStep?.(5);
    }

    if (!this.#done.has('nightfall') && this.#props.sundialReady) {
      this.#play('nightfall');
      this.#gameplay.setPhase('night');
      // "днём главным бойцом является Лумус, ночью — Нокс" (§12): the level hands control over
      // itself at each turn of the dream's time, so the change of rules is never missed.
      this.#onHandOver?.('nox');
      if (!this.#reducedMotion) this.#scene.cameras.main.flash(420, 26, 22, 60);
    }

    if (
      this.#done.has('nightfall') &&
      !this.#done.has('warning') &&
      (this.#npcs.hasSpoken('little-one-night-path', 'night') || active.x > 4640)
    ) {
      this.#play('warning');
    }

    if (this.#done.has('warning') && !this.#done.has('quake')) {
      this.#play('quake');
      this.#breakTheSky();
      this.#enemies.release(HOUND_IDS);
    }

    if (this.#done.has('quake') && !this.#done.has('day-returns') && this.#houndsDown() >= 2) {
      this.#play('day-returns');
      this.#gameplay.setPhase('day');
      this.#onHandOver?.('luma');
      if (!this.#reducedMotion) this.#scene.cameras.main.flash(360, 255, 240, 190);
    }

    if (this.#done.has('quake') && !this.#done.has('hounds-cleared') && this.#houndsDown() === 4) {
      this.#play('hounds-cleared');
      this.#props.openGate();
      this.#dropSeed();
    }

    if (this.#done.has('hounds-cleared') && !this.#done.has('gate-open') && active.x > 4980) {
      this.#play('gate-open');
      this.#revealHandprint();
    }
  }

  #houndsDown(): number {
    return HOUND_IDS.filter((id) => this.#enemies.isDefeated(id)).length;
  }

  #play(id: BeatId): void {
    if (this.#done.has(id)) return;
    this.#done.add(id);
    this.#dialogue.say(beatLines(id));
  }

  #updateZone(x: number): void {
    const zone = GARDEN_ZONES.find((candidate) => x >= candidate.xStart && x < candidate.xEnd);
    if (!zone || zone.id === this.#zoneId) return;
    this.#zoneId = zone.id;
    this.#zoneBanner.setText(`${zone.title} · ${zone.landmark}`).setAlpha(1);
    this.#scene.tweens.add({
      targets: this.#zoneBanner,
      alpha: 0,
      delay: this.#reducedMotion ? 1600 : 2200,
      duration: this.#reducedMotion ? 1 : 700,
    });
  }

  // «На несколько мгновений в небе проступают трещины, похожие на разбитое стекло лабораторной
  // сферы» — the same image the prologue's collapse panel uses.
  #breakTheSky(): void {
    const cracks = this.#scene.add.graphics().setScrollFactor(0).setDepth(23);
    cracks.lineStyle(3, 0xe6f0ff, 0.85);
    for (let index = 0; index < 7; index += 1) {
      const originX = 120 + index * 165;
      cracks.beginPath();
      cracks.moveTo(originX, 0);
      cracks.lineTo(originX + 34, 90 + (index % 3) * 30);
      cracks.lineTo(originX - 22, 190 + (index % 2) * 40);
      cracks.lineTo(originX + 46, 280 + (index % 4) * 26);
      cracks.strokePath();
    }
    this.#cracks = cracks;
    if (!this.#reducedMotion) this.#scene.cameras.main.shake(900, 0.009);
    this.#scene.tweens.add({
      targets: cracks,
      alpha: 0,
      duration: this.#reducedMotion ? 1 : 1800,
      onComplete: () => {
        cracks.destroy();
        this.#cracks = null;
      },
    });
  }

  // «Перед расставанием он отдаёт котам маленькое семя, сохранившее свет и тень одновременно».
  #dropSeed(): void {
    if (this.#seed) return;
    this.#seed = this.#scene.add
      .image(5010, 545, 'garden-golden-seed')
      .setDisplaySize(56, 56)
      .setDepth(7);
    if (this.#reducedMotion) return;
    this.#scene.tweens.add({
      targets: this.#seed,
      y: this.#seed.y - 12,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  // «За вратами виден первый настоящий след Элиаса — отпечаток ладони на стене сна».
  #revealHandprint(): void {
    if (this.#handprint) return;
    const handprint = this.#scene.add.image(5160, 520, 'garden-handprint').setAlpha(0).setDepth(3);
    handprint.setDisplaySize(240, 240 * (handprint.height / handprint.width));
    this.#handprint = handprint;
    this.#scene.tweens.add({
      targets: handprint,
      alpha: 0.92,
      duration: this.#reducedMotion ? 1 : 900,
    });
  }
}
