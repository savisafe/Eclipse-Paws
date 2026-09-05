import { createDefaultHeroProgress, type HeroProgress } from '../models';
import { legacySaveGameShapeSchema, saveGameSchemaFor } from './save-game.schema';

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
  const schemaVersion = (value as Partial<SaveGame>).schemaVersion;
  if (schemaVersion !== SAVE_SCHEMA_VERSION) return migrateSave(value);

  const parsed = saveGameSchemaFor(SAVE_SCHEMA_VERSION).safeParse(value);
  if (!parsed.success) return null;

  const defaults = createDefaultSave();
  return {
    ...defaults,
    ...parsed.data,
    bestTimesMs: parsed.data.bestTimesMs ?? {},
    heroProgress: parsed.data.heroProgress ?? defaults.heroProgress,
    settings: { ...defaults.settings, ...parsed.data.settings },
    sparksByLevel: parsed.data.sparksByLevel ?? {},
  };
}

function migrateSave(value: unknown): SaveGame | null {
  const parsed = legacySaveGameShapeSchema.safeParse(value);
  if (!parsed.success) return null;
  if (parsed.data.schemaVersion !== 0 && parsed.data.schemaVersion !== 1) return null;

  const migrated = createDefaultSave();
  return {
    ...migrated,
    completedLevels: parsed.data.completedLevels ?? [],
    heroProgress: parsed.data.heroProgress ?? migrated.heroProgress,
    unlockedLevels: parsed.data.unlockedLevels ?? migrated.unlockedLevels,
  };
}
