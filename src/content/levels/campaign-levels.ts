import type { PrototypeContentConfig } from '@core/index';
import {
  PROTOTYPE_ABILITIES,
  PROTOTYPE_SPECIAL_ABILITIES,
  PROTOTYPE_SUPPORT_ABILITIES,
} from '../abilities/prototype-abilities';
import { PROTOTYPE_MONSTERS } from '../enemies/prototype-monsters';
import { STAGE4_ENEMIES } from '../enemies/stage4-enemies';
import { STAGE5_ENEMIES } from '../enemies/stage5-enemies';
import { validateCampaignContent } from '../schema';

export type CampaignLevelId =
  'garden-first-dawn' | 'whispering-forest' | 'sky-library' | 'clock-fortress' | 'eclipse-heart';

export interface LevelPoint {
  id: string;
  x: number;
  y: number;
}

export interface PlatformRect {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface CampaignLevelDefinition {
  background: 'garden' | 'forest' | 'library' | 'fortress' | 'eclipse';
  bossId: string;
  checkpoints: readonly [LevelPoint, LevelPoint, LevelPoint];
  coverZones: readonly PlatformRect[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  enemies: readonly (LevelPoint & { configId: string })[];
  hazards: readonly (LevelPoint & { activePhase: 'day' | 'night' })[];
  id: CampaignLevelId;
  index: number;
  mechanic: 'flowers' | 'shadow-bridges' | 'constellations' | 'clocks' | 'boss-rush';
  objective: string;
  phaseDurationMs: number;
  phasePlatforms: readonly PlatformRect[];
  platforms: readonly PlatformRect[];
  sparks: readonly LevelPoint[];
  story: string;
  subtitle: string;
  title: string;
  worldWidth: number;
}

function point(id: string, x: number, y: number): LevelPoint {
  return { id, x, y };
}

function checkpointTriplet(
  ids: readonly [string, string, string],
  xs: readonly [number, number, number],
  y: number,
): [LevelPoint, LevelPoint, LevelPoint] {
  return [point(ids[0], xs[0], y), point(ids[1], xs[1], y), point(ids[2], xs[2], y)];
}

function hazard(
  id: string,
  x: number,
  activePhase: 'day' | 'night',
  y = 610,
): LevelPoint & { activePhase: 'day' | 'night' } {
  return { id, x, y, activePhase };
}

export const CAMPAIGN_LEVELS: Readonly<Record<CampaignLevelId, CampaignLevelDefinition>> = {
  'garden-first-dawn': {
    id: 'garden-first-dawn',
    index: 1,
    difficulty: 1,
    title: 'Сад первой зари',
    subtitle: 'Осколок I · Обучение',
    story: 'День застыл над древним садом. Солнечные цветы помнят путь к первому осколку.',
    objective: 'освой движение · руны 1→2→3 [E] · первый страж',
    background: 'garden',
    mechanic: 'flowers',
    phaseDurationMs: 45_000,
    worldWidth: 3600,
    bossId: 'twilight-golem-1',
    coverZones: [],
    platforms: [
      { x: 500, y: 670, width: 1000, height: 100 },
      { x: 1300, y: 670, width: 500, height: 100 },
      { x: 2050, y: 670, width: 820, height: 100 },
      { x: 2900, y: 670, width: 780, height: 100 },
      { x: 3480, y: 670, width: 360, height: 100 },
      { x: 620, y: 535, width: 300, height: 30 },
      { x: 1100, y: 455, width: 270, height: 30 },
      { x: 1450, y: 535, width: 230, height: 28 },
      { x: 2240, y: 520, width: 330, height: 30 },
      { x: 3040, y: 500, width: 360, height: 30 },
    ],
    phasePlatforms: [],
    checkpoints: checkpointTriplet(
      ['garden-gate', 'moon-well', 'dawn-shard'],
      [180, 2050, 3500],
      500,
    ),
    sparks: [
      point('spark-sunrise', 720, 400),
      point('spark-well', 2300, 390),
      point('spark-ruins', 3100, 370),
    ],
    hazards: [hazard('garden-thorns', 2670, 'night')],
    enemies: [
      { configId: 'shadefang', id: 'shadefang-1', x: 720, y: 470 },
      { configId: 'light-wisp', id: 'light-wisp-1', x: 1320, y: 315 },
      { configId: 'spore-beast', id: 'spore-beast-1', x: 2450, y: 470 },
      { configId: 'twilight-golem', id: 'twilight-golem-1', x: 3340, y: 445 },
    ],
  },
  'whispering-forest': {
    id: 'whispering-forest',
    index: 2,
    difficulty: 2,
    title: 'Лес шепчущих теней',
    subtitle: 'Осколок II · Две тропы',
    story: 'Светлячки заблудились среди корней. Ночные мосты слышат только шаги Бони.',
    objective: 'выбери тропу · используй ночные мосты · Великий Гриб',
    background: 'forest',
    mechanic: 'shadow-bridges',
    phaseDurationMs: 40_000,
    worldWidth: 4300,
    bossId: 'great-mushroom-boss',
    coverZones: [
      { x: 960, y: 570, width: 210, height: 150 },
      { x: 2520, y: 570, width: 230, height: 150 },
      { x: 3510, y: 570, width: 220, height: 150 },
    ],
    platforms: [
      { x: 430, y: 670, width: 860, height: 100 },
      { x: 1160, y: 670, width: 500, height: 100 },
      { x: 1810, y: 670, width: 620, height: 100 },
      { x: 2530, y: 670, width: 620, height: 100 },
      { x: 3260, y: 670, width: 640, height: 100 },
      { x: 4010, y: 670, width: 580, height: 100 },
      { x: 650, y: 500, width: 280, height: 28 },
      { x: 1030, y: 400, width: 250, height: 28 },
      { x: 1480, y: 315, width: 270, height: 28 },
      { x: 2140, y: 455, width: 300, height: 28 },
      { x: 2780, y: 350, width: 270, height: 28 },
      { x: 3400, y: 465, width: 320, height: 28 },
      { x: 3950, y: 520, width: 360, height: 30 },
    ],
    phasePlatforms: [
      { x: 1260, y: 365, width: 150, height: 24 },
      { x: 1780, y: 300, width: 160, height: 24 },
      { x: 3090, y: 300, width: 160, height: 24 },
    ],
    checkpoints: checkpointTriplet(
      ['forest-edge', 'whisper-lantern', 'forest-shard'],
      [180, 2200, 4180],
      500,
    ),
    sparks: [
      point('firefly-a', 1030, 335),
      point('firefly-b', 2780, 285),
      point('firefly-c', 3600, 390),
    ],
    hazards: [hazard('roots-a', 1690, 'night'), hazard('roots-b', 3180, 'day')],
    enemies: [
      { id: 'thorn-1', configId: 'thorn-stalker', x: 760, y: 460 },
      { id: 'moth-1', configId: 'lantern-moth', x: 1450, y: 260 },
      { id: 'spore-1', configId: 'elder-spore', x: 2100, y: 460 },
      { id: 'thorn-2', configId: 'thorn-stalker', x: 2860, y: 450 },
      { id: 'moth-2', configId: 'lantern-moth', x: 3480, y: 300 },
      { id: 'great-mushroom-boss', configId: 'great-mushroom', x: 4020, y: 430 },
    ],
  },
  'sky-library': {
    id: 'sky-library',
    index: 3,
    difficulty: 3,
    title: 'Небесная библиотека',
    subtitle: 'Осколок III · Вертикальный путь',
    story: 'Созвездия исчезли со свода. Зеркала покажут символы, если свет и тень чередуются.',
    objective: 'зажги три зеркала [E] · меняй фазу · Архивариус Эхо',
    background: 'library',
    mechanic: 'constellations',
    phaseDurationMs: 35_000,
    worldWidth: 4700,
    bossId: 'archivist-echo-boss',
    coverZones: [
      { x: 1710, y: 560, width: 180, height: 170 },
      { x: 3290, y: 560, width: 180, height: 170 },
    ],
    platforms: [
      { x: 520, y: 670, width: 1040, height: 100 },
      { x: 1450, y: 670, width: 620, height: 100 },
      { x: 2300, y: 670, width: 820, height: 100 },
      { x: 3200, y: 670, width: 780, height: 100 },
      { x: 4100, y: 670, width: 920, height: 100 },
      { x: 720, y: 535, width: 260, height: 28 },
      { x: 1120, y: 455, width: 250, height: 28 },
      { x: 1510, y: 360, width: 240, height: 28 },
      { x: 1870, y: 265, width: 230, height: 28 },
      { x: 2240, y: 365, width: 260, height: 28 },
      { x: 2550, y: 515, width: 270, height: 28 },
      { x: 3020, y: 405, width: 240, height: 28 },
      { x: 3420, y: 300, width: 240, height: 28 },
      { x: 3970, y: 510, width: 280, height: 28 },
      { x: 4470, y: 420, width: 300, height: 28 },
    ],
    phasePlatforms: [
      { x: 1320, y: 410, width: 135, height: 22 },
      { x: 2050, y: 300, width: 135, height: 22 },
      { x: 2820, y: 455, width: 135, height: 22 },
      { x: 3700, y: 390, width: 135, height: 22 },
    ],
    checkpoints: checkpointTriplet(
      ['library-entry', 'orrery', 'library-shard'],
      [180, 2550, 4580],
      500,
    ),
    sparks: [point('glyph-a', 1510, 290), point('glyph-b', 3020, 335), point('glyph-c', 4470, 350)],
    hazards: [
      hazard('ink-a', 1320, 'day'),
      hazard('ink-b', 2860, 'night'),
      hazard('ink-c', 3850, 'day'),
    ],
    enemies: [
      { id: 'harpy-1', configId: 'mirror-harpy', x: 880, y: 290 },
      { id: 'ink-1', configId: 'ink-sprite', x: 1460, y: 470 },
      { id: 'owl-1', configId: 'echo-owl', x: 2050, y: 230 },
      { id: 'harpy-2', configId: 'mirror-harpy', x: 2860, y: 260 },
      { id: 'ink-2', configId: 'ink-sprite', x: 3550, y: 460 },
      { id: 'owl-2', configId: 'echo-owl', x: 4100, y: 260 },
      { id: 'archivist-echo-boss', configId: 'archivist-echo', x: 4470, y: 300 },
    ],
  },
  'clock-fortress': {
    id: 'clock-fortress',
    index: 4,
    difficulty: 4,
    title: 'Крепость остановленных часов',
    subtitle: 'Осколок IV · Полоса механизмов',
    story: 'Маятники крепости замерли между ударами. Каждый механизм подчиняется своей фазе.',
    objective: 'пройди часовой механизм · чередуй фазы · Сумеречный голем',
    background: 'fortress',
    mechanic: 'clocks',
    phaseDurationMs: 30_000,
    worldWidth: 5100,
    bossId: 'fortress-golem-boss',
    coverZones: [
      { x: 1570, y: 560, width: 160, height: 165 },
      { x: 3660, y: 560, width: 160, height: 165 },
    ],
    platforms: [
      { x: 360, y: 670, width: 720, height: 100 },
      { x: 980, y: 670, width: 360, height: 100 },
      { x: 1510, y: 670, width: 420, height: 100 },
      { x: 2050, y: 670, width: 380, height: 100 },
      { x: 2570, y: 670, width: 420, height: 100 },
      { x: 3110, y: 670, width: 380, height: 100 },
      { x: 3650, y: 670, width: 420, height: 100 },
      { x: 4200, y: 670, width: 400, height: 100 },
      { x: 4810, y: 670, width: 580, height: 100 },
      { x: 610, y: 520, width: 210, height: 26 },
      { x: 1040, y: 405, width: 190, height: 26 },
      { x: 1460, y: 505, width: 190, height: 26 },
      { x: 1950, y: 380, width: 180, height: 26 },
      { x: 2460, y: 500, width: 190, height: 26 },
      { x: 2990, y: 360, width: 180, height: 26 },
      { x: 3510, y: 490, width: 190, height: 26 },
      { x: 4050, y: 350, width: 180, height: 26 },
      { x: 4680, y: 500, width: 260, height: 28 },
    ],
    phasePlatforms: [
      { x: 790, y: 565, width: 125, height: 22 },
      { x: 1270, y: 485, width: 125, height: 22 },
      { x: 1740, y: 455, width: 125, height: 22 },
      { x: 2240, y: 455, width: 125, height: 22 },
      { x: 3260, y: 430, width: 125, height: 22 },
      { x: 4320, y: 420, width: 125, height: 22 },
    ],
    checkpoints: checkpointTriplet(
      ['fortress-gate', 'great-clock', 'fortress-shard'],
      [180, 2570, 4980],
      500,
    ),
    sparks: [
      point('gear-spark-a', 1040, 330),
      point('gear-spark-b', 2990, 285),
      point('gear-spark-c', 4680, 420),
    ],
    hazards: [
      hazard('gear-a', 820, 'day'),
      hazard('gear-b', 1370, 'night'),
      hazard('gear-c', 2250, 'day'),
      hazard('gear-d', 3370, 'night'),
      hazard('gear-e', 4340, 'day'),
    ],
    enemies: [
      { id: 'mite-1', configId: 'clockwork-mite', x: 640, y: 450 },
      { id: 'knight-1', configId: 'eclipse-knight', x: 1320, y: 440 },
      { id: 'wraith-1', configId: 'pendulum-wraith', x: 1900, y: 270 },
      { id: 'mite-2', configId: 'clockwork-mite', x: 2520, y: 460 },
      { id: 'knight-2', configId: 'eclipse-knight', x: 3180, y: 430 },
      { id: 'wraith-2', configId: 'pendulum-wraith', x: 3800, y: 250 },
      { id: 'knight-3', configId: 'eclipse-knight', x: 4380, y: 430 },
      { id: 'fortress-golem-boss', configId: 'fortress-golem', x: 4800, y: 420 },
    ],
  },
  'eclipse-heart': {
    id: 'eclipse-heart',
    index: 5,
    difficulty: 5,
    title: 'Сердце затмения',
    subtitle: 'Финальный осколок · Боевая арена',
    story: 'В центре расколотого Маятника Сумеречник стал Пожирателем Зари. Цикл нужно исцелить.',
    objective: 'переживи стражей · используй обе силы · исцели Маятник',
    background: 'eclipse',
    mechanic: 'boss-rush',
    phaseDurationMs: 26_000,
    worldWidth: 4200,
    bossId: 'dawn-devourer-boss',
    coverZones: [{ x: 2100, y: 560, width: 190, height: 170 }],
    platforms: [
      { x: 500, y: 670, width: 1000, height: 100 },
      { x: 1450, y: 670, width: 760, height: 100 },
      { x: 2600, y: 670, width: 1440, height: 100 },
      { x: 3740, y: 670, width: 840, height: 100 },
      { x: 820, y: 505, width: 250, height: 28 },
      { x: 1320, y: 390, width: 260, height: 28 },
      { x: 1900, y: 500, width: 260, height: 28 },
      { x: 2440, y: 370, width: 280, height: 28 },
      { x: 3020, y: 480, width: 280, height: 28 },
      { x: 3560, y: 350, width: 260, height: 28 },
    ],
    phasePlatforms: [
      { x: 1080, y: 555, width: 130, height: 22 },
      { x: 1650, y: 480, width: 130, height: 22 },
      { x: 2740, y: 440, width: 130, height: 22 },
      { x: 3300, y: 420, width: 130, height: 22 },
    ],
    checkpoints: checkpointTriplet(
      ['tower-entry', 'broken-pendulum', 'restored-pendulum'],
      [180, 2200, 4070],
      500,
    ),
    sparks: [
      point('dawn-spark-a', 1320, 315),
      point('dawn-spark-b', 2600, 360),
      point('dawn-spark-c', 3560, 275),
    ],
    hazards: [
      hazard('eclipse-a', 1040, 'night'),
      hazard('eclipse-b', 1510, 'day'),
      hazard('eclipse-c', 2110, 'night'),
      hazard('eclipse-d', 2800, 'day'),
      hazard('eclipse-e', 3330, 'night'),
      hazard('eclipse-f', 3770, 'day'),
    ],
    enemies: [
      { id: 'fragment-1', configId: 'dawn-fragment', x: 760, y: 270 },
      { id: 'maw-1', configId: 'void-maw', x: 1250, y: 440 },
      { id: 'sentinel-1', configId: 'eclipse-sentinel', x: 1750, y: 260 },
      { id: 'fragment-2', configId: 'dawn-fragment', x: 2180, y: 250 },
      { id: 'maw-2', configId: 'void-maw', x: 2600, y: 430 },
      { id: 'sentinel-2', configId: 'eclipse-sentinel', x: 3020, y: 250 },
      { id: 'fragment-3', configId: 'dawn-fragment', x: 3350, y: 230 },
      { id: 'maw-3', configId: 'void-maw', x: 3620, y: 430 },
      { id: 'dawn-devourer-boss', configId: 'dawn-devourer', x: 3920, y: 390 },
    ],
  },
};

export const CAMPAIGN_LEVEL_ORDER: readonly CampaignLevelId[] = [
  'garden-first-dawn',
  'whispering-forest',
  'sky-library',
  'clock-fortress',
  'eclipse-heart',
];

// ARC-002: fail fast with a readable message on malformed content, instead of silently defaulting
// (see `createLevelContent` below, which used to fall back to `health: 1` for unknown configIds).
validateCampaignContent({
  abilities: {
    abilities: PROTOTYPE_ABILITIES,
    specialAbilities: PROTOTYPE_SPECIAL_ABILITIES,
    supportAbilities: PROTOTYPE_SUPPORT_ABILITIES,
  },
  enemyTypes: { ...PROTOTYPE_MONSTERS, ...STAGE4_ENEMIES, ...STAGE5_ENEMIES },
  levels: CAMPAIGN_LEVELS,
});

export function createLevelContent(levelId: CampaignLevelId): PrototypeContentConfig {
  const level = CAMPAIGN_LEVELS[levelId];
  const enemyTypes = { ...PROTOTYPE_MONSTERS, ...STAGE4_ENEMIES, ...STAGE5_ENEMIES };
  return {
    abilities: PROTOTYPE_ABILITIES,
    supportAbilities: PROTOTYPE_SUPPORT_ABILITIES,
    specialAbilities: PROTOTYPE_SPECIAL_ABILITIES,
    phaseDurationMs: level.phaseDurationMs,
    enemyTypes,
    enemies: level.enemies.map((spawn) => ({
      id: spawn.id,
      configId: spawn.configId,
      health: enemyTypes[spawn.configId]?.health ?? 1,
    })),
  };
}
