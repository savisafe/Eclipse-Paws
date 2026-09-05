export type CatId = 'luma' | 'nox';
export type Phase = 'day' | 'night';

export interface AbilityConfig {
  baseDamage: number;
  cooldownMs: number;
  effect:
    | 'light-paw'
    | 'lightning'
    | 'shadow-spikes'
    | 'twilight-claw'
    | 'purring-shield'
    | 'shadow-decoy';
  id: string;
  owner: CatId;
  range: number;
}

export interface EnemyConfig {
  contactDamage: number;
  health: number;
  id: string;
  movement: 'ground' | 'flying';
  speed: number;
  telegraphMs: number;
}

export interface EnemyState {
  configId: string;
  health: number;
  id: string;
}

export interface PrototypeContentConfig {
  abilities: Readonly<Record<CatId, AbilityConfig>>;
  enemies: readonly EnemyState[];
  enemyTypes: Readonly<Record<string, EnemyConfig>>;
  phaseDurationMs: number;
  specialAbilities: Readonly<Record<CatId, AbilityConfig>>;
  supportAbilities: Readonly<Record<CatId, AbilityConfig>>;
}

export interface GameplaySnapshot {
  activeCat: CatId;
  bondHealth: number;
  checkpointId: string;
  checkpointRestartCount: number;
  cooldowns: Readonly<Record<string, number>>;
  eclipseMeter: number;
  elapsedMs: number;
  enemies: readonly EnemyState[];
  maxBondHealth: number;
  maxEclipseMeter: number;
  heroLevel: number;
  heroXp: number;
  heroXpToNext: number;
  loot: Readonly<Record<LootKind, number>>;
  paused: boolean;
  phase: Phase;
  phaseRemainingMs: number;
  shieldCharges: number;
  sparksCollected: number;
  totalSparks: number;
}

export type LootKind = 'dawn-crystal' | 'moon-petal' | 'eclipse-ore';

export interface HeroProgress {
  level: number;
  loot: Record<LootKind, number>;
  xp: number;
}

export function createDefaultHeroProgress(): HeroProgress {
  return {
    level: 1,
    loot: { 'dawn-crystal': 0, 'moon-petal': 0, 'eclipse-ore': 0 },
    xp: 0,
  };
}

export type AbilitySlot = 'primary' | 'special' | 'support' | 'ultimate';

export const ABILITY_UNLOCK_LEVEL: Readonly<Record<AbilitySlot, number>> = {
  primary: 1,
  special: 2,
  support: 3,
  ultimate: 4,
};

export interface AttackResult {
  damage: number;
  defeated: boolean;
  enemyId: string;
}

export interface AbilityUseResult {
  abilityId: string;
  cooldownMs: number;
}
