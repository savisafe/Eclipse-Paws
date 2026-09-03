import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { CampaignLevelDefinition } from '@content/index';
import type { CatId, Phase } from '@core/index';
import { GardenCollectibleSystem } from './garden-collectible-system';
import { FinalBossSystem } from './final-boss-system';
import { GardenFlowerPuzzle } from './garden-flower-puzzle';
import { LibraryConstellationSystem } from './library-constellation-system';
import { PhaseBridgeSystem } from './phase-bridge-system';
import type { PlatformerEnemySystem } from './platformer-enemy-system';
import { PlatformerHazardSystem } from './platformer-hazard-system';
import { PlatformerProgressSystem } from './platformer-progress-system';

export class LevelMechanicsSystem {
  readonly #collectibles: GardenCollectibleSystem;
  readonly #constellations: LibraryConstellationSystem | null;
  readonly #enemies: PlatformerEnemySystem;
  readonly #flowers: GardenFlowerPuzzle | null;
  readonly #finalBoss: FinalBossSystem | null;
  readonly #gameplay: GameplayController;
  readonly #hazards: PlatformerHazardSystem;
  readonly #level: CampaignLevelDefinition;
  readonly #phaseBridges: PhaseBridgeSystem;
  readonly #progress: PlatformerProgressSystem;
  readonly #startNearFinish: boolean;

  constructor(options: {
    actors: Record<CatId, Phaser.Physics.Arcade.Sprite>;
    enemies: PlatformerEnemySystem;
    gameplay: GameplayController;
    level: CampaignLevelDefinition;
    onLevelCompleted: () => void;
    reducedMotion: boolean;
    scene: Phaser.Scene;
    startNearFinish: boolean;
  }) {
    this.#gameplay = options.gameplay;
    this.#level = options.level;
    this.#enemies = options.enemies;
    this.#startNearFinish = options.startNearFinish;
    this.#collectibles = new GardenCollectibleSystem(
      options.scene,
      options.gameplay,
      options.level.sparks,
    );
    this.#flowers =
      options.level.mechanic === 'flowers'
        ? new GardenFlowerPuzzle(options.scene, options.gameplay, options.actors)
        : null;
    this.#finalBoss =
      options.level.mechanic === 'boss-rush'
        ? new FinalBossSystem(
            options.scene,
            options.gameplay,
            options.level.bossId,
            360,
            options.reducedMotion,
          )
        : null;
    this.#constellations =
      options.level.mechanic === 'constellations'
        ? new LibraryConstellationSystem(options.scene, options.gameplay, options.actors)
        : null;
    this.#phaseBridges = new PhaseBridgeSystem(
      options.scene,
      options.actors,
      options.level.phasePlatforms,
      options.level.mechanic,
    );
    this.#hazards = new PlatformerHazardSystem(
      options.scene,
      options.gameplay,
      options.actors,
      options.reducedMotion,
      options.level.hazards,
    );
    this.#progress = new PlatformerProgressSystem(
      options.gameplay,
      options.onLevelCompleted,
      options.level,
    );
  }

  interact(active: Phaser.Physics.Arcade.Sprite): void {
    this.#flowers?.interact(active);
    this.#constellations?.interact(active, this.#gameplay.getSnapshot().phase);
  }

  update(active: Phaser.Physics.Arcade.Sprite, deltaMs: number): void {
    this.#hazards.update(deltaMs);
    this.#finalBoss?.update(deltaMs);
    this.#collectibles.update(active);
    const canFinish =
      this.#startNearFinish ||
      ((this.#flowers?.solved ?? true) &&
        (this.#constellations?.solved ?? true) &&
        this.#enemies.isDefeated(this.#level.bossId));
    this.#progress.update(active, canFinish);
  }

  applyPhase(phase: Phase): void {
    this.#phaseBridges.update(phase);
  }
}
