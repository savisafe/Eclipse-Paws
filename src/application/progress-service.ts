import { createDefaultSave, type SaveGame, type SavedSettings } from '@core/index';
import type { SaveRepository } from './ports/save-repository';

export class ProgressService {
  readonly #repository: SaveRepository<SaveGame>;

  constructor(repository: SaveRepository<SaveGame>) {
    this.#repository = repository;
  }

  async load(): Promise<SaveGame> {
    return (await this.#repository.load()) ?? createDefaultSave();
  }

  async completeLevel(levelId: string, elapsedMs: number, sparks: number): Promise<SaveGame> {
    const save = await this.load();
    const completedLevels = [...new Set([...save.completedLevels, levelId])];
    const nextLevel = this.#nextLevel(levelId);
    const unlockedLevels = nextLevel
      ? [...new Set([...save.unlockedLevels, nextLevel])]
      : save.unlockedLevels;
    const previousBest = save.bestTimesMs[levelId];
    const updated: SaveGame = {
      ...save,
      bestTimesMs: {
        ...save.bestTimesMs,
        [levelId]: previousBest ? Math.min(previousBest, elapsedMs) : elapsedMs,
      },
      completedLevels,
      sparksByLevel: {
        ...save.sparksByLevel,
        [levelId]: Math.max(save.sparksByLevel[levelId] ?? 0, sparks),
      },
      unlockedLevels,
    };
    await this.#repository.save(updated);
    return updated;
  }

  async saveSettings(settings: SavedSettings): Promise<void> {
    const save = await this.load();
    await this.#repository.save({ ...save, settings });
  }

  #nextLevel(levelId: string): string | null {
    const order = [
      'garden-first-dawn',
      'whispering-forest',
      'sky-library',
      'clock-fortress',
      'eclipse-heart',
    ];
    const index = order.indexOf(levelId);
    return index >= 0 ? (order[index + 1] ?? null) : null;
  }
}
