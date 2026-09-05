import { describe, expect, it } from 'vitest';
import { CAMPAIGN_LEVEL_ORDER, CAMPAIGN_LEVELS, createLevelContent } from '@content/index';

describe('campaign level content', () => {
  const levels = CAMPAIGN_LEVEL_ORDER.map((id) => CAMPAIGN_LEVELS[id]);

  it('gives all seven levels unique adjacent enemy rosters and a valid boss', () => {
    const rosters = levels.map((level) => new Set(level.enemies.map((enemy) => enemy.configId)));

    for (let index = 0; index < rosters.length - 1; index += 1) {
      const current = rosters[index]!;
      const next = rosters[index + 1]!;
      expect([...current].every((configId) => !next.has(configId))).toBe(true);
    }

    levels.forEach((level) => {
      expect(level.enemies.some((enemy) => enemy.id === level.bossId)).toBe(true);
      expect(createLevelContent(level.id).enemies.length).toBe(level.enemies.length);
    });
  });

  it('uses unique layouts and a steadily rising difficulty curve', () => {
    const layoutSignatures = new Set(
      levels.map((level) =>
        level.platforms
          .map((platform) => `${platform.x}:${platform.y}:${platform.width}:${platform.height}`)
          .join('|'),
      ),
    );

    expect(layoutSignatures.size).toBe(levels.length);
    expect(levels.map((level) => level.difficulty)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(levels.map((level) => level.enemies.length)).toEqual([4, 6, 8, 7, 4, 5, 9]);
    expect(levels.map((level) => level.hazards.length)).toEqual([1, 2, 5, 3, 1, 2, 6]);
    expect(levels.map((level) => level.phaseDurationMs)).toEqual([
      45_000, 40_000, 30_000, 35_000, 32_000, 28_000, 26_000,
    ]);
    expect(levels[0]?.coverZones).toHaveLength(0);
    expect(levels.slice(1).every((level) => level.coverZones.length > 0)).toBe(true);
  });
});
