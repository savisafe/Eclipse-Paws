import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { GameInputState } from '@adapters/input/index';
import { WebHapticsAdapter } from '@adapters/haptics/index';
import {
  PROTOTYPE_MONSTERS,
  SILENCE_ENEMIES,
  STAGE4_ENEMIES,
  STAGE5_ENEMIES,
  type CampaignLevelDefinition,
} from '@content/index';
import type { CatId, GameEvent, Phase } from '@core/index';
import {
  drawArena,
  drawCheckpoints,
  PLATFORMER_WORLD_HEIGHT,
  preloadEnvironment,
} from './arena-decoration';
import { createArenaTextures } from './arena-textures';
import { CombatAbilitySystem } from './combat-ability-system';
import { GardenCollectibleSystem } from './garden-collectible-system';
import { CompanionSystem } from './companion-system';
import { LevelMechanicsSystem } from './level-mechanics-system';
import { PlatformerEnemySystem } from './platformer-enemy-system';
import { PlayerMovementSystem } from './player-movement-system';
import {
  ATLAS_TEXTURE_KEY,
  CAT_DISPLAY_SCALE,
  catFacing,
  preloadSpriteAtlas,
  setCatFacing,
  setCatPose,
} from './sprite-atlas';
import { TagSwitchSystem } from './tag-switch-system';
import {
  GARDEN_ENEMY_FRAMES,
  preloadGardenEnemyAtlas,
  prepareGardenEnemyAtlas,
} from './garden-enemy-atlas';
import {
  SILENCE_ENEMY_FRAMES,
  preloadSilenceEnemyAtlas,
  prepareSilenceEnemyAtlas,
} from './silence-enemy-atlas';
import {
  STAGE4_ENEMY_FRAMES,
  preloadStage4EnemyAtlas,
  prepareStage4EnemyAtlas,
} from './stage4-enemy-atlas';
import {
  STAGE5_ENEMY_FRAMES,
  preloadStage5EnemyAtlas,
  prepareStage5EnemyAtlas,
} from './stage5-enemy-atlas';
import { GARDEN_TUTORIAL_STEPS, TutorialSystem } from './tutorial-system';
import { GardenLevelSystem } from './garden/garden-level-system';

const FIXED_STEP_MS = 1000 / 60;

export interface PrototypeSceneOptions {
  gameplay: GameplayController;
  inputState: GameInputState;
  level: CampaignLevelDefinition;
  onPauseRequested: () => void;
  onLevelCompleted: () => void;
  onReady: () => void;
  reducedMotion: boolean;
  effectsVolume: number;
  vibration: boolean;
  nightBrightness: number;
  startNearFinish: boolean;
  startNearCombat: boolean;
}

export class PrototypeScene extends Phaser.Scene {
  readonly #actionLockMs: Record<CatId, number> = { luma: 0, nox: 0 };
  readonly #facing: Record<CatId, number> = { luma: 1, nox: 1 };
  readonly #gameplay: GameplayController;
  readonly #inputState: GameInputState;
  readonly #level: CampaignLevelDefinition;
  readonly #onLevelCompleted: () => void;
  readonly #onPauseRequested: () => void;
  readonly #onReady: () => void;
  readonly #reducedMotion: boolean;
  readonly #effectsVolume: number;
  readonly #vibration: boolean;
  readonly #nightBrightness: number;
  readonly #startNearFinish: boolean;
  readonly #startNearCombat: boolean;
  #accumulatorMs = 0;
  #actors!: Record<CatId, Phaser.Physics.Arcade.Sprite>;
  #enemySystem!: PlatformerEnemySystem;
  #hidingStatus!: Phaser.GameObjects.Text;
  #lastPhase: Phase = 'day';
  #lastRestartCount = 0;
  #combatSystem!: CombatAbilitySystem;
  #companionSystem!: CompanionSystem;
  #levelMechanics!: LevelMechanicsSystem;
  #phaseOverlay!: Phaser.GameObjects.Rectangle;
  #platforms!: Phaser.Physics.Arcade.StaticGroup;
  #playerMovement!: PlayerMovementSystem;
  #selection!: Phaser.GameObjects.Ellipse;
  #switching = false;
  #tagSwitchSystem!: TagSwitchSystem;
  #tutorialSystem: TutorialSystem | null = null;
  #gardenSystem: GardenLevelSystem | null = null;
  #unsubscribeEvents?: () => void;

  constructor(options: PrototypeSceneOptions) {
    super('prototype-platformer');
    this.#gameplay = options.gameplay;
    this.#inputState = options.inputState;
    this.#level = options.level;
    this.#onPauseRequested = options.onPauseRequested;
    this.#onLevelCompleted = options.onLevelCompleted;
    this.#onReady = options.onReady;
    this.#reducedMotion = options.reducedMotion;
    this.#effectsVolume = options.effectsVolume;
    this.#vibration = options.vibration;
    this.#nightBrightness = options.nightBrightness;
    this.#startNearFinish = options.startNearFinish;
    this.#startNearCombat = options.startNearCombat;
  }

  // Which sprite atlases a level needs follows from the enemies it actually spawns, not from its
  // index: levels 5 and 6 reuse earlier rosters, and level 1 now fields the hounds of Silence.
  #needsAtlas(frames: Readonly<Record<string, unknown>>): boolean {
    return this.#level.enemies.some((enemy) => enemy.configId in frames);
  }

  get #isGarden(): boolean {
    return this.#level.id === 'garden-first-dawn';
  }

  preload(): void {
    preloadSpriteAtlas(this);
    preloadEnvironment(this, this.#level);
    GardenCollectibleSystem.preload(this);
    if (this.#isGarden) GardenLevelSystem.preload(this);
    if (this.#needsAtlas(SILENCE_ENEMY_FRAMES)) preloadSilenceEnemyAtlas(this);
    if (this.#needsAtlas(GARDEN_ENEMY_FRAMES)) preloadGardenEnemyAtlas(this);
    if (this.#needsAtlas(STAGE4_ENEMY_FRAMES)) preloadStage4EnemyAtlas(this);
    if (this.#needsAtlas(STAGE5_ENEMY_FRAMES)) preloadStage5EnemyAtlas(this);
  }

  create(): void {
    createArenaTextures(this);
    if (this.#needsAtlas(SILENCE_ENEMY_FRAMES)) prepareSilenceEnemyAtlas(this);
    if (this.#needsAtlas(GARDEN_ENEMY_FRAMES)) prepareGardenEnemyAtlas(this);
    if (this.#needsAtlas(STAGE4_ENEMY_FRAMES)) prepareStage4EnemyAtlas(this);
    if (this.#needsAtlas(STAGE5_ENEMY_FRAMES)) prepareStage5EnemyAtlas(this);
    const world = drawArena(this, this.#level, this.#reducedMotion);
    this.#phaseOverlay = world.phaseOverlay;
    this.#platforms = world.platforms;

    this.physics.world.setBounds(0, 0, this.#level.worldWidth, PLATFORMER_WORLD_HEIGHT + 180);
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.cameras.main.setBounds(0, 0, this.#level.worldWidth, PLATFORMER_WORLD_HEIGHT);

    this.#actors = { luma: this.#createCat('luma'), nox: this.#createCat('nox') };
    const finish = this.#level.checkpoints[2];
    if (this.#startNearFinish) this.#actors.luma.setPosition(finish.x - 20, finish.y);
    else if (this.#startNearCombat) this.#actors.luma.setPosition(540, 500);
    this.#tagSwitchSystem = new TagSwitchSystem(this, this.#actors, this.#reducedMotion);
    this.physics.add.collider(Object.values(this.#actors), this.#platforms);
    this.#selection = this.add
      .ellipse(0, 0, 112, 28)
      .setFillStyle(0x10152e, 0.2)
      .setStrokeStyle(5, 0xffda72, 0.96)
      .setDepth(5);
    drawCheckpoints(this, this.#level);
    const enemyTypes = {
      ...PROTOTYPE_MONSTERS,
      ...SILENCE_ENEMIES,
      ...STAGE4_ENEMIES,
      ...STAGE5_ENEMIES,
    };
    this.#enemySystem = new PlatformerEnemySystem(
      this,
      this.#gameplay,
      this.#platforms,
      this.#level.enemies,
      enemyTypes,
      this.#level.hazards,
      this.#level.coverZones,
      this.#level.index,
      this.#level.dormantEnemyIds,
    );
    this.#hidingStatus = this.add
      .text(640, 165, 'УКРЫТИЕ · враги потеряли след', {
        color: '#b9ffe4',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        padding: { x: 12, y: 6 },
        backgroundColor: 'rgba(18, 45, 42, 0.9)',
        stroke: '#10152e',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(35)
      .setVisible(false);
    if (this.#level.index === 1 && !this.#startNearCombat && !this.#startNearFinish) {
      this.#tutorialSystem = new TutorialSystem(this, this.#reducedMotion, GARDEN_TUTORIAL_STEPS);
    }
    if (this.#isGarden) {
      this.#gardenSystem = new GardenLevelSystem({
        actors: this.#actors,
        enemies: this.#enemySystem,
        gameplay: this.#gameplay,
        level: this.#level,
        nightBrightness: this.#nightBrightness,
        reducedMotion: this.#reducedMotion,
        scene: this,
        onHandOver: (catId) => this.#handOverTo(catId),
        onTutorialStep: (stepIndex) => this.#tutorialSystem?.complete(stepIndex),
      });
    }
    const garden = this.#gardenSystem;
    this.#combatSystem = new CombatAbilitySystem({
      actionLockMs: this.#actionLockMs,
      actors: this.#actors,
      enemies: this.#enemySystem,
      facing: this.#facing,
      gameplay: this.#gameplay,
      reducedMotion: this.#reducedMotion,
      effectsVolume: this.#effectsVolume,
      haptics: new WebHapticsAdapter(this.#vibration),
      scene: this,
      solids: this.#platforms,
      onShout: garden ? (x, y) => garden.onShout(x, y) : undefined,
      dashTargets: garden ? () => garden.dashTargets() : undefined,
      onDashTarget: garden ? (targetId) => garden.triggerDashTarget(targetId) : undefined,
    });
    this.#playerMovement = new PlayerMovementSystem({
      actionLockMs: this.#actionLockMs,
      actors: this.#actors,
      facing: this.#facing,
      gameplay: this.#gameplay,
      input: this.#inputState,
    });
    this.#companionSystem = new CompanionSystem({
      actionLockMs: this.#actionLockMs,
      actors: this.#actors,
      gameplay: this.#gameplay,
      reducedMotion: this.#reducedMotion,
      scene: this,
    });
    this.#levelMechanics = new LevelMechanicsSystem({
      actors: this.#actors,
      enemies: this.#enemySystem,
      gameplay: this.#gameplay,
      level: this.#level,
      onLevelCompleted: this.#onLevelCompleted,
      reducedMotion: this.#reducedMotion,
      scene: this,
      startNearFinish: this.#startNearFinish,
    });
    this.#exposeDebugState();
    this.#applyPhase('day');
    this.#unsubscribeEvents = this.#gameplay.subscribeToEvents((event) =>
      this.#showProgressEvent(event),
    );
    this.cameras.main.startFollow(this.#actors.luma, true, 0.09, 0.09);
    this.cameras.main.setDeadzone(260, 130);

    this.input.on('pointerdown', this.#handlePointerDown, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.#shutdown, this);
    this.#onReady();
  }

  // Dev-only, read-only window hook used by the level-1 end-to-end test (see `debugState`).
  #exposeDebugState(): void {
    if (!import.meta.env.DEV || !this.#gardenSystem) return;
    const garden = this.#gardenSystem;
    (window as unknown as { __eclipsePawsGarden?: () => unknown }).__eclipsePawsGarden = () =>
      garden.debugState();
  }

  setNightBrightness(nightBrightness: number): void {
    this.#gardenSystem?.setNightBrightness(nightBrightness);
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
    const tutorialActor = this.#actors[this.#gameplay.getSnapshot().activeCat];
    this.#tutorialSystem?.observe(
      {
        attacked: this.#inputState.isPressed('primary-ability'),
        interacted: this.#inputState.isPressed('interact'),
        jumped: this.#inputState.isPressed('jump'),
        moved: this.#inputState.isPressed('move-left') || this.#inputState.isPressed('move-right'),
        switched: this.#inputState.isPressed('switch-cat'),
      },
      tutorialActor,
    );
    if (this.#inputState.consume('switch-cat') && !this.#switching) this.#switchCat();
    if (this.#switching) return;
    if (this.#inputState.consume('primary-ability')) this.#combatSystem.primary();
    if (this.#inputState.consume('special-ability')) this.#combatSystem.special();
    if (this.#inputState.consume('support-ability')) this.#combatSystem.support();
    if (this.#inputState.consume('ultimate')) this.#combatSystem.eclipse();
    if (this.#inputState.consume('interact')) {
      const snapshot = this.#gameplay.getSnapshot();
      const active = this.#actors[snapshot.activeCat];
      if (this.#gardenSystem) this.#gardenSystem.interact(active, snapshot.activeCat);
      else this.#levelMechanics.interact(active);
    }
    if (this.#inputState.consume('restart-checkpoint')) this.#gameplay.restartCheckpoint();
    this.#playerMovement.update(deltaMs);
    this.#companionSystem.update(deltaMs);
    const active = this.#actors[this.#gameplay.getSnapshot().activeCat];
    const snapshot = this.#gameplay.getSnapshot();
    // Теневой покров hides both cats anywhere for a few seconds; crouching in a cover zone stays
    // the always-available alternative (§12).
    const veiled = snapshot.shadowVeilMs > 0;
    const hiding =
      veiled || (this.#inputState.isPressed('move-down') && this.#insideCover(active.x, active.y));
    this.#hidingStatus
      .setText(veiled ? 'ТЕНЕВОЙ ПОКРОВ · сон не видит вас' : 'УКРЫТИЕ · враги потеряли след')
      .setVisible(hiding);
    this.#enemySystem.update(active, deltaMs, hiding);
    this.#gardenSystem?.update(deltaMs);
    this.#levelMechanics.update(active, deltaMs, this.#gardenSystem?.canFinish);
    this.#levelMechanics.setEclipse(snapshot.eclipseActiveMs > 0);

    if (snapshot.phase !== this.#lastPhase) this.#applyPhase(snapshot.phase);
    if (snapshot.checkpointRestartCount !== this.#lastRestartCount) this.#resetWorld();
  }

  #createCat(catId: CatId): Phaser.Physics.Arcade.Sprite {
    // Spawn at whichever checkpoint the session is on, so `?checkpoint=<id>` really does start the
    // level there (readDebugLaunchParams documents that flag as "jump straight to a checkpoint").
    const checkpointId = this.#gameplay.getSnapshot().checkpointId;
    const start =
      this.#level.checkpoints.find((point) => point.id === checkpointId) ??
      this.#level.checkpoints[0];
    const x = start.x + (catId === 'luma' ? 35 : -45);
    const sprite = this.physics.add.sprite(x, start.y, ATLAS_TEXTURE_KEY).setDepth(6);
    setCatPose(sprite, catId, 'idle');
    setCatFacing(sprite, 1);
    sprite
      .setScale(CAT_DISPLAY_SCALE)
      .setSize(125, 120)
      .setOffset(98, 170)
      .setCollideWorldBounds(true);
    return sprite;
  }

  #insideCover(x: number, y: number): boolean {
    return this.#level.coverZones.some(
      (cover) =>
        x >= cover.x - cover.width / 2 &&
        x <= cover.x + cover.width / 2 &&
        y >= cover.y - cover.height / 2 &&
        y <= cover.y + cover.height / 2,
    );
  }

  #handOverTo(catId: CatId): void {
    if (this.#switching || this.#gameplay.getSnapshot().activeCat === catId) return;
    this.#switchCat();
  }

  #switchCat(): void {
    const previous = this.#actors[this.#gameplay.getSnapshot().activeCat];
    const activeCat = this.#gameplay.switchActiveCat();
    const next = this.#actors[activeCat];
    const nextBody = next.body as Phaser.Physics.Arcade.Body;
    const unsafeSwitch =
      !nextBody.blocked.down ||
      Math.abs(next.x - previous.x) > 260 ||
      Math.abs(next.y - previous.y) > 140;
    if (unsafeSwitch) {
      const side = catFacing(previous) > 0 ? -1 : 1;
      next.setPosition(previous.x + side * 42, previous.y).setVelocity(0, 0);
    }
    nextBody.setAllowGravity(false);
    next.setVelocity(0, 0);
    this.#switching = true;
    this.#tagSwitchSystem.animate(activeCat, () => {
      nextBody.setAllowGravity(true);
      this.#switching = false;
      this.#facing[activeCat] = catFacing(this.#actors[activeCat]);
      this.#applyPhase(this.#gameplay.getSnapshot().phase);
    });
  }

  #applyPhase(phase: Phase): void {
    this.#lastPhase = phase;
    this.cameras.main.setBackgroundColor(phase === 'day' ? 0x82c8d4 : 0x171738);
    this.#phaseOverlay.setFillStyle(
      phase === 'day' ? 0xffdf8b : 0x2a174f,
      phase === 'day' ? 0.05 : 0.38,
    );
    this.#levelMechanics.applyPhase(phase);
    this.#gardenSystem?.applyPhase(phase);
  }

  #resetWorld(): void {
    const snapshot = this.#gameplay.getSnapshot();
    this.#lastRestartCount = snapshot.checkpointRestartCount;
    const checkpoint =
      this.#level.checkpoints.find((point) => point.id === snapshot.checkpointId) ??
      this.#level.checkpoints[0];
    this.#actors.luma.enableBody(true, checkpoint.x + 34, checkpoint.y, true, true);
    this.#actors.luma.setVelocity(0, 0);
    this.#actors.nox.enableBody(true, checkpoint.x - 58, checkpoint.y, true, true);
    this.#actors.nox.setVelocity(0, 0);
    this.#enemySystem.reset();
    if (!this.#reducedMotion) this.cameras.main.flash(180, 255, 244, 206);
  }

  #updateSelection(): void {
    const active = this.#actors[this.#gameplay.getSnapshot().activeCat];
    const body = active.body as Phaser.Physics.Arcade.Body;
    this.#selection.setPosition(body.center.x, body.bottom + 4);
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
    delete (window as unknown as { __eclipsePawsGarden?: () => unknown }).__eclipsePawsGarden;
    this.input.off('pointerdown', this.#handlePointerDown, this);
    this.#inputState.reset();
    // ARC-010: every owned system implements Destroyable — call all of them uniformly, not just
    // the ones that happen to hold a non-Phaser resource today (see destroyable.ts for why).
    this.#combatSystem.destroy();
    this.#tagSwitchSystem.destroy();
    this.#enemySystem.destroy();
    this.#levelMechanics.destroy();
    this.#playerMovement.destroy();
    this.#companionSystem.destroy();
    this.#tutorialSystem?.destroy();
    this.#gardenSystem?.destroy();
    this.#unsubscribeEvents?.();
  }

  #showProgressEvent(event: GameEvent): void {
    if (event.type !== 'HeroLevelUp') return;
    const message = `УРОВЕНЬ ${event.level} · СИЛА ПАРЫ ВОЗРОСЛА`;
    const label = this.add
      .text(640, 190, message, {
        color: '#ffe291',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '25px',
        fontStyle: 'bold',
        stroke: '#17152f',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(40);
    this.tweens.add({
      targets: label,
      y: label.y - 30,
      alpha: 0,
      duration: this.#reducedMotion ? 1 : 1300,
      hold: this.#reducedMotion ? 800 : 350,
      onComplete: () => label.destroy(),
    });
  }
}
