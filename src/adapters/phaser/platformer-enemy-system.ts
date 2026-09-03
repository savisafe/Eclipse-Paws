import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { LevelPoint } from '@content/index';
import { enemyAiProfileForLevel, type EnemyAiProfile, type EnemyConfig } from '@core/index';
import type { EffectTarget } from './platformer-effects';
import { GARDEN_ENEMY_FRAMES } from './garden-enemy-atlas';
import { STAGE4_ENEMY_FRAMES } from './stage4-enemy-atlas';
import { STAGE5_ENEMY_FRAMES } from './stage5-enemy-atlas';

interface EnemyFrames {
  attack: number;
  idle: number;
  move: number;
  texture: string;
}

interface EnemyView extends EffectTarget {
  config: EnemyConfig;
  cooldownMs: number;
  direction: number;
  frames: EnemyFrames;
  healthBack: Phaser.GameObjects.Rectangle;
  healthFill: Phaser.GameObjects.Rectangle;
  jumpCooldownMs: number;
  lastX: number;
  spawn: LevelPoint & { configId: string };
  stuckMs: number;
  telegraphMs: number;
}

function arcadeBody(sprite: Phaser.Physics.Arcade.Sprite): Phaser.Physics.Arcade.Body {
  return sprite.body as Phaser.Physics.Arcade.Body;
}

function anchorToNearestPlatform(
  sprite: Phaser.Physics.Arcade.Sprite,
  platforms: Phaser.Physics.Arcade.StaticGroup,
  requested: LevelPoint & { configId: string },
): LevelPoint & { configId: string } {
  const body = arcadeBody(sprite);
  const candidates = platforms
    .getChildren()
    .map((child) =>
      (
        child as Phaser.GameObjects.GameObject & { getBounds: () => Phaser.Geom.Rectangle }
      ).getBounds(),
    )
    .filter((bounds) => bounds.top >= requested.y - 120)
    .sort((first, second) => {
      const firstDx =
        requested.x < first.left
          ? first.left - requested.x
          : requested.x > first.right
            ? requested.x - first.right
            : 0;
      const secondDx =
        requested.x < second.left
          ? second.left - requested.x
          : requested.x > second.right
            ? requested.x - second.right
            : 0;
      return (
        firstDx +
        Math.abs(first.top - requested.y) * 0.18 -
        (secondDx + Math.abs(second.top - requested.y) * 0.18)
      );
    });
  const platform = candidates[0];
  if (!platform) return requested;
  const x = Phaser.Math.Clamp(
    requested.x,
    platform.left + body.halfWidth + 14,
    platform.right - body.halfWidth - 14,
  );
  sprite.setPosition(x, requested.y);
  body.updateFromGameObject();
  sprite.y += platform.top - body.bottom - 1;
  body.updateFromGameObject();
  return { ...requested, x: sprite.x, y: sprite.y };
}

export class PlatformerEnemySystem {
  readonly #ai: EnemyAiProfile;
  readonly #collectedDrops = new Set<string>();
  readonly #drops = new Map<string, Phaser.GameObjects.Container>();
  readonly #enemies = new Map<string, EnemyView>();
  readonly #gameplay: GameplayController;
  readonly #platforms: Phaser.Physics.Arcade.StaticGroup;
  readonly #scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    gameplay: GameplayController,
    platforms: Phaser.Physics.Arcade.StaticGroup,
    spawns: readonly (LevelPoint & { configId: string })[],
    enemyTypes: Readonly<Record<string, EnemyConfig>>,
    levelIndex: number,
  ) {
    this.#scene = scene;
    this.#gameplay = gameplay;
    this.#platforms = platforms;
    this.#ai = enemyAiProfileForLevel(levelIndex);
    spawns.forEach((spawn, spawnIndex) => {
      const config = enemyTypes[spawn.configId];
      if (!config) throw new Error(`Unknown platformer monster: ${spawn.configId}`);
      const campaignFrames =
        STAGE4_ENEMY_FRAMES[spawn.configId] ?? STAGE5_ENEMY_FRAMES[spawn.configId];
      const frames: EnemyFrames | undefined = campaignFrames ?? GARDEN_ENEMY_FRAMES[spawn.configId];
      if (!frames) throw new Error(`Missing atlas frames for monster: ${spawn.configId}`);
      const sprite = scene.physics.add
        .sprite(spawn.x, spawn.y, frames.texture, frames.idle)
        .setDepth(5)
        .setCollideWorldBounds(false);
      const isBoss = [
        'great-mushroom',
        'archivist-echo',
        'fortress-golem',
        'dawn-devourer',
      ].includes(spawn.configId);
      const isCampaign = Boolean(campaignFrames);
      const scale = isBoss
        ? 0.82
        : isCampaign
          ? 0.62
          : spawn.configId === 'twilight-golem'
            ? 0.78
            : spawn.configId === 'spore-beast'
              ? 0.54
              : spawn.configId === 'light-wisp'
                ? 0.48
                : 0.56;
      sprite
        .setScale(scale)
        .setSize(isBoss ? 142 : 118, isBoss ? 148 : 112)
        .setOffset(isBoss ? 57 : 69, isBoss ? 80 : 104);
      if (config.movement === 'flying') arcadeBody(sprite).setAllowGravity(false);
      else scene.physics.add.collider(sprite, platforms);
      const safeSpawn =
        config.movement === 'ground' ? anchorToNearestPlatform(sprite, platforms, spawn) : spawn;

      const barWidth = isBoss ? 104 : 68;
      const healthBack = scene.add
        .rectangle(spawn.x, spawn.y - 90, barWidth + 6, 12, 0x130f25, 0.92)
        .setStrokeStyle(2, isBoss ? 0xffcc65 : 0xdad6ed, 0.9)
        .setDepth(18);
      const healthFill = scene.add
        .rectangle(spawn.x - barWidth / 2, spawn.y - 90, barWidth, 6, 0xe64d6b, 1)
        .setOrigin(0, 0.5)
        .setDepth(19);

      this.#enemies.set(spawn.id, {
        config,
        cooldownMs: 700,
        direction: spawnIndex % 2 === 0 ? -1 : 1,
        frames,
        healthBack,
        healthFill,
        id: spawn.id,
        jumpCooldownMs: 350 + spawnIndex * 90,
        lastX: safeSpawn.x,
        spawn: safeSpawn,
        sprite,
        stuckMs: 0,
        telegraphMs: 0,
      });
    });
  }

  targets(): EffectTarget[] {
    return [...this.#enemies.values()].map(({ id, sprite }) => ({ id, sprite }));
  }

  update(targetCat: Phaser.Physics.Arcade.Sprite, deltaMs: number): void {
    const states = new Map(this.#gameplay.getSnapshot().enemies.map((enemy) => [enemy.id, enemy]));
    this.#enemies.forEach((enemy) => {
      const state = states.get(enemy.id);
      if (!state || state.health <= 0) {
        this.#updateLootDrop(enemy, targetCat);
        enemy.sprite.disableBody(true, true);
        enemy.healthBack.setVisible(false);
        enemy.healthFill.setVisible(false);
        return;
      }
      if (!enemy.sprite.active)
        enemy.sprite.enableBody(true, enemy.spawn.x, enemy.spawn.y, true, true);
      this.#updateHealthBar(enemy, state.health);
      if (enemy.sprite.y > 790) this.#recoverFallenEnemy(enemy);
      enemy.cooldownMs = Math.max(0, enemy.cooldownMs - deltaMs);
      enemy.jumpCooldownMs = Math.max(0, enemy.jumpCooldownMs - deltaMs);
      const targetBody = arcadeBody(targetCat);
      const predictedX = targetCat.x + targetBody.velocity.x * this.#ai.predictionSeconds;
      const dx = predictedX - enemy.sprite.x;
      const distance = Phaser.Math.Distance.Between(
        enemy.sprite.x,
        enemy.sprite.y,
        targetCat.x,
        targetCat.y,
      );

      if (enemy.telegraphMs > 0) {
        enemy.sprite.setVelocity(0, 0).setTint(0xff5578);
        enemy.telegraphMs -= deltaMs;
        if (enemy.telegraphMs <= 0) this.#resolveStrike(enemy, distance);
      } else if (distance < this.#ai.attackRange && enemy.cooldownMs === 0) {
        enemy.telegraphMs = enemy.config.telegraphMs * this.#ai.telegraphMultiplier;
        enemy.sprite.clearTint().anims.play(`${enemy.config.id}-attack`, true);
      } else if (enemy.config.movement === 'flying') {
        this.#playMove(enemy);
        if (distance <= this.#ai.aggressionRange) {
          this.#scene.physics.moveTo(
            enemy.sprite,
            predictedX,
            targetCat.y + targetBody.velocity.y * this.#ai.predictionSeconds,
            enemy.config.speed,
          );
        } else {
          this.#scene.physics.moveTo(
            enemy.sprite,
            enemy.spawn.x,
            enemy.spawn.y,
            enemy.config.speed * 0.55,
          );
        }
        enemy.sprite.setFlipX(dx < 0);
      } else {
        this.#walkPlatform(enemy, dx, targetCat.y, distance <= this.#ai.aggressionRange, deltaMs);
      }
    });
  }

  reset(): void {
    this.#drops.forEach((drop) => drop.destroy());
    this.#drops.clear();
    this.#collectedDrops.clear();
    this.#enemies.forEach((enemy) => {
      enemy.cooldownMs = 800;
      enemy.telegraphMs = 0;
      enemy.direction = 1;
      enemy.jumpCooldownMs = 500;
      enemy.lastX = enemy.spawn.x;
      enemy.stuckMs = 0;
      enemy.sprite.enableBody(true, enemy.spawn.x, enemy.spawn.y, true, true).clearTint();
      enemy.sprite.anims.stop();
      enemy.sprite.setFrame(enemy.frames.idle);
      enemy.healthBack.setVisible(true);
      enemy.healthFill.setVisible(true).setScale(1, 1);
    });
  }

  stop(): void {
    this.#enemies.forEach((enemy) => enemy.sprite.setVelocity(0, 0));
  }

  isDefeated(enemyId: string): boolean {
    return (
      (this.#gameplay.getSnapshot().enemies.find((enemy) => enemy.id === enemyId)?.health ?? 0) <= 0
    );
  }

  #walkPlatform(
    enemy: EnemyView,
    dx: number,
    targetY: number,
    aggressive: boolean,
    deltaMs: number,
  ): void {
    const body = arcadeBody(enemy.sprite);
    if (!body.blocked.down && !body.touching.down) {
      this.#playMove(enemy);
      return;
    }

    const moved = Math.abs(enemy.sprite.x - enemy.lastX);
    enemy.lastX = enemy.sprite.x;
    enemy.stuckMs = moved < 0.45 && Math.abs(body.velocity.x) > 8 ? enemy.stuckMs + deltaMs : 0;
    if (enemy.stuckMs > 680) {
      enemy.direction *= -1;
      this.#jump(enemy, enemy.direction, 0.78);
      enemy.stuckMs = 0;
      return;
    }

    const verticalRise = enemy.sprite.y - targetY;
    if (
      aggressive &&
      verticalRise > 45 &&
      verticalRise < 235 &&
      Math.abs(dx) < this.#ai.jumpRangeX &&
      enemy.jumpCooldownMs === 0
    ) {
      this.#jump(enemy, Math.sign(dx || enemy.direction));
      return;
    }

    const patrolRadius = aggressive ? 310 : 125;
    const desiredDirection = aggressive ? Math.sign(dx || enemy.direction) : enemy.direction;
    if (Math.abs(enemy.sprite.x - enemy.spawn.x) > patrolRadius)
      enemy.direction = enemy.sprite.x > enemy.spawn.x ? -1 : 1;
    else enemy.direction = desiredDirection;
    const probeX = enemy.sprite.x + enemy.direction * (body.halfWidth + 24);
    const footY = body.bottom + 8;
    if (!this.#hasPlatformAt(probeX, footY)) {
      const targetBelow = targetY > enemy.sprite.y + 60;
      const shouldGapJump =
        aggressive &&
        this.#ai.canGapJump &&
        !targetBelow &&
        Math.abs(dx) < this.#ai.jumpRangeX &&
        enemy.jumpCooldownMs === 0;
      if (shouldGapJump) {
        this.#jump(enemy, enemy.direction, 0.74);
        return;
      }
      if (!(aggressive && this.#ai.canDropFromLedges && targetBelow)) enemy.direction *= -1;
    }
    this.#playMove(enemy);
    enemy.sprite.setVelocityX(enemy.direction * enemy.config.speed).setFlipX(enemy.direction < 0);
  }

  #jump(enemy: EnemyView, direction: number, heightMultiplier = 1): void {
    enemy.direction = direction < 0 ? -1 : 1;
    enemy.jumpCooldownMs = this.#ai.jumpCooldownMs;
    enemy.sprite
      .setVelocity(
        enemy.direction * Math.max(145, enemy.config.speed * 1.75),
        -this.#ai.jumpVelocity * heightMultiplier,
      )
      .setFlipX(enemy.direction < 0);
    this.#playMove(enemy);
  }

  #hasPlatformAt(x: number, footY: number): boolean {
    return this.#platforms.getChildren().some((child) => {
      const bounds = (
        child as Phaser.GameObjects.GameObject & { getBounds: () => Phaser.Geom.Rectangle }
      ).getBounds();
      return (
        x > bounds.left + 6 &&
        x < bounds.right - 6 &&
        bounds.top >= footY - 18 &&
        bounds.top <= footY + 34
      );
    });
  }

  #recoverFallenEnemy(enemy: EnemyView): void {
    enemy.sprite.setPosition(enemy.spawn.x, enemy.spawn.y).setVelocity(0, 0);
    enemy.direction *= -1;
    enemy.jumpCooldownMs = 700;
    enemy.stuckMs = 0;
  }

  #updateLootDrop(enemy: EnemyView, targetCat: Phaser.Physics.Arcade.Sprite): void {
    if (this.#collectedDrops.has(enemy.id)) return;
    let drop = this.#drops.get(enemy.id);
    if (!drop) {
      const aura = this.#scene.add.circle(0, 0, 22, 0x8a65ef, 0.2).setStrokeStyle(2, 0xf3d884, 0.8);
      const diamond = this.#scene.add
        .polygon(0, 0, [0, -15, 11, 0, 0, 15, -11, 0], 0x80e8ff, 1)
        .setStrokeStyle(2, 0xffffff, 0.9);
      const spark = this.#scene.add.star(0, 0, 6, 5, 12, 0xffdc76, 0.85);
      drop = this.#scene.add
        .container(enemy.sprite.x, enemy.sprite.y - 10, [aura, diamond, spark])
        .setDepth(17);
      this.#scene.tweens.add({
        targets: drop,
        y: drop.y - 12,
        duration: 720,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
      this.#scene.tweens.add({ targets: diamond, angle: 360, duration: 1900, repeat: -1 });
      this.#drops.set(enemy.id, drop);
    }
    if (Phaser.Math.Distance.Between(targetCat.x, targetCat.y, drop.x, drop.y) > 74) return;
    this.#gameplay.collectLoot(enemy.id);
    this.#collectedDrops.add(enemy.id);
    this.#scene.tweens.killTweensOf(drop);
    drop.destroy();
    this.#drops.delete(enemy.id);
  }

  #updateHealthBar(enemy: EnemyView, health: number): void {
    const isBoss = enemy.healthFill.width > 80;
    const y = enemy.sprite.y - (isBoss ? 112 : 88);
    enemy.healthBack.setPosition(enemy.sprite.x, y).setVisible(true);
    enemy.healthFill
      .setPosition(enemy.sprite.x - enemy.healthFill.width / 2, y)
      .setScale(Phaser.Math.Clamp(health / enemy.config.health, 0, 1), 1)
      .setVisible(true)
      .setFillStyle(
        health / enemy.config.health > 0.5
          ? 0x6fe08c
          : health / enemy.config.health > 0.25
            ? 0xf2b84b
            : 0xe64d6b,
      );
  }

  #resolveStrike(enemy: EnemyView, distance: number): void {
    enemy.sprite.clearTint();
    enemy.sprite.setFrame(enemy.frames.idle);
    enemy.cooldownMs = this.#ai.strikeCooldownMs;
    if (distance < this.#ai.attackRange + 24) this.#gameplay.takeDamage(enemy.config.contactDamage);
  }

  #playMove(enemy: EnemyView): void {
    enemy.sprite.anims.play(`${enemy.config.id}-move`, true);
  }
}
