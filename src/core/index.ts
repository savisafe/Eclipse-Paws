export { BondHealth } from './combat/bond-health';
export {
  DOMINANT_POWER_MODIFIER,
  WEAK_POWER_MODIFIER,
  dominantCatForPhase,
  isStrikeHit,
  powerModifierFor,
  weakCatForPhase,
} from './combat/combat-rules';
export { CooldownTracker } from './abilities/cooldown-tracker';
export { EclipseMeter } from './abilities/eclipse-meter';
export { enemyAiProfileForLevel, type EnemyAiProfile } from './entities/enemy-ai-profile';
export {
  canEnemyDetectTarget,
  isHazardAhead,
  isPointInZone,
  isTargetConcealed,
  type HazardPoint,
  type RectZone,
} from './entities/enemy-perception';
export type { GameEvent } from './events/game-event';
export { GameSession } from './game-session';
export type {
  AbilityConfig,
  AbilityEffect,
  AbilitySlot,
  AbilityUseResult,
  AttackResult,
  CatId,
  EnemyConfig,
  EnemyState,
  GameplaySnapshot,
  HeroProgress,
  LootKind,
  Phase,
  PrototypeContentConfig,
} from './models';
export {
  ABILITY_UNLOCK_LEVEL,
  ECLIPSE_DURATION_MS,
  ECLIPSE_SLOW_FACTOR,
  SHADOW_VEIL_DURATION_MS,
  STUN_DURATION_MS,
  createDefaultHeroProgress,
} from './models';
export { BossPhaseTracker } from './phase/boss-phase-tracker';
export { PhaseCycle, type PhaseAdvanceResult } from './phase/phase-cycle';
export { SequencePuzzle, type SequenceResult } from './puzzle/sequence-puzzle';
export * from './save';
export * from './state-machine';
