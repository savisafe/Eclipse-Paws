import {
  createDefaultSave,
  type HeroProgress,
  type SaveGame,
  type SavedSettings,
} from '@core/index';
import { CAMPAIGN_LEVEL_ORDER, PLAYABLE_CAMPAIGN_LEVELS } from '@content/index';
import type { SaveRepository } from '../ports/save-repository';

export class ProgressService {
  readonly #repository: SaveRepository<SaveGame>;

  constructor(repository: SaveRepository<SaveGame>) {
    this.#repository = repository;
  }

  async load(): Promise<SaveGame> {
    return (await this.#repository.load()) ?? createDefaultSave();
  }

  async completeLevel(
    levelId: string,
    elapsedMs: number,
    sparks: number,
    heroProgress?: HeroProgress,
  ): Promise<SaveGame> {
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
      heroProgress: heroProgress ?? save.heroProgress,
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
    // ARC-012/KNOWN_ISSUES #3: was a second, independently-maintained copy of the level order —
    // now reads from the single source of truth in content so adding a level can't desync the two.
    const index = CAMPAIGN_LEVEL_ORDER.indexOf(levelId as (typeof CAMPAIGN_LEVEL_ORDER)[number]);
    const next = index >= 0 ? CAMPAIGN_LEVEL_ORDER[index + 1] : undefined;
    return next && PLAYABLE_CAMPAIGN_LEVELS.includes(next) ? next : null;
  }
}
