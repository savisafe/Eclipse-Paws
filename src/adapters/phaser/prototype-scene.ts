import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { GameInputState } from '@adapters/input/index';
import { PROTOTYPE_SPAWNS } from '@content/index';
import type { CatId, Phase } from '@core/index';
import {
  drawArena,
  drawCheckpoints,
  PLATFORMER_WORLD,
  preloadEnvironment,
} from './arena-decoration';
import { createArenaTextures } from './arena-textures';
import { updateCatAnimation } from './cat-animation';
import { CombatAbilitySystem } from './combat-ability-system';
import { GardenCollectibleSystem } from './garden-collectible-system';
import { GardenFlowerPuzzle } from './garden-flower-puzzle';
import { PlatformerEnemySystem } from './platformer-enemy-system';
import { PlatformerHazardSystem } from './platformer-hazard-system';
import { PlatformerProgressSystem } from './platformer-progress-system';
import { ATLAS_TEXTURE_KEY, preloadSpriteAtlas, setCatPose } from './sprite-atlas';
import { TagSwitchSystem } from './tag-switch-system';

const FIXED_STEP_MS = 1000 / 60;
const PLAYER_SPEED = 255;
const JUMP_SPEED = 560;

export interface PrototypeSceneOptions {
  gameplay: GameplayController;
  inputState: GameInputState;
  onPauseRequested: () => void;
  onLevelCompleted: () => void;
  onReady: () => void;
  reducedMotion: boolean;
  startNearFinish: boolean;
  startNearCombat: boolean;
}

function arcadeBody(sprite: Phaser.Physics.Arcade.Sprite): Phaser.Physics.Arcade.Body {
  return sprite.body as Phaser.Physics.Arcade.Body;
}

export class PrototypeScene extends Phaser.Scene {
  readonly #actionLockMs: Record<CatId, number> = { luma: 0, nox: 0 };
  readonly #facing: Record<CatId, number> = { luma: 1, nox: 1 };
  readonly #gameplay: GameplayController;
  readonly #inputState: GameInputState;
  readonly #onLevelCompleted: () => void;
  readonly #onPauseRequested: () => void;
  readonly #onReady: () => void;
  readonly #reducedMotion: boolean;
  readonly #startNearFinish: boolean;
  readonly #startNearCombat: boolean;
  #accumulatorMs = 0;
  #actors!: Record<CatId, Phaser.Physics.Arcade.Sprite>;
  #enemySystem!: PlatformerEnemySystem;
  #collectibleSystem!: GardenCollectibleSystem;
  #lastPhase: Phase = 'day';
  #lastRestartCount = 0;
  #coyoteMs = 0;
  #combatSystem!: CombatAbilitySystem;
  #jumpBufferMs = 0;
  #hazardSystem!: PlatformerHazardSystem;
  #flowerPuzzle!: GardenFlowerPuzzle;
  #phaseOverlay!: Phaser.GameObjects.Rectangle;
  #platforms!: Phaser.Physics.Arcade.StaticGroup;
  #progressSystem!: PlatformerProgressSystem;
  #selection!: Phaser.GameObjects.Ellipse;
  #switching = false;
  #tagSwitchSystem!: TagSwitchSystem;

  constructor(options: PrototypeSceneOptions) {
    super('prototype-platformer');
    this.#gameplay = options.gameplay;
    this.#inputState = options.inputState;
    this.#onPauseRequested = options.onPauseRequested;
    this.#onLevelCompleted = options.onLevelCompleted;
    this.#onReady = options.onReady;
    this.#reducedMotion = options.reducedMotion;
    this.#startNearFinish = options.startNearFinish;
    this.#startNearCombat = options.startNearCombat;
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
    if (this.#startNearFinish) this.#actors.luma.setPosition(4870, 500);
    else if (this.#startNearCombat) this.#actors.luma.setPosition(540, 500);
    this.#actors.nox.disableBody(true, true);
    this.#tagSwitchSystem = new TagSwitchSystem(this, this.#actors, this.#reducedMotion);
    this.physics.add.collider(Object.values(this.#actors), this.#platforms);
    this.#selection = this.add.ellipse(0, 0, 94, 24).setStrokeStyle(5, 0xffda72, 0.92).setDepth(2);
    drawCheckpoints(this);
    this.#enemySystem = new PlatformerEnemySystem(this, this.#gameplay, this.#platforms);
    this.#collectibleSystem = new GardenCollectibleSystem(this, this.#gameplay);
    this.#flowerPuzzle = new GardenFlowerPuzzle(this, this.#gameplay, this.#actors);
    this.#combatSystem = new CombatAbilitySystem({
      actionLockMs: this.#actionLockMs,
      actors: this.#actors,
      enemies: this.#enemySystem,
      facing: this.#facing,
      gameplay: this.#gameplay,
      reducedMotion: this.#reducedMotion,
      scene: this,
    });
    this.#hazardSystem = new PlatformerHazardSystem(
      this,
      this.#gameplay,
      this.#actors,
      this.#reducedMotion,
    );
    this.#progressSystem = new PlatformerProgressSystem(this.#gameplay, this.#onLevelCompleted);
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
    if (this.#inputState.consume('switch-cat') && !this.#switching) this.#switchCat();
    if (this.#switching) return;
    if (this.#inputState.consume('primary-ability')) this.#combatSystem.primary();
    if (this.#inputState.consume('special-ability')) this.#combatSystem.special();
    if (this.#inputState.consume('mobility-ability')) this.#combatSystem.mobility();
    if (this.#inputState.consume('support-ability')) this.#combatSystem.support();
    if (this.#inputState.consume('change-phase')) this.#combatSystem.changePhase();
    if (this.#inputState.consume('ultimate')) this.#combatSystem.ultimate();
    if (this.#inputState.consume('interact')) {
      this.#flowerPuzzle.interact(this.#actors[this.#gameplay.getSnapshot().activeCat]);
    }
    if (this.#inputState.consume('restart-checkpoint')) this.#gameplay.restartCheckpoint();
    this.#moveCats(deltaMs);
    this.#enemySystem.update(this.#actors[this.#gameplay.getSnapshot().activeCat], deltaMs);
    this.#hazardSystem.update(deltaMs);
    const active = this.#actors[this.#gameplay.getSnapshot().activeCat];
    this.#collectibleSystem.update(active);
    const canFinish =
      this.#startNearFinish ||
      (this.#flowerPuzzle.solved && this.#enemySystem.isDefeated('twilight-golem-2'));
    this.#progressSystem.update(active, canFinish);

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
    const previousCat = this.#gameplay.getSnapshot().activeCat;
    const activeCat = this.#gameplay.switchActiveCat();
    this.#switching = true;
    this.#tagSwitchSystem.animate(previousCat, activeCat, () => {
      this.#switching = false;
      this.#facing[activeCat] = this.#actors[activeCat].flipX ? -1 : 1;
      this.#applyPhase(this.#gameplay.getSnapshot().phase);
    });
  }

  #moveCats(deltaMs: number): void {
    const activeId = this.#gameplay.getSnapshot().activeCat;
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

    updateCatAnimation(active, activeId, this.#actionLockMs, deltaMs);
  }

  #setFacing(catId: CatId, direction: number): void {
    this.#facing[catId] = direction < 0 ? -1 : 1;
    this.#actors[catId].setFlipX(direction < 0);
  }

  #applyPhase(phase: Phase): void {
    this.#lastPhase = phase;
    this.cameras.main.setBackgroundColor(phase === 'day' ? 0x82c8d4 : 0x171738);
    this.#phaseOverlay.setFillStyle(
      phase === 'day' ? 0xffdf8b : 0x2a174f,
      phase === 'day' ? 0.05 : 0.38,
    );
  }

  #resetWorld(): void {
    const snapshot = this.#gameplay.getSnapshot();
    this.#lastRestartCount = snapshot.checkpointRestartCount;
    const checkpoint =
      PROTOTYPE_SPAWNS.checkpoints.find((point) => point.id === snapshot.checkpointId) ??
      PROTOTYPE_SPAWNS.checkpoints[0];
    this.#actors.luma.setPosition(checkpoint.x + 34, checkpoint.y).setVelocity(0, 0);
    this.#actors.nox.setPosition(checkpoint.x - 58, checkpoint.y).setVelocity(0, 0);
    const activeId = snapshot.activeCat;
    const inactiveId = activeId === 'luma' ? 'nox' : 'luma';
    this.#actors[activeId].enableBody(true, checkpoint.x, checkpoint.y, true, true);
    this.#actors[inactiveId].disableBody(true, true);
    this.#enemySystem.reset();
    if (!this.#reducedMotion) this.cameras.main.flash(180, 255, 244, 206);
  }

  #updateSelection(): void {
    const active = this.#actors[this.#gameplay.getSnapshot().activeCat];
    this.#selection.setPosition(active.x, active.y + 48);
  }

  #stopAllActors(): void {
    Object.values(this.#actors).forEach((actor) => actor.setVelocity(0, 0));
    this.#enemySystem.stop();
  }

  #handlePointerDown(): void {
    this.#inputState.press('primary-ability');
    this.#inputState.release('primary-ability');
  }

  #shutdown(): void {
    this.input.off('pointerdown', this.#handlePointerDown, this);
    this.#inputState.reset();
    this.#combatSystem.destroy();
  }
}
