import { BondHealth } from './bond-health';
import { CooldownTracker } from './cooldown-tracker';
import { EclipseMeter } from './eclipse-meter';
import { powerModifierFor } from './combat-rules';
import type { GameEvent } from './game-event';
import type {
  AbilityConfig,
  AttackResult,
  AbilityUseResult,
  CatId,
  EnemyState,
  GameplaySnapshot,
  PrototypeContentConfig,
} from './models';
import { PhaseCycle } from './phase-cycle';

export class GameSession {
  readonly #bondHealth = new BondHealth(3);
  readonly #cooldowns = new CooldownTracker();
  readonly #content: PrototypeContentConfig;
  readonly #events: GameEvent[] = [];
  readonly #meter = new EclipseMeter();
  readonly #phaseCycle: PhaseCycle;
  #activeCat: CatId = 'luma';
  #checkpointId = 'garden-gate';
  #checkpointRestartCount = 0;
  #enemies: EnemyState[];
  #paused = false;
  #shieldCharges = 0;

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
      cooldowns: this.#cooldowns.snapshot(),
      eclipseMeter: this.#meter.current,
      enemies: this.#enemies.map((enemy) => ({ ...enemy })),
      maxBondHealth: this.#bondHealth.maximum,
      maxEclipseMeter: this.#meter.maximum,
      paused: this.#paused,
      phase: this.#phaseCycle.phase,
      phaseRemainingMs: this.#phaseCycle.remainingMs,
      shieldCharges: this.#shieldCharges,
    };
  }

  update(deltaMs: number): void {
    if (this.#paused) return;
    this.#cooldowns.update(deltaMs);
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
    if (!this.#cooldowns.ready(ability.id)) return null;
    this.#cooldowns.start(ability.id, ability.cooldownMs);
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
    this.#meter.gain((special ? 12 : 8) + (defeated ? 15 : 0));

    return { damage, defeated, enemyId };
  }

  useMobility(): AbilityUseResult | null {
    return this.#useUtility(this.#content.mobilityAbilities[this.#activeCat], 3);
  }

  useSupport(): AbilityUseResult | null {
    const result = this.#useUtility(this.#content.supportAbilities[this.#activeCat], 6);
    if (result) this.#shieldCharges = Math.min(2, this.#shieldCharges + 1);
    return result;
  }

  manualChangePhase(): boolean {
    if (!this.#meter.spend(50)) return false;
    const phase = this.#phaseCycle.changePhase();
    this.#events.push({ type: 'PhaseChanged', phase });
    return true;
  }

  useUltimate(enemyIds: readonly string[]): boolean {
    if (!this.#meter.spend(this.#meter.maximum)) return false;
    this.#shieldCharges = Math.max(1, this.#shieldCharges);
    enemyIds.forEach((enemyId) => {
      const enemy = this.#enemies.find((candidate) => candidate.id === enemyId);
      if (!enemy || enemy.health <= 0) return;
      enemy.health = Math.max(0, enemy.health - 30);
      if (enemy.health === 0) this.#events.push({ type: 'EnemyDefeated', enemyId });
    });
    return true;
  }

  takeDamage(amount: number): boolean {
    if (this.#paused) return false;
    if (this.#shieldCharges > 0) {
      this.#shieldCharges -= 1;
      this.#events.push({
        type: 'DamageTaken',
        amount: 0,
        remainingHealth: this.#bondHealth.current,
      });
      return false;
    }
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

  #useUtility(ability: AbilityConfig, meterGain: number): AbilityUseResult | null {
    if (this.#paused || !this.#cooldowns.ready(ability.id)) return null;
    this.#cooldowns.start(ability.id, ability.cooldownMs);
    this.#meter.gain(meterGain);
    this.#events.push({
      type: 'AbilityUsed',
      abilityId: ability.id,
      catId: this.#activeCat,
      damage: 0,
    });
    return { abilityId: ability.id, cooldownMs: ability.cooldownMs };
  }

  #createEnemyStates(): EnemyState[] {
    return this.#content.enemies.map((enemy) => {
      const config = this.#content.enemyTypes[enemy.configId];
      if (!config) throw new Error(`Unknown enemy config: ${enemy.configId}`);
      return { ...enemy, health: config.health };
    });
  }
}
