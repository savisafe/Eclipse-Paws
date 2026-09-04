import type { CatId, LootKind, Phase } from './models';

export type GameEvent =
  | { type: 'PhaseChanged'; phase: Phase }
  | { type: 'ActiveCatChanged'; activeCat: CatId }
  | { type: 'DamageTaken'; amount: number; remainingHealth: number }
  | { type: 'HealingReceived'; amount: number; remainingHealth: number }
  | { type: 'AbilityUsed'; abilityId: string; catId: CatId; damage: number }
  | { type: 'EnemyDefeated'; enemyId: string }
  | { type: 'HeroLevelUp'; level: number }
  | { type: 'LootCollected'; kind: LootKind; total: number }
  | { type: 'CheckpointReached'; checkpointId: string }
  | { type: 'CheckpointRestarted'; checkpointId: string; restartCount: number }
  | { type: 'SparkCollected'; sparkId: string; total: number }
  | { type: 'GamePaused'; paused: boolean };
