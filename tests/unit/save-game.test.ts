import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageSaveRepository } from '@adapters/storage/index';
import { ProgressService } from '@application/index';
import { parseSaveGame } from '@core/index';

describe('save game', () => {
  beforeEach(() => window.localStorage.clear());

  it('migrates schema version 0 safely', () => {
    expect(
      parseSaveGame({
        schemaVersion: 0,
        completedLevels: ['garden-first-dawn'],
        unlockedLevels: ['garden-first-dawn', 'whispering-forest'],
      }),
    ).toEqual(
      expect.objectContaining({
        schemaVersion: 1,
        completedLevels: ['garden-first-dawn'],
      }),
    );
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
    expect(save.unlockedLevels).toContain('whispering-forest');
  });
});
