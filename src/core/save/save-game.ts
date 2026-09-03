import { createDefaultHeroProgress, type HeroProgress } from '../gameplay/models';

export const SAVE_SCHEMA_VERSION = 2;

export interface SavedSettings {
  effectsVolume: number;
  musicVolume: number;
  reducedMotion: boolean;
  vibration: boolean;
}

export interface SaveGame {
  bestTimesMs: Record<string, number>;
  completedLevels: string[];
  heroProgress: HeroProgress;
  schemaVersion: number;
  settings: SavedSettings;
  sparksByLevel: Record<string, number>;
  unlockedLevels: string[];
}

export function createDefaultSave(): SaveGame {
  return {
    bestTimesMs: {},
    completedLevels: [],
    heroProgress: createDefaultHeroProgress(),
    schemaVersion: SAVE_SCHEMA_VERSION,
    settings: { effectsVolume: 80, musicVolume: 70, reducedMotion: false, vibration: true },
    sparksByLevel: {},
    unlockedLevels: ['garden-first-dawn'],
  };
}

export function parseSaveGame(value: unknown): SaveGame | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<SaveGame>;
  if (candidate.schemaVersion !== SAVE_SCHEMA_VERSION) return migrateSave(candidate);
  if (!Array.isArray(candidate.unlockedLevels) || !Array.isArray(candidate.completedLevels)) {
    return null;
  }
  const defaults = createDefaultSave();
  return {
    ...defaults,
    ...candidate,
    bestTimesMs: candidate.bestTimesMs ?? {},
    heroProgress: candidate.heroProgress ?? defaults.heroProgress,
    settings: { ...defaults.settings, ...candidate.settings },
    sparksByLevel: candidate.sparksByLevel ?? {},
  };
}

function migrateSave(candidate: Partial<SaveGame>): SaveGame | null {
  if (candidate.schemaVersion !== 0 && candidate.schemaVersion !== 1) return null;
  const migrated = createDefaultSave();
  return {
    ...migrated,
    completedLevels: Array.isArray(candidate.completedLevels) ? candidate.completedLevels : [],
    heroProgress: candidate.heroProgress ?? migrated.heroProgress,
    unlockedLevels: Array.isArray(candidate.unlockedLevels)
      ? candidate.unlockedLevels
      : migrated.unlockedLevels,
  };
}
