export interface EnemyAiProfile {
  aggressionRange: number;
  attackRange: number;
  canDropFromLedges: boolean;
  canGapJump: boolean;
  jumpCooldownMs: number;
  jumpRangeX: number;
  jumpVelocity: number;
  predictionSeconds: number;
  strikeCooldownMs: number;
  telegraphMultiplier: number;
}

export function enemyAiProfileForLevel(levelIndex: number): EnemyAiProfile {
  const level = Math.min(5, Math.max(1, Math.round(levelIndex)));
  return {
    aggressionRange: 360 + (level - 1) * 85,
    attackRange: 104 + (level - 1) * 5,
    canDropFromLedges: level >= 3,
    canGapJump: level >= 2,
    jumpCooldownMs: 1900 - (level - 1) * 230,
    jumpRangeX: 250 + (level - 1) * 35,
    jumpVelocity: 500 + (level - 1) * 22,
    predictionSeconds: 0.04 + (level - 1) * 0.045,
    strikeCooldownMs: 1450 - (level - 1) * 105,
    telegraphMultiplier: 1 - (level - 1) * 0.065,
  };
}
