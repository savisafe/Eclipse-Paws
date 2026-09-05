import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { CatId } from '@core/index';
import type { HapticsPort } from '@adapters/haptics/index';
import type { Destroyable } from './destroyable';
import type { PlatformerEnemySystem } from './platformer-enemy-system';
import {
  playShadowBlink,
  playShadowDash,
  playSpecialAbility,
  playStunningShout,
} from './platformer-effects';
import { SfxSynth } from './sfx-synth';
import { setCatPose } from './sprite-atlas';
import { GameObjectPool } from './game-object-pool';

export class CombatAbilitySystem implements Destroyable {
  readonly #actionLockMs: Record<CatId, number>;
  readonly #actors: Record<CatId, Phaser.Physics.Arcade.Sprite>;
  readonly #enemies: PlatformerEnemySystem;
  readonly #facing: Record<CatId, number>;
  readonly #gameplay: GameplayController;
  readonly #haptics: HapticsPort;
  readonly #scene: Phaser.Scene;
  readonly #reducedMotion: boolean;
  // Optional level hooks: §12 gives both level-1 abilities a non-combat use — the shout rings the
  // garden bells, and the dash presses switches that are out of reach.
  readonly #onShout?: (x: number, y: number) => void;
  readonly #dashTargets?: () => readonly { id: string; x: number; y: number }[];
  readonly #onDashTarget?: (targetId: string) => void;
  readonly #solids: Phaser.Physics.Arcade.StaticGroup;
  readonly #sfx = new SfxSynth();
  readonly #waves: GameObjectPool<Phaser.GameObjects.Arc>;

  constructor(options: {
    actionLockMs: Record<CatId, number>;
    actors: Record<CatId, Phaser.Physics.Arcade.Sprite>;
    enemies: PlatformerEnemySystem;
    facing: Record<CatId, number>;
    gameplay: GameplayController;
    reducedMotion: boolean;
    effectsVolume: number;
    haptics: HapticsPort;
    scene: Phaser.Scene;
    onShout?: (x: number, y: number) => void;
    dashTargets?: () => readonly { id: string; x: number; y: number }[];
    onDashTarget?: (targetId: string) => void;
    solids: Phaser.Physics.Arcade.StaticGroup;
  }) {
    this.#solids = options.solids;
    this.#onShout = options.onShout;
    this.#dashTargets = options.dashTargets;
    this.#onDashTarget = options.onDashTarget;
    this.#actionLockMs = options.actionLockMs;
    this.#actors = options.actors;
    this.#enemies = options.enemies;
    this.#facing = options.facing;
    this.#gameplay = options.gameplay;
    this.#haptics = options.haptics;
    this.#reducedMotion = options.reducedMotion;
    this.#scene = options.scene;
    this.#sfx.setVolume(options.effectsVolume / 100);
    this.#waves = new GameObjectPool(3, () =>
      options.scene.add
        .circle(0, 0, 70, 0xf7d27c, 0.45)
        .setStrokeStyle(10, 0x8be9f2, 0.9)
        .setDepth(17),
    );
  }

  // Level-1 pair (§12): Лумус — Оглушающий крик, Нокс — Теневой наскок. The two share a slot but
  // not a shape: the shout is an area control move, the dash is a single-target strike at range.
  primary(): void {
    const catId = this.#activeCat();
    const actor = this.#actors[catId];
    if (catId === 'luma') {
      actor.anims.stop();
      setCatPose(actor, catId, 'attack');
      this.#actionLockMs[catId] = 240;
      playStunningShout(
        this.#scene,
        this.#gameplay,
        actor,
        this.#reducedMotion,
        this.#enemies.targets(),
      );
      this.#sfx.play(660, 160, 'sine');
      void this.#haptics.impact('light');
      this.#onShout?.(actor.x, actor.y);
      return;
    }

    const switchTarget = this.#reachableDashTarget(actor, this.#facing[catId]);
    if (switchTarget) {
      actor.anims.stop();
      setCatPose(actor, catId, 'attack');
      this.#actionLockMs[catId] = 280;
      this.#drawDashStreak(actor, switchTarget.x, switchTarget.y);
      this.#sfx.play(240, 150, 'sawtooth');
      void this.#haptics.impact('light');
      this.#onDashTarget?.(switchTarget.id);
      return;
    }

    const dashed = playShadowDash(
      this.#scene,
      this.#gameplay,
      actor,
      this.#facing[catId],
      this.#enemies.targets(),
      this.#reducedMotion,
    );
    if (!dashed) {
      // Nothing to strike: Нокс still dashes, forward and through, which is the other half of
      // what the ability is for.
      playShadowBlink(
        this.#scene,
        this.#gameplay,
        actor,
        this.#facing[catId],
        this.#solids,
        this.#reducedMotion,
      );
    }
    actor.anims.stop();
    setCatPose(actor, catId, 'attack');
    this.#actionLockMs[catId] = 280;
    this.#sfx.play(190, 130, 'sawtooth');
    void this.#haptics.impact('light');
  }

  special(): void {
    const catId = this.#activeCat();
    const actor = this.#actors[catId];
    const used = playSpecialAbility(
      this.#scene,
      this.#gameplay,
      actor,
      catId,
      this.#facing[catId],
      this.#enemies.targets(),
      this.#reducedMotion,
    );
    if (!used) return;
    actor.anims.stop();
    setCatPose(actor, catId, 'ability');
    this.#actionLockMs[catId] = 430;
    this.#sfx.play(catId === 'luma' ? 880 : 92, 260, catId === 'luma' ? 'square' : 'sawtooth');
    void this.#haptics.impact('medium');
  }

  // Level-3 pair (§12): Световой круг protects and heals, Теневой покров hides both cats.
  support(): void {
    const healthBefore = this.#gameplay.getSnapshot().bondHealth;
    const catId = this.#activeCat();
    if (!this.#gameplay.useSupport()) return;
    const healed = this.#gameplay.getSnapshot().bondHealth > healthBefore;
    const veiled = catId === 'nox';
    const color = healed ? 0x77efad : catId === 'luma' ? 0x7de8ff : 0x9f66ef;
    const ring = this.#scene.add
      .ellipse(0, 0, 240, 150)
      .setStrokeStyle(7, color, 0.85)
      .setDepth(16);
    const active = this.#actors[this.#activeCat()];
    active.anims.stop();
    setCatPose(active, catId, 'ability');
    this.#actionLockMs[catId] = 520;
    ring.setPosition(active.x, active.y);
    const icon = this.#scene.add
      .text(
        active.x,
        active.y - 68,
        healed ? '+1 ♥' : veiled ? 'ТЕНЕВОЙ ПОКРОВ' : 'СВЕТОВОЙ КРУГ',
        {
          color: healed ? '#baffcf' : '#d7eeff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: healed ? '24px' : '16px',
          fontStyle: 'bold',
          stroke: '#142039',
          strokeThickness: 5,
        },
      )
      .setOrigin(0.5)
      .setDepth(18);
    this.#scene.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 1.5,
      duration: 520,
      onComplete: () => ring.destroy(),
    });
    this.#scene.tweens.add({
      targets: icon,
      y: icon.y - 35,
      alpha: 0,
      duration: 720,
      onComplete: () => icon.destroy(),
    });
    this.#sfx.play(420, 320, 'sine');
    void this.#haptics.impact('light');
  }

  // Затмение (§12) is a twilight window, not a damage button: it deals nothing, slows the sleep's
  // creatures and shows both phases at once. The damage-dealing wave it used to be contradicted
  // the scenario outright ("не является кнопкой массового уничтожения").
  eclipse(): void {
    if (!this.#gameplay.useEclipse()) return;
    const catId = this.#activeCat();
    const active = this.#actors[catId];
    active.anims.stop();
    setCatPose(active, catId, 'ability');
    this.#actionLockMs[catId] = 650;
    const wave = this.#waves.acquire();
    if (!wave) return;
    wave.setPosition(active.x, active.y).setScale(1).setAlpha(0.45);
    this.#scene.tweens.add({
      targets: wave,
      scale: 7,
      alpha: 0,
      duration: this.#reducedMotion ? 1 : 900,
      onComplete: () => this.#waves.release(wave),
    });
    this.#sfx.play(110, 650, 'sine');
    void this.#haptics.impact('medium');
  }

  destroy(): void {
    this.#sfx.close();
    this.#waves.destroy();
  }

  #activeCat(): CatId {
    return this.#gameplay.getSnapshot().activeCat;
  }

  #reachableDashTarget(
    actor: Phaser.Physics.Arcade.Sprite,
    facing: number,
  ): { id: string; x: number; y: number } | null {
    const candidates = this.#dashTargets?.() ?? [];
    return (
      candidates.find((target) => {
        const dx = target.x - actor.x;
        return (
          Math.abs(dx) <= 340 &&
          Math.sign(dx || facing) === facing &&
          Math.abs(target.y - actor.y) < 220
        );
      }) ?? null
    );
  }

  #drawDashStreak(actor: Phaser.Physics.Arcade.Sprite, x: number, y: number): void {
    const streak = this.#scene.add
      .line(0, 0, actor.x, actor.y, x, y, 0x9b67ef, 0.9)
      .setOrigin(0, 0)
      .setLineWidth(9)
      .setDepth(13);
    this.#scene.tweens.add({
      targets: streak,
      alpha: 0,
      duration: this.#reducedMotion ? 1 : 260,
      onComplete: () => streak.destroy(),
    });
  }
}
