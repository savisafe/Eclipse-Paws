export type CatId = 'luma' | 'nox';
export type Phase = 'day' | 'night';

// Canon ability set from ECLIPSE_PAWS_SCENARIO.md §12 ("Система развития способностей"):
// Лумус — Оглушающий крик, Луч света, Световой круг; Нокс — Теневой наскок, Теневые иглы,
// Теневой покров; совместная способность — Затмение.
export type AbilityEffect =
  | 'stunning-shout'
  | 'light-beam'
  | 'light-circle'
  | 'shadow-dash'
  | 'shadow-needles'
  | 'shadow-veil'
  | 'eclipse';

export interface AbilityConfig {
  baseDamage: number;
  cooldownMs: number;
  effect: AbilityEffect;
  id: string;
  // Canon Russian name, shown in the HUD so the player learns the ability by the name the
  // scenario uses (§12), not by a slot number.
  name: string;
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
  eclipseActiveMs: number;
  shadowVeilMs: number;
  shieldCharges: number;
  sparksCollected: number;
  stunnedEnemyIds: readonly string[];
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

// §12 progression table: level 1 gives the first pair of combat abilities, level 2 the ranged
// pair, level 3 the protective pair, and the shared Eclipse only arrives on level 5.
export const ABILITY_UNLOCK_LEVEL: Readonly<Record<AbilitySlot, number>> = {
  primary: 1,
  special: 2,
  support: 3,
  ultimate: 5,
};

// Оглушающий крик "ненадолго оглушает ближайших противников" — long enough to open a safe
// window, short enough that it never replaces fighting.
export const STUN_DURATION_MS = 1_400;

// Теневой покров: "на несколько секунд укрывает обоих котов" and "исчезает при агрессивном
// действии".
export const SHADOW_VEIL_DURATION_MS = 4_000;

// Затмение: a shared twilight window, not a damage button — enemies slow down and both phases
// become visible at once (§12, "Совместная способность «Затмение»").
export const ECLIPSE_DURATION_MS = 6_000;
export const ECLIPSE_SLOW_FACTOR = 0.45;

export interface AttackResult {
  damage: number;
  defeated: boolean;
  enemyId: string;
}

export interface AbilityUseResult {
  abilityId: string;
  cooldownMs: number;
}
