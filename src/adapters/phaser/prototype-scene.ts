import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { GameInputState } from '@adapters/input/index';
import { PROTOTYPE_SPAWNS } from '@content/index';
import { dominantCatForPhase, type CatId, type Phase } from '@core/index';
import {
  drawArena,
  drawCheckpoints,
  PLATFORMER_WORLD,
  preloadEnvironment,
} from './arena-decoration';
import { createArenaTextures } from './arena-textures';
import { CompanionTether } from './companion-tether';
import { PlatformerEnemySystem } from './platformer-enemy-system';
import { PlatformerHazardSystem } from './platformer-hazard-system';
import { playPrimaryAttack, playSpecialAbility } from './platformer-effects';
import { ATLAS_TEXTURE_KEY, preloadSpriteAtlas, setCatPose } from './sprite-atlas';

const FIXED_STEP_MS = 1000 / 60;
const PLAYER_SPEED = 255;
const JUMP_SPEED = 560;

export interface PrototypeSceneOptions {
  gameplay: GameplayController;
  inputState: GameInputState;
  onPauseRequested: () => void;
  onReady: () => void;
}

function arcadeBody(sprite: Phaser.Physics.Arcade.Sprite): Phaser.Physics.Arcade.Body {
  return sprite.body as Phaser.Physics.Arcade.Body;
}

export class PrototypeScene extends Phaser.Scene {
  readonly #actionLockMs: Record<CatId, number> = { luma: 0, nox: 0 };
  readonly #facing: Record<CatId, number> = { luma: 1, nox: 1 };
  readonly #gameplay: GameplayController;
  readonly #inputState: GameInputState;
  readonly #onPauseRequested: () => void;
  readonly #onReady: () => void;
  #accumulatorMs = 0;
  #actors!: Record<CatId, Phaser.Physics.Arcade.Sprite>;
  #enemySystem!: PlatformerEnemySystem;
  #lastPhase: Phase = 'day';
  #lastRestartCount = 0;
  #coyoteMs = 0;
  #companionTether!: CompanionTether;
  #jumpBufferMs = 0;
  #hazardSystem!: PlatformerHazardSystem;
  #phaseOverlay!: Phaser.GameObjects.Rectangle;
  #platforms!: Phaser.Physics.Arcade.StaticGroup;
  #selection!: Phaser.GameObjects.Ellipse;

  constructor(options: PrototypeSceneOptions) {
    super('prototype-platformer');
    this.#gameplay = options.gameplay;
    this.#inputState = options.inputState;
    this.#onPauseRequested = options.onPauseRequested;
    this.#onReady = options.onReady;
  }

  preload(): void {
    preloadSpriteAtlas(this);
    preloadEnvironment(this);
  }

  create(): void {
    createArenaTextures(this);
    const world = drawArena(this);
    this.#phaseOverlay = world.phaseOverlay;
    this.#platforms = world.platforms;

    this.physics.world.setBounds(0, 0, PLATFORMER_WORLD.width, PLATFORMER_WORLD.height + 180);
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.cameras.main.setBounds(0, 0, PLATFORMER_WORLD.width, PLATFORMER_WORLD.height);

    this.#actors = { luma: this.#createCat('luma'), nox: this.#createCat('nox') };
    this.#companionTether = new CompanionTether(this, this.#actors);
    this.physics.add.collider(Object.values(this.#actors), this.#platforms);
    this.#selection = this.add.ellipse(0, 0, 94, 24).setStrokeStyle(5, 0xffda72, 0.92).setDepth(2);
    drawCheckpoints(this);
    this.#enemySystem = new PlatformerEnemySystem(this, this.#gameplay, this.#platforms);
    this.#hazardSystem = new PlatformerHazardSystem(this, this.#gameplay, this.#actors);
    this.#applyPhase('day');
    this.cameras.main.startFollow(this.#actors.luma, true, 0.09, 0.09);
    this.cameras.main.setDeadzone(260, 130);

    this.input.on('pointerdown', this.#handlePointerDown, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.#shutdown, this);
    this.#onReady();
  }

  override update(_time: number, deltaMs: number): void {
    if (this.#inputState.consume('pause')) this.#onPauseRequested();
    if (this.#gameplay.getSnapshot().paused) {
      this.#stopAllActors();
      return;
    }

    this.#accumulatorMs += Math.min(deltaMs, 250);
    while (this.#accumulatorMs >= FIXED_STEP_MS) {
      this.#fixedUpdate(FIXED_STEP_MS);
      this.#accumulatorMs -= FIXED_STEP_MS;
    }
    this.#updateSelection();
  }

  #fixedUpdate(deltaMs: number): void {
    this.#gameplay.tick(deltaMs);
    if (this.#inputState.consume('switch-cat')) this.#switchCat();
    if (this.#inputState.consume('primary-ability')) this.#attack();
    if (this.#inputState.consume('support-ability')) this.#specialAbility();
    if (this.#inputState.consume('restart-checkpoint')) this.#gameplay.restartCheckpoint();
    this.#moveCats(deltaMs);
    this.#enemySystem.update(this.#actors[this.#gameplay.getWeakCat()], deltaMs);
    this.#hazardSystem.update(deltaMs);
    this.#checkCheckpointAndFalls();

    const snapshot = this.#gameplay.getSnapshot();
    if (snapshot.phase !== this.#lastPhase) this.#applyPhase(snapshot.phase);
    if (snapshot.checkpointRestartCount !== this.#lastRestartCount) this.#resetWorld();
  }

  #createCat(catId: CatId): Phaser.Physics.Arcade.Sprite {
    const spawn = PROTOTYPE_SPAWNS.cats[catId];
    const sprite = this.physics.add.sprite(spawn.x, spawn.y, ATLAS_TEXTURE_KEY).setDepth(6);
    setCatPose(sprite, catId, 'idle');
    sprite.setScale(0.58).setSize(125, 120).setOffset(65, 105).setCollideWorldBounds(true);
    return sprite;
  }

  #switchCat(): void {
    const activeCat = this.#gameplay.switchActiveCat();
    this.#companionTether.onActiveCatChanged(activeCat);
    this.#facing[activeCat] = this.#actors[activeCat].flipX ? -1 : 1;
    this.cameras.main.startFollow(this.#actors[activeCat], true, 0.09, 0.09);
  }

  #moveCats(deltaMs: number): void {
    const activeId = this.#gameplay.getSnapshot().activeCat;
    const followerId = activeId === 'luma' ? 'nox' : 'luma';
    const active = this.#actors[activeId];
    const horizontal =
      Number(this.#inputState.isPressed('move-right')) -
      Number(this.#inputState.isPressed('move-left'));
    active.setVelocityX(horizontal * PLAYER_SPEED);
    if (horizontal !== 0) this.#setFacing(activeId, horizontal);

    const grounded = arcadeBody(active).blocked.down;
    this.#coyoteMs = grounded ? 120 : Math.max(0, this.#coyoteMs - deltaMs);
    this.#jumpBufferMs = Math.max(0, this.#jumpBufferMs - deltaMs);
    if (this.#inputState.consume('jump')) this.#jumpBufferMs = 130;
    if (this.#jumpBufferMs > 0 && (grounded || this.#coyoteMs > 0)) {
      active.setVelocityY(-JUMP_SPEED);
      this.#jumpBufferMs = 0;
      this.#coyoteMs = 0;
    }

    this.#companionTether.update(activeId, deltaMs);

    this.#animateCat(activeId, deltaMs);
    if (!this.#companionTether.isSpirit(followerId)) this.#animateCat(followerId, deltaMs);
  }

  #animateCat(catId: CatId, deltaMs: number): void {
    const sprite = this.#actors[catId];
    this.#actionLockMs[catId] = Math.max(0, this.#actionLockMs[catId] - deltaMs);
    if (this.#actionLockMs[catId] > 0) return;
    if (!arcadeBody(sprite).blocked.down) {
      sprite.anims.stop();
      setCatPose(sprite, catId, 'jump');
    } else if (Math.abs(sprite.body?.velocity.x ?? 0) > 15) {
      sprite.anims.play(`${catId}-run`, true);
    } else {
      sprite.anims.stop();
      setCatPose(sprite, catId, 'idle');
    }
  }

  #setFacing(catId: CatId, direction: number): void {
    this.#facing[catId] = direction < 0 ? -1 : 1;
    this.#actors[catId].setFlipX(direction < 0);
  }

  #attack(): void {
    const catId = this.#gameplay.getSnapshot().activeCat;
    const actor = this.#actors[catId];
    actor.anims.stop();
    setCatPose(actor, catId, 'attack');
    this.#actionLockMs[catId] = 240;
    playPrimaryAttack(
      this,
      this.#gameplay,
      actor,
      catId,
      this.#facing[catId],
      this.#enemySystem.targets(),
    );
  }

  #specialAbility(): void {
    const catId = this.#gameplay.getSnapshot().activeCat;
    const actor = this.#actors[catId];
    actor.anims.stop();
    setCatPose(actor, catId, 'ability');
    this.#actionLockMs[catId] = 430;
    playSpecialAbility(
      this,
      this.#gameplay,
      actor,
      catId,
      this.#facing[catId],
      this.#enemySystem.targets(),
    );
  }

  #checkCheckpointAndFalls(): void {
    const snapshot = this.#gameplay.getSnapshot();
    const active = this.#actors[snapshot.activeCat];
    const moonWell = PROTOTYPE_SPAWNS.checkpoints[1];
    if (Phaser.Math.Distance.Between(active.x, active.y, moonWell.x, moonWell.y) < 90) {
      this.#gameplay.reachCheckpoint(moonWell.id);
    }
    if (Object.values(this.#actors).some((actor) => actor.y > PLATFORMER_WORLD.height + 90)) {
      this.#gameplay.takeDamage(3);
    }
  }

  #applyPhase(phase: Phase): void {
    this.#lastPhase = phase;
    this.cameras.main.setBackgroundColor(phase === 'day' ? 0x82c8d4 : 0x171738);
    this.#phaseOverlay.setFillStyle(
      phase === 'day' ? 0xffdf8b : 0x2a174f,
      phase === 'day' ? 0.05 : 0.38,
    );
    const dominantCat = dominantCatForPhase(phase);
    (['luma', 'nox'] as const).forEach((catId) => {
      if (this.#companionTether.isSpirit(catId)) return;
      const sprite = this.#actors[catId];
      if (catId === dominantCat) sprite.setAlpha(1).clearTint();
      else sprite.setAlpha(0.78).setTint(0x8b8ca5);
    });
  }

  #resetWorld(): void {
    const snapshot = this.#gameplay.getSnapshot();
    this.#lastRestartCount = snapshot.checkpointRestartCount;
    const checkpoint =
      PROTOTYPE_SPAWNS.checkpoints.find((point) => point.id === snapshot.checkpointId) ??
      PROTOTYPE_SPAWNS.checkpoints[0];
    this.#actors.luma.setPosition(checkpoint.x + 34, checkpoint.y).setVelocity(0, 0);
    this.#actors.nox.setPosition(checkpoint.x - 58, checkpoint.y).setVelocity(0, 0);
    this.#companionTether.reset();
    this.#enemySystem.reset();
    this.cameras.main.flash(180, 255, 244, 206);
  }

  #updateSelection(): void {
    const active = this.#actors[this.#gameplay.getSnapshot().activeCat];
    this.#selection.setPosition(active.x, active.y + 48);
  }

  #stopAllActors(): void {
    Object.values(this.#actors).forEach((actor) => actor.setVelocity(0, 0));
    this.#companionTether.stop();
    this.#enemySystem.stop();
  }

  #handlePointerDown(): void {
    this.#inputState.press('primary-ability');
    this.#inputState.release('primary-ability');
  }

  #shutdown(): void {
    this.input.off('pointerdown', this.#handlePointerDown, this);
    this.#inputState.reset();
  }
}
