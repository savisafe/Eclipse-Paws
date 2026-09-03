import { describe, expect, it } from 'vitest';
import { enemyAiProfileForLevel } from '@core/index';

describe('enemy AI progression', () => {
  it('increases pursuit, prediction and traversal options across levels', () => {
    const first = enemyAiProfileForLevel(1);
    const final = enemyAiProfileForLevel(5);

    expect(first.canGapJump).toBe(false);
    expect(first.canDropFromLedges).toBe(false);
    expect(final.canGapJump).toBe(true);
    expect(final.canDropFromLedges).toBe(true);
    expect(final.aggressionRange).toBeGreaterThan(first.aggressionRange);
    expect(final.predictionSeconds).toBeGreaterThan(first.predictionSeconds);
    expect(final.jumpCooldownMs).toBeLessThan(first.jumpCooldownMs);
    expect(final.telegraphMultiplier).toBeLessThan(first.telegraphMultiplier);
  });

  it('clamps unsupported level values to the campaign range', () => {
    expect(enemyAiProfileForLevel(0)).toEqual(enemyAiProfileForLevel(1));
    expect(enemyAiProfileForLevel(99)).toEqual(enemyAiProfileForLevel(5));
  });
});
