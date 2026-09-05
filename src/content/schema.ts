import { z } from 'zod';

// ARC-002: runtime validation for content configs (docs/ECLIPSE_PAWS_RECONSTRUCTION_PLAN.md §4,
// "content содержит проверяемые конфигурации" / "ошибки content-конфигураций выявляются при
// сборке или загрузке уровня с понятным сообщением"). Schemas stay structural rather than
// hardcoding the current level/enemy/mechanic string literals, because that content is expected
// to be fully replaced under the new Eclipse Paws scenario (see docs/AUDITS/CURRENT_STATE.md §5)
// — TypeScript's union types already gate the literal values at compile time; what TS cannot
// check is cross-references between separately authored content files (e.g. an enemy spawn
// pointing at a configId that doesn't exist), which is what `validateCampaignLevels` below adds.

export const abilityConfigSchema = z.object({
  baseDamage: z.number().nonnegative(),
  cooldownMs: z.number().nonnegative(),
  effect: z.string().min(1),
  id: z.string().min(1),
  name: z.string().min(1),
  owner: z.string().min(1),
  range: z.number().nonnegative(),
});

export const enemyConfigSchema = z.object({
  contactDamage: z.number().nonnegative(),
  health: z.number().positive(),
  id: z.string().min(1),
  movement: z.string().min(1),
  speed: z.number().nonnegative(),
  telegraphMs: z.number().nonnegative(),
});

const levelPointSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
});

const platformRectSchema = z.object({
  height: z.number().positive(),
  width: z.number().positive(),
  x: z.number(),
  y: z.number(),
});

export const campaignLevelDefinitionSchema = z.object({
  background: z.string().min(1),
  bossId: z.string().min(1),
  checkpoints: z.tuple([levelPointSchema, levelPointSchema, levelPointSchema]),
  coverZones: z.array(platformRectSchema),
  difficulty: z.number().int().min(1).max(7),
  enemies: z.array(levelPointSchema.extend({ configId: z.string().min(1) })),
  hazards: z.array(levelPointSchema.extend({ activePhase: z.enum(['day', 'night']) })),
  id: z.string().min(1),
  index: z.number().int().positive(),
  mechanic: z.string().min(1),
  objective: z.string().min(1),
  phaseDurationMs: z.number().positive(),
  phasePlatforms: z.array(platformRectSchema),
  platforms: z.array(platformRectSchema).min(1),
  sparks: z.array(levelPointSchema),
  story: z.string().min(1),
  subtitle: z.string().min(1),
  title: z.string().min(1),
  worldWidth: z.number().positive(),
});

/**
 * Validates a set of ability/enemy configs against their schema and checks that every enemy spawn
 * across the campaign levels references a `configId` that actually exists in `enemyTypes`. This
 * catches the class of bug where `createLevelContent` silently falls back to `health: 1` for an
 * unknown enemy id instead of failing loudly.
 */
export function validateCampaignContent(input: {
  abilities: Readonly<Record<string, Record<string, unknown>>>;
  enemyTypes: Readonly<Record<string, unknown>>;
  levels: Readonly<Record<string, unknown>>;
}): void {
  const errors: string[] = [];

  for (const [group, byOwner] of Object.entries(input.abilities)) {
    for (const [owner, ability] of Object.entries(byOwner)) {
      const result = abilityConfigSchema.safeParse(ability);
      if (!result.success) {
        errors.push(`ability "${group}.${owner}": ${result.error.message}`);
      }
    }
  }

  for (const [id, enemy] of Object.entries(input.enemyTypes)) {
    const result = enemyConfigSchema.safeParse(enemy);
    if (!result.success) {
      errors.push(`enemyType "${id}": ${result.error.message}`);
    }
  }

  for (const [levelId, level] of Object.entries(input.levels)) {
    const result = campaignLevelDefinitionSchema.safeParse(level);
    if (!result.success) {
      errors.push(`level "${levelId}": ${result.error.message}`);
      continue;
    }
    for (const spawn of result.data.enemies) {
      if (!(spawn.configId in input.enemyTypes)) {
        errors.push(
          `level "${levelId}": enemy spawn "${spawn.id}" references unknown configId "${spawn.configId}"`,
        );
      }
    }
    if (
      !(result.data.bossId in input.enemyTypes) &&
      !result.data.enemies.some((spawn) => spawn.id === result.data.bossId)
    ) {
      errors.push(
        `level "${levelId}": bossId "${result.data.bossId}" does not match any enemy spawn id`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid campaign content:\n${errors.map((line) => `  - ${line}`).join('\n')}`);
  }
}
