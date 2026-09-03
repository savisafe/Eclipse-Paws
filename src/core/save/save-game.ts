export const SAVE_SCHEMA_VERSION = 1;

export interface SavedSettings {
  effectsVolume: number;
  musicVolume: number;
  reducedMotion: boolean;
  vibration: boolean;
}

export interface SaveGame {
  bestTimesMs: Record<string, number>;
  completedLevels: string[];
  schemaVersion: number;
  settings: SavedSettings;
  sparksByLevel: Record<string, number>;
  unlockedLevels: string[];
}

export function createDefaultSave(): SaveGame {
  return {
    bestTimesMs: {},
    completedLevels: [],
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
    settings: { ...defaults.settings, ...candidate.settings },
    sparksByLevel: candidate.sparksByLevel ?? {},
  };
}

function migrateSave(candidate: Partial<SaveGame>): SaveGame | null {
  if (candidate.schemaVersion !== 0) return null;
  const migrated = createDefaultSave();
  return {
    ...migrated,
    completedLevels: Array.isArray(candidate.completedLevels) ? candidate.completedLevels : [],
    unlockedLevels: Array.isArray(candidate.unlockedLevels)
      ? candidate.unlockedLevels
      : migrated.unlockedLevels,
  };
}
