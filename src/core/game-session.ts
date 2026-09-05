import { BondHealth } from './combat/bond-health';
import { CooldownTracker } from './abilities/cooldown-tracker';
import { EclipseMeter } from './abilities/eclipse-meter';
import { powerModifierFor } from './combat/combat-rules';
import type { GameEvent } from './events/game-event';
import {
  ABILITY_UNLOCK_LEVEL,
  ECLIPSE_DURATION_MS,
  SHADOW_VEIL_DURATION_MS,
  STUN_DURATION_MS,
} from './models';
import type {
  AbilityConfig,
  AttackResult,
  AbilityUseResult,
  CatId,
  EnemyState,
  GameplaySnapshot,
  HeroProgress,
  LootKind,
  PrototypeContentConfig,
} from './models';
import { PhaseCycle } from './phase/phase-cycle';

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
  #elapsedMs = 0;
  #paused = false;
  #shieldCharges = 0;
  #eclipseActiveMs = 0;
  #invulnerableMs = 0;
  #shadowVeilMs = 0;
  readonly #stuns = new Map<string, number>();
  readonly #sparks = new Set<string>();
  #heroLevel: number;
  #heroXp: number;
  readonly #loot: Record<LootKind, number>;

  constructor(content: PrototypeContentConfig, progress?: HeroProgress) {
    this.#content = content;
    this.#phaseCycle = new PhaseCycle(content.phaseDurationMs);
    this.#enemies = this.#createEnemyStates();
    this.#heroLevel = progress?.level ?? 1;
    this.#heroXp = progress?.xp ?? 0;
    this.#loot = { 'dawn-crystal': 0, 'moon-petal': 0, 'eclipse-ore': 0, ...progress?.loot };
  }

  snapshot(): GameplaySnapshot {
    return {
      activeCat: this.#activeCat,
      bondHealth: this.#bondHealth.current,
      checkpointId: this.#checkpointId,
      checkpointRestartCount: this.#checkpointRestartCount,
      cooldowns: this.#cooldowns.snapshot(),
      eclipseMeter: this.#meter.current,
      elapsedMs: this.#elapsedMs,
      enemies: this.#enemies.map((enemy) => ({ ...enemy })),
      maxBondHealth: this.#bondHealth.maximum,
      maxEclipseMeter: this.#meter.maximum,
      heroLevel: this.#heroLevel,
      heroXp: this.#heroXp,
      heroXpToNext: this.#xpToNext(),
      loot: { ...this.#loot },
      paused: this.#paused,
      phase: this.#phaseCycle.phase,
      phaseRemainingMs: this.#phaseCycle.remainingMs,
      eclipseActiveMs: this.#eclipseActiveMs,
      shadowVeilMs: this.#shadowVeilMs,
      shieldCharges: this.#shieldCharges,
      sparksCollected: this.#sparks.size,
      stunnedEnemyIds: [...this.#stuns.keys()],
      totalSparks: 3,
    };
  }

  update(deltaMs: number): void {
    if (this.#paused) return;
    this.#elapsedMs += deltaMs;
    this.#cooldowns.update(deltaMs);
    this.#advanceTimers(deltaMs);
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
    if (this.#heroLevel < ABILITY_UNLOCK_LEVEL[special ? 'special' : 'primary']) return null;
    const enemy = this.#enemies.find((candidate) => candidate.id === enemyId);
    if (!enemy || enemy.health <= 0) return null;

    const ability = special
      ? this.#content.specialAbilities[this.#activeCat]
      : this.#content.abilities[this.#activeCat];
    if (!this.#cooldowns.ready(ability.id)) return null;
    this.#cooldowns.start(ability.id, ability.cooldownMs);
    const levelModifier = 1 + (this.#heroLevel - 1) * 0.08;
    const damage =
      ability.baseDamage *
      powerModifierFor(this.#activeCat, this.#phaseCycle.phase) *
      levelModifier;
    enemy.health = Math.max(0, enemy.health - damage);
    const defeated = enemy.health === 0;

    this.#events.push({
      type: 'AbilityUsed',
      abilityId: ability.id,
      catId: this.#activeCat,
      damage,
    });
    if (defeated) {
      this.#events.push({ type: 'EnemyDefeated', enemyId });
      this.#gainXp(
        Math.max(
          10,
          Math.round(enemy.health + this.#content.enemyTypes[enemy.configId]!.health * 0.45),
        ),
      );
    }
    this.#meter.gain((special ? 12 : 8) + (defeated ? 15 : 0));
    // "Теневой покров ... исчезает при агрессивном действии" (§12).
    this.#shadowVeilMs = 0;

    return { damage, defeated, enemyId };
  }

  // Оглушающий крик: "Атака не наносит большой урон: её задача — создать безопасное окно"
  // (§12). The shout's damage goes through `attack()`; this is the control half of it.
  stunEnemies(enemyIds: readonly string[], durationMs = STUN_DURATION_MS): readonly string[] {
    if (this.#paused) return [];
    const stunned = enemyIds.filter((enemyId) => {
      const enemy = this.#enemies.find((candidate) => candidate.id === enemyId);
      return Boolean(enemy) && enemy!.health > 0;
    });
    stunned.forEach((enemyId) => {
      this.#stuns.set(enemyId, Math.max(this.#stuns.get(enemyId) ?? 0, durationMs));
    });
    if (stunned.length > 0) this.#events.push({ type: 'EnemiesStunned', enemyIds: stunned });
    return stunned;
  }

  // Теневой наскок: "Во время движения он неуязвим" (§12).
  grantInvulnerability(durationMs: number): void {
    this.#invulnerableMs = Math.max(this.#invulnerableMs, durationMs);
  }

  isEnemyStunned(enemyId: string): boolean {
    return (this.#stuns.get(enemyId) ?? 0) > 0;
  }

  useSupport(): AbilityUseResult | null {
    if (this.#heroLevel < ABILITY_UNLOCK_LEVEL.support) return null;
    const result = this.#useUtility(this.#content.supportAbilities[this.#activeCat], 6);
    if (result) {
      // Теневой покров hides both cats instead of healing; Световой круг keeps the protective
      // shield/heal behaviour.
      if (this.#activeCat === 'nox') {
        this.#shadowVeilMs = SHADOW_VEIL_DURATION_MS;
      } else if (this.#bondHealth.current < this.#bondHealth.maximum) {
        const before = this.#bondHealth.current;
        const remainingHealth = this.#bondHealth.heal(1);
        this.#events.push({
          type: 'HealingReceived',
          amount: remainingHealth - before,
          remainingHealth,
        });
      } else {
        this.#shieldCharges = Math.min(2, this.#shieldCharges + 1);
      }
    }
    return result;
  }

  // Затмение (§12): "не является кнопкой массового уничтожения". It spends the full bond meter
  // to open a twilight window — enemies slow down and both phases are visible at once — and
  // deals no damage at all.
  useEclipse(): boolean {
    if (this.#heroLevel < ABILITY_UNLOCK_LEVEL.ultimate) return false;
    if (!this.#meter.spend(this.#meter.maximum)) return false;
    this.#eclipseActiveMs = ECLIPSE_DURATION_MS;
    this.#events.push({ type: 'EclipseStarted', durationMs: ECLIPSE_DURATION_MS });
    return true;
  }

  collectSpark(sparkId: string): boolean {
    if (this.#sparks.has(sparkId)) return false;
    this.#sparks.add(sparkId);
    this.#meter.gain(12);
    this.#events.push({ type: 'SparkCollected', sparkId, total: this.#sparks.size });
    return true;
  }

  collectLoot(sourceId: string): LootKind {
    const checksum = [...sourceId].reduce((sum, character) => sum + character.charCodeAt(0), 0);
    const kinds: readonly LootKind[] = ['dawn-crystal', 'moon-petal', 'eclipse-ore'];
    const kind = kinds[checksum % kinds.length] ?? 'moon-petal';
    this.#loot[kind] += 1;
    this.#events.push({ type: 'LootCollected', kind, total: this.#loot[kind] });
    return kind;
  }

  rewardEclipse(amount: number): void {
    this.#meter.gain(amount);
  }

  takeDamage(amount: number): boolean {
    if (this.#paused) return false;
    if (this.#invulnerableMs > 0) return false;
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
    this.#stuns.clear();
    this.#eclipseActiveMs = 0;
    this.#invulnerableMs = 0;
    this.#shadowVeilMs = 0;
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

  #advanceTimers(deltaMs: number): void {
    this.#eclipseActiveMs = Math.max(0, this.#eclipseActiveMs - deltaMs);
    this.#invulnerableMs = Math.max(0, this.#invulnerableMs - deltaMs);
    this.#shadowVeilMs = Math.max(0, this.#shadowVeilMs - deltaMs);
    this.#stuns.forEach((remainingMs, enemyId) => {
      const next = remainingMs - deltaMs;
      if (next <= 0) this.#stuns.delete(enemyId);
      else this.#stuns.set(enemyId, next);
    });
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

  #gainXp(amount: number): void {
    this.#heroXp += amount;
    while (this.#heroXp >= this.#xpToNext()) {
      this.#heroXp -= this.#xpToNext();
      this.#heroLevel += 1;
      this.#events.push({ type: 'HeroLevelUp', level: this.#heroLevel });
    }
  }

  #xpToNext(): number {
    return 60 + (this.#heroLevel - 1) * 35;
  }
}
