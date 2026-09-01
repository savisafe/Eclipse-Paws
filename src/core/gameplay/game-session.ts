import { BondHealth } from './bond-health';
import { powerModifierFor } from './combat-rules';
import type { GameEvent } from './game-event';
import type {
  AttackResult,
  CatId,
  EnemyState,
  GameplaySnapshot,
  PrototypeContentConfig,
} from './models';
import { PhaseCycle } from './phase-cycle';

export class GameSession {
  readonly #bondHealth = new BondHealth(3);
  readonly #content: PrototypeContentConfig;
  readonly #events: GameEvent[] = [];
  readonly #phaseCycle: PhaseCycle;
  #activeCat: CatId = 'luma';
  #checkpointId = 'garden-gate';
  #checkpointRestartCount = 0;
  #enemies: EnemyState[];
  #paused = false;

  constructor(content: PrototypeContentConfig) {
    this.#content = content;
    this.#phaseCycle = new PhaseCycle(content.phaseDurationMs);
    this.#enemies = this.#createEnemyStates();
  }

  snapshot(): GameplaySnapshot {
    return {
      activeCat: this.#activeCat,
      bondHealth: this.#bondHealth.current,
      checkpointId: this.#checkpointId,
      checkpointRestartCount: this.#checkpointRestartCount,
      enemies: this.#enemies.map((enemy) => ({ ...enemy })),
      maxBondHealth: this.#bondHealth.maximum,
      paused: this.#paused,
      phase: this.#phaseCycle.phase,
      phaseRemainingMs: this.#phaseCycle.remainingMs,
    };
  }

  update(deltaMs: number): void {
    if (this.#paused) return;
    const result = this.#phaseCycle.advance(deltaMs);
    if (result.changed) this.#events.push({ type: 'PhaseChanged', phase: result.phase });
  }

  switchActiveCat(): CatId {
    this.#activeCat = this.#activeCat === 'luma' ? 'nox' : 'luma';
    this.#events.push({ type: 'ActiveCatChanged', activeCat: this.#activeCat });
    return this.#activeCat;
  }

  attack(enemyId: string, special = false): AttackResult | null {
    if (this.#paused) return null;
    const enemy = this.#enemies.find((candidate) => candidate.id === enemyId);
    if (!enemy || enemy.health <= 0) return null;

    const ability = special
      ? this.#content.specialAbilities[this.#activeCat]
      : this.#content.abilities[this.#activeCat];
    const damage = ability.baseDamage * powerModifierFor(this.#activeCat, this.#phaseCycle.phase);
    enemy.health = Math.max(0, enemy.health - damage);
    const defeated = enemy.health === 0;

    this.#events.push({
      type: 'AbilityUsed',
      abilityId: ability.id,
      catId: this.#activeCat,
      damage,
    });
    if (defeated) this.#events.push({ type: 'EnemyDefeated', enemyId });

    return { damage, defeated, enemyId };
  }

  takeDamage(amount: number): boolean {
    if (this.#paused) return false;
    const remainingHealth = this.#bondHealth.damage(amount);
    this.#events.push({ type: 'DamageTaken', amount, remainingHealth });

    if (!this.#bondHealth.depleted) return false;
    this.restartCheckpoint();
    return true;
  }

  reachCheckpoint(checkpointId: string): void {
    if (this.#checkpointId === checkpointId) return;
    this.#checkpointId = checkpointId;
    this.#bondHealth.restore();
    this.#events.push({ type: 'CheckpointReached', checkpointId });
  }

  restartCheckpoint(): void {
    this.#bondHealth.restore();
    this.#enemies = this.#createEnemyStates();
    this.#checkpointRestartCount += 1;
    this.#events.push({
      type: 'CheckpointRestarted',
      checkpointId: this.#checkpointId,
      restartCount: this.#checkpointRestartCount,
    });
  }

  setPaused(paused: boolean): void {
    if (this.#paused === paused) return;
    this.#paused = paused;
    this.#events.push({ type: 'GamePaused', paused });
  }

  drainEvents(): readonly GameEvent[] {
    return this.#events.splice(0);
  }

  #createEnemyStates(): EnemyState[] {
    return this.#content.enemies.map((enemy) => {
      const config = this.#content.enemyTypes[enemy.configId];
      if (!config) throw new Error(`Unknown enemy config: ${enemy.configId}`);
      return { ...enemy, health: config.health };
    });
  }
}
