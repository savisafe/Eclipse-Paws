import { describe, expect, it } from 'vitest';
import { validateCampaignContent } from '@content/schema';

function validLevel(overrides: Record<string, unknown> = {}) {
  return {
    background: 'garden',
    bossId: 'boss-1',
    checkpoints: [
      { id: 'start', x: 0, y: 0 },
      { id: 'mid', x: 100, y: 0 },
      { id: 'end', x: 200, y: 0 },
    ],
    coverZones: [],
    difficulty: 1,
    enemies: [{ id: 'boss-1', configId: 'goblin', x: 10, y: 10 }],
    hazards: [],
    id: 'level-1',
    index: 1,
    mechanic: 'flowers',
    objective: 'test',
    phaseDurationMs: 1000,
    phasePlatforms: [],
    platforms: [{ x: 0, y: 0, width: 100, height: 10 }],
    sparks: [],
    story: 'test',
    subtitle: 'test',
    title: 'test',
    worldWidth: 500,
    ...overrides,
  };
}

describe('content schema validation (ARC-002)', () => {
  it('accepts well-formed abilities, enemy types and levels', () => {
    expect(() =>
      validateCampaignContent({
        abilities: {
          abilities: {
            luma: {
              id: 'a',
              owner: 'luma',
              baseDamage: 1,
              cooldownMs: 100,
              effect: 'x',
              range: 10,
            },
          },
        },
        enemyTypes: {
          goblin: {
            id: 'goblin',
            health: 10,
            contactDamage: 1,
            movement: 'ground',
            speed: 10,
            telegraphMs: 100,
          },
        },
        levels: { 'level-1': validLevel() },
      }),
    ).not.toThrow();
  });

  it('rejects an enemy spawn that references an unknown configId', () => {
    expect(() =>
      validateCampaignContent({
        abilities: {},
        enemyTypes: {},
        levels: {
          'level-1': validLevel({
            enemies: [{ id: 'boss-1', configId: 'does-not-exist', x: 10, y: 10 }],
          }),
        },
      }),
    ).toThrow(/unknown configId "does-not-exist"/);
  });

  it('rejects malformed ability/enemy configs with a readable message', () => {
    expect(() =>
      validateCampaignContent({
        abilities: {
          abilities: {
            luma: {
              id: 'a',
              owner: 'luma',
              baseDamage: -1,
              cooldownMs: 100,
              effect: 'x',
              range: 10,
            },
          },
        },
        enemyTypes: {},
        levels: {},
      }),
    ).toThrow(/ability "abilities\.luma"/);
  });
});
