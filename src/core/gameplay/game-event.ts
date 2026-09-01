import type { CatId, Phase } from './models';

export type GameEvent =
  | { type: 'PhaseChanged'; phase: Phase }
  | { type: 'ActiveCatChanged'; activeCat: CatId }
  | { type: 'DamageTaken'; amount: number; remainingHealth: number }
  | { type: 'AbilityUsed'; abilityId: string; catId: CatId; damage: number }
  | { type: 'EnemyDefeated'; enemyId: string }
  | { type: 'CheckpointReached'; checkpointId: string }
  | { type: 'CheckpointRestarted'; checkpointId: string; restartCount: number }
  | { type: 'GamePaused'; paused: boolean };
