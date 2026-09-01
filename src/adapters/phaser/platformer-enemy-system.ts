import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import { PROTOTYPE_MONSTERS, PROTOTYPE_SPAWNS, type ArenaPoint } from '@content/index';
import type { EnemyConfig } from '@core/index';
import type { EffectTarget } from './platformer-effects';
import { ATLAS_TEXTURE_KEY, MONSTER_FRAMES } from './sprite-atlas';

interface EnemyView extends EffectTarget {
  config: EnemyConfig;
  cooldownMs: number;
  frames: { attack: number; idle: number; move: number };
  spawn: ArenaPoint;
  telegraphMs: number;
}

function arcadeBody(sprite: Phaser.Physics.Arcade.Sprite): Phaser.Physics.Arcade.Body {
  return sprite.body as Phaser.Physics.Arcade.Body;
}

export class PlatformerEnemySystem {
  readonly #enemies = new Map<string, EnemyView>();
  readonly #gameplay: GameplayController;
  readonly #scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    gameplay: GameplayController,
    platforms: Phaser.Physics.Arcade.StaticGroup,
  ) {
    this.#scene = scene;
    this.#gameplay = gameplay;
    PROTOTYPE_SPAWNS.enemies.forEach((spawn) => {
      const config = PROTOTYPE_MONSTERS[spawn.configId];
      if (!config) throw new Error(`Unknown platformer monster: ${spawn.configId}`);
      const frames = MONSTER_FRAMES[spawn.configId];
      if (!frames) throw new Error(`Missing atlas frames for monster: ${spawn.configId}`);
      const sprite = scene.physics.add
        .sprite(spawn.x, spawn.y, ATLAS_TEXTURE_KEY, frames.idle)
        .setDepth(5)
        .setCollideWorldBounds(false);
      const scale =
        spawn.configId === 'spore-beast' ? 0.54 : spawn.configId === 'light-wisp' ? 0.48 : 0.56;
      sprite
        .setScale(scale)
        .setSize(spawn.configId === 'spore-beast' ? 170 : 155, 120)
        .setOffset(50, 112);
      if (config.movement === 'flying') arcadeBody(sprite).setAllowGravity(false);
      else scene.physics.add.collider(sprite, platforms);
      this.#enemies.set(spawn.id, {
        config,
        cooldownMs: 700,
        frames,
        id: spawn.id,
        spawn,
        sprite,
        telegraphMs: 0,
      });
    });
  }

  targets(): EffectTarget[] {
    return [...this.#enemies.values()].map(({ id, sprite }) => ({ id, sprite }));
  }

  update(weakCat: Phaser.Physics.Arcade.Sprite, deltaMs: number): void {
    const states = new Map(this.#gameplay.getSnapshot().enemies.map((enemy) => [enemy.id, enemy]));
    this.#enemies.forEach((enemy) => {
      const state = states.get(enemy.id);
      if (!state || state.health <= 0) {
        enemy.sprite.disableBody(true, true);
        return;
      }
      if (!enemy.sprite.active)
        enemy.sprite.enableBody(true, enemy.spawn.x, enemy.spawn.y, true, true);
      enemy.cooldownMs = Math.max(0, enemy.cooldownMs - deltaMs);
      const dx = weakCat.x - enemy.sprite.x;
      const distance = Phaser.Math.Distance.Between(
        enemy.sprite.x,
        enemy.sprite.y,
        weakCat.x,
        weakCat.y,
      );

      if (enemy.telegraphMs > 0) {
        enemy.sprite.setVelocity(0, 0).setTint(0xff5578);
        enemy.telegraphMs -= deltaMs;
        if (enemy.telegraphMs <= 0) this.#resolveStrike(enemy, distance);
      } else if (distance < 92 && enemy.cooldownMs === 0) {
        enemy.telegraphMs = enemy.config.telegraphMs;
        enemy.sprite.anims.stop();
        enemy.sprite.setFrame(enemy.frames.attack);
      } else if (enemy.config.movement === 'flying') {
        enemy.sprite.anims.play(`${enemy.config.id}-move`, true);
        this.#scene.physics.moveToObject(enemy.sprite, weakCat, enemy.config.speed);
      } else {
        enemy.sprite.anims.play(`${enemy.config.id}-move`, true);
        enemy.sprite.setVelocityX(Math.sign(dx) * enemy.config.speed).setFlipX(dx < 0);
      }
    });
  }

  reset(): void {
    this.#enemies.forEach((enemy) => {
      enemy.cooldownMs = 800;
      enemy.telegraphMs = 0;
      enemy.sprite.enableBody(true, enemy.spawn.x, enemy.spawn.y, true, true).clearTint();
      enemy.sprite.anims.stop();
      enemy.sprite.setFrame(enemy.frames.idle);
    });
  }

  stop(): void {
    this.#enemies.forEach((enemy) => enemy.sprite.setVelocity(0, 0));
  }

  #resolveStrike(enemy: EnemyView, distance: number): void {
    enemy.sprite.clearTint();
    enemy.sprite.setFrame(enemy.frames.idle);
    enemy.cooldownMs = 1400;
    if (distance < 118) this.#gameplay.takeDamage(enemy.config.contactDamage);
  }
}
