import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageSaveRepository } from '@adapters/storage/index';
import { ProgressService } from '@application/index';
import { parseSaveGame } from '@core/index';

describe('save game', () => {
  beforeEach(() => window.localStorage.clear());

  it('migrates schema version 0 safely', () => {
    const migrated = parseSaveGame({
      schemaVersion: 0,
      completedLevels: ['garden-first-dawn'],
      unlockedLevels: ['garden-first-dawn', 'whispering-lanterns'],
    });
    expect(migrated).toEqual(
      expect.objectContaining({
        schemaVersion: 2,
        completedLevels: ['garden-first-dawn'],
      }),
    );
    expect(migrated?.heroProgress.level).toBe(1);
    expect(migrated?.heroProgress.xp).toBe(0);
  });

  it('clears corrupted JSON instead of crashing', async () => {
    window.localStorage.setItem('test-save', '{broken');
    const repository = new LocalStorageSaveRepository(window.localStorage, 'test-save');

    await expect(repository.load()).resolves.toBeNull();
    expect(window.localStorage.getItem('test-save')).toBeNull();
  });

  it('saves best result and unlocks the next level', async () => {
    const repository = new LocalStorageSaveRepository(window.localStorage, 'test-save');
    const progress = new ProgressService(repository);

    await progress.completeLevel('garden-first-dawn', 95_000, 2);
    const save = await progress.completeLevel('garden-first-dawn', 110_000, 1);

    expect(save.bestTimesMs['garden-first-dawn']).toBe(95_000);
    expect(save.sparksByLevel['garden-first-dawn']).toBe(2);
    expect(save.unlockedLevels).toContain('whispering-lanterns');
    expect(save.settings.vibration).toBe(true);
  });

  it('rejects a current-schema save with the wrong field types instead of trusting it (ARC-002)', () => {
    const rejected = parseSaveGame({
      schemaVersion: 2,
      completedLevels: ['garden-first-dawn'],
      unlockedLevels: ['garden-first-dawn'],
      bestTimesMs: { 'garden-first-dawn': 'not-a-number' },
    });
    expect(rejected).toBeNull();
  });
});
