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

  it('drives level 1 nightfall from its script instead of a timer', () => {
    // §12: "Ночь наступает не по обычному таймеру, а как сюжетное событие."
    expect(CAMPAIGN_LEVELS['garden-first-dawn'].phaseMode).toBe('story');
    expect(createLevelContent('garden-first-dawn').phaseMode).toBe('story');
    expect(CAMPAIGN_LEVELS['garden-first-dawn'].dormantEnemyIds).toEqual([
      'hound-1',
      'hound-2',
      'hound-3',
      'hound-alpha',
    ]);
    expect(CAMPAIGN_LEVEL_ORDER.slice(1).every((id) => !CAMPAIGN_LEVELS[id].phaseMode)).toBe(true);
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
    // Level 1 has no hazards on purpose: ECLIPSE_PAWS_SCENARIO.md §12 keeps «Сад первой зари»
    // free of punishing terrain ("Пропасть допустима только там, где она имеет смысл", water is
    // never instant death) — its obstacles are the hedge, the height changes and the hounds.
    expect(levels.map((level) => level.hazards.length)).toEqual([0, 2, 5, 3, 1, 2, 6]);
    expect(levels.map((level) => level.phaseDurationMs)).toEqual([
      45_000, 40_000, 30_000, 35_000, 32_000, 28_000, 26_000,
    ]);
    // Level 1 hides the cats with Теневой покров instead of crouch-in-cover spots.
    expect(levels[0]?.coverZones).toHaveLength(0);
    expect(levels.slice(1).every((level) => level.coverZones.length > 0)).toBe(true);
  });
});
