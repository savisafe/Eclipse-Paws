import { z } from 'zod';

// ARC-002: runtime validation for persisted data (docs/ECLIPSE_PAWS_RECONSTRUCTION_PLAN.md §4,
// "ошибки content-конфигураций выявляются... с понятным сообщением"). Kept in `core/save`
// alongside the `SaveGame` type it mirrors — `zod` has no DOM/Phaser/React dependency, so this
// does not violate the core purity boundary enforced by eslint.config.js.

const lootKindSchema = z.enum(['dawn-crystal', 'moon-petal', 'eclipse-ore']);

const heroProgressSchema = z.object({
  level: z.number().int().positive(),
  loot: z.record(lootKindSchema, z.number().nonnegative()),
  xp: z.number().nonnegative(),
});

const savedSettingsSchema = z.object({
  effectsVolume: z.number().min(0).max(100),
  musicVolume: z.number().min(0).max(100),
  reducedMotion: z.boolean(),
  vibration: z.boolean(),
});

export function saveGameSchemaFor(version: number) {
  return z.object({
    bestTimesMs: z.record(z.string(), z.number().nonnegative()).optional(),
    completedLevels: z.array(z.string()),
    heroProgress: heroProgressSchema.optional(),
    schemaVersion: z.literal(version),
    settings: savedSettingsSchema.partial().optional(),
    sparksByLevel: z.record(z.string(), z.number().nonnegative()).optional(),
    unlockedLevels: z.array(z.string()),
  });
}

// Legacy shapes (schemaVersion 0/1) only need enough structure for `migrateSave` to read from —
// the full shape above only ever applies to the current schema version.
export const legacySaveGameShapeSchema = z.object({
  completedLevels: z.array(z.string()).optional(),
  heroProgress: heroProgressSchema.optional(),
  schemaVersion: z.number().int(),
  unlockedLevels: z.array(z.string()).optional(),
});
