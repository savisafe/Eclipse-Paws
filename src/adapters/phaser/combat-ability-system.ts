import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { CatId } from '@core/index';
import type { HapticsPort } from '@adapters/haptics/index';
import type { Destroyable } from './destroyable';
import type { PlatformerEnemySystem } from './platformer-enemy-system';
import { playShadowDash, playSpecialAbility, playStunningShout } from './platformer-effects';
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
  }) {
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
    if (!dashed) return;
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
  }

  // Затмение (§12) is a twilight window, not a damage button: it deals nothing, slows the sleep's
  // creatures and shows both phases at once. The damage-dealing wave it used to be contradicted
  // the scenario outright ("не является кнопкой массового уничтожения").
  eclipse(): void {
    if (!this.#gameplay.useEclipse()) return;
    const active = this.#actors[this.#activeCat()];
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
}
