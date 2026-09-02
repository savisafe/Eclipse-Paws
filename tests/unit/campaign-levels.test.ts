import { describe, expect, it } from 'vitest';
import { CAMPAIGN_LEVELS, createLevelContent } from '@content/index';

describe('campaign level content', () => {
  it('gives the first three levels unique enemy rosters and bosses', () => {
    const levels = [
      CAMPAIGN_LEVELS['garden-first-dawn'],
      CAMPAIGN_LEVELS['whispering-forest'],
      CAMPAIGN_LEVELS['sky-library'],
    ];
    const gardenRoster = new Set<string>(levels[0]?.enemies.map((enemy) => enemy.configId) ?? []);
    const forestRoster = new Set<string>(levels[1]?.enemies.map((enemy) => enemy.configId) ?? []);
    const libraryRoster = new Set<string>(levels[2]?.enemies.map((enemy) => enemy.configId) ?? []);

    expect([...gardenRoster].every((enemy) => !forestRoster.has(enemy))).toBe(true);
    expect([...forestRoster].every((enemy) => !libraryRoster.has(enemy))).toBe(true);
    levels.forEach((level) => {
      expect(level.enemies.some((enemy) => enemy.id === level.bossId)).toBe(true);
      expect(createLevelContent(level.id).enemies.length).toBe(level.enemies.length);
    });
  });
});
