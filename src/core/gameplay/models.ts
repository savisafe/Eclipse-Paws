export type CatId = 'luma' | 'nox';
export type Phase = 'day' | 'night';

export interface AbilityConfig {
  baseDamage: number;
  effect: 'light-paw' | 'lightning' | 'shadow-spikes' | 'twilight-claw';
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
}

export interface GameplaySnapshot {
  activeCat: CatId;
  bondHealth: number;
  checkpointId: string;
  checkpointRestartCount: number;
  enemies: readonly EnemyState[];
  maxBondHealth: number;
  paused: boolean;
  phase: Phase;
  phaseRemainingMs: number;
}

export interface AttackResult {
  damage: number;
  defeated: boolean;
  enemyId: string;
}
