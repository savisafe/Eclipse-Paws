import type { PrototypeContentConfig } from '@core/index';
import {
  PROTOTYPE_ABILITIES,
  PROTOTYPE_MOBILITY_ABILITIES,
  PROTOTYPE_SPECIAL_ABILITIES,
  PROTOTYPE_SUPPORT_ABILITIES,
} from '../abilities/prototype-abilities';
import { PROTOTYPE_MONSTERS } from '../enemies/prototype-monsters';
import { STAGE4_ENEMIES } from '../enemies/stage4-enemies';

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
  enemies: readonly (LevelPoint & { configId: string })[];
  hazards: readonly (LevelPoint & { activePhase: 'day' | 'night' })[];
  id: CampaignLevelId;
  index: number;
  mechanic: 'flowers' | 'shadow-bridges' | 'constellations' | 'clocks' | 'boss-rush';
  objective: string;
  phasePlatforms: readonly PlatformRect[];
  platforms: readonly PlatformRect[];
  sparks: readonly LevelPoint[];
  story: string;
  subtitle: string;
  title: string;
  worldWidth: number;
}

const ground = (width: number): PlatformRect[] => [
  { x: 350, y: 670, width: 700, height: 100 },
  { x: 1045, y: 670, width: 410, height: 100 },
  { x: 1625, y: 670, width: 550, height: 100 },
  { x: 2170, y: 670, width: 360, height: 100 },
  { x: 2630, y: 670, width: 380, height: 100 },
  { x: 3150, y: 670, width: 500, height: 100 },
  { x: 3650, y: 670, width: 500, height: 100 },
  { x: 4180, y: 670, width: 460, height: 100 },
  { x: width - 390, y: 670, width: 780, height: 100 },
];

const commonPlatforms: PlatformRect[] = [
  { x: 600, y: 545, width: 250, height: 26 },
  { x: 980, y: 435, width: 210, height: 30 },
  { x: 1325, y: 535, width: 180, height: 30 },
  { x: 1640, y: 570, width: 150, height: 24 },
  { x: 1810, y: 520, width: 270, height: 28 },
  { x: 2310, y: 520, width: 230, height: 30 },
  { x: 2780, y: 425, width: 230, height: 30 },
  { x: 3380, y: 510, width: 220, height: 28 },
  { x: 3720, y: 425, width: 220, height: 28 },
  { x: 4100, y: 535, width: 190, height: 26 },
  { x: 4520, y: 455, width: 230, height: 28 },
];

function points(ids: string[], xs: number[], y: number): LevelPoint[] {
  return ids.map((id, index) => ({ id, x: xs[index] ?? 0, y }));
}

function checkpointTriplet(
  ids: readonly [string, string, string],
  xs: readonly [number, number, number],
  y: number,
): [LevelPoint, LevelPoint, LevelPoint] {
  return [
    { id: ids[0], x: xs[0], y },
    { id: ids[1], x: xs[1], y },
    { id: ids[2], x: xs[2], y },
  ];
}

export const CAMPAIGN_LEVELS: Readonly<Record<CampaignLevelId, CampaignLevelDefinition>> = {
  'garden-first-dawn': {
    id: 'garden-first-dawn',
    index: 1,
    title: 'Сад первой зари',
    subtitle: 'Осколок I',
    story: 'День застыл над древним садом. Солнечные цветы помнят путь к первому осколку.',
    objective: 'цветы 1→2→3 [E] · голем · осколок',
    background: 'garden',
    mechanic: 'flowers',
    worldWidth: 5200,
    bossId: 'twilight-golem-2',
    phasePlatforms: [],
    platforms: [...ground(5200), ...commonPlatforms, { x: 4920, y: 535, width: 280, height: 28 }],
    checkpoints: checkpointTriplet(
      ['garden-gate', 'moon-well', 'dawn-shard'],
      [180, 1870, 5050],
      500,
    ),
    sparks: points(['spark-sunrise', 'spark-well', 'spark-ruins'], [650, 2320, 4480], 410),
    hazards: points(['h1', 'h2', 'h3'], [1110, 2670, 4160], 610).map((p, i) => ({
      ...p,
      activePhase: i % 2 === 0 ? 'day' : 'night',
    })),
    enemies: [
      { configId: 'shadefang', id: 'shadefang-1', x: 710, y: 470 },
      { configId: 'light-wisp', id: 'light-wisp-1', x: 1060, y: 315 },
      { configId: 'spore-beast', id: 'spore-beast-1', x: 1480, y: 475 },
      { configId: 'shadefang', id: 'shadefang-2', x: 2140, y: 450 },
      { configId: 'light-wisp', id: 'light-wisp-2', x: 2520, y: 280 },
      { configId: 'twilight-golem', id: 'twilight-golem-1', x: 2960, y: 455 },
      { configId: 'shadefang', id: 'shadefang-3', x: 3500, y: 470 },
      { configId: 'light-wisp', id: 'light-wisp-3', x: 3890, y: 300 },
      { configId: 'spore-beast', id: 'spore-beast-2', x: 4300, y: 480 },
      { configId: 'shadefang', id: 'shadefang-4', x: 4700, y: 460 },
      { configId: 'twilight-golem', id: 'twilight-golem-2', x: 5000, y: 455 },
    ],
  },
  'whispering-forest': {
    id: 'whispering-forest',
    index: 2,
    title: 'Лес шепчущих теней',
    subtitle: 'Осколок II',
    story: 'Светлячки заблудились среди корней. Ночные мосты слышат только шаги Бони.',
    objective: 'провести светлячков · ночные мосты · Великий Гриб',
    background: 'forest',
    mechanic: 'shadow-bridges',
    worldWidth: 5200,
    bossId: 'great-mushroom-boss',
    platforms: [...ground(5200), ...commonPlatforms],
    phasePlatforms: [
      { x: 760, y: 590, width: 130, height: 24 },
      { x: 1960, y: 545, width: 130, height: 24 },
      { x: 2860, y: 555, width: 130, height: 24 },
    ],
    checkpoints: checkpointTriplet(
      ['forest-edge', 'whisper-lantern', 'forest-shard'],
      [180, 2500, 5050],
      500,
    ),
    sparks: points(['firefly-a', 'firefly-b', 'firefly-c'], [900, 2700, 4300], 390),
    hazards: points(['fh1', 'fh2', 'fh3'], [1450, 3250, 4500], 610).map((p, i) => ({
      ...p,
      activePhase: i % 2 === 0 ? 'night' : 'day',
    })),
    enemies: [
      { id: 'thorn-1', configId: 'thorn-stalker', x: 820, y: 470 },
      { id: 'moth-1', configId: 'lantern-moth', x: 1320, y: 320 },
      { id: 'spore-1', configId: 'elder-spore', x: 2050, y: 470 },
      { id: 'thorn-2', configId: 'thorn-stalker', x: 2920, y: 470 },
      { id: 'moth-2', configId: 'lantern-moth', x: 3700, y: 300 },
      { id: 'great-mushroom-boss', configId: 'great-mushroom', x: 4800, y: 440 },
    ],
  },
  'sky-library': {
    id: 'sky-library',
    index: 3,
    title: 'Небесная библиотека',
    subtitle: 'Осколок III',
    story: 'Созвездия исчезли со свода. Зеркала покажут символы, если свет и тень чередуются.',
    objective: 'зеркала [E] · фазовые платформы · Архивариус Эхо',
    background: 'library',
    mechanic: 'constellations',
    worldWidth: 5200,
    bossId: 'archivist-echo-boss',
    platforms: [
      ...ground(5200),
      ...commonPlatforms.map((p, i) => ({ ...p, y: p.y - (i % 3) * 45 })),
    ],
    phasePlatforms: [
      { x: 760, y: 560, width: 140, height: 22 },
      { x: 1960, y: 490, width: 140, height: 22 },
      { x: 2900, y: 520, width: 140, height: 22 },
    ],
    checkpoints: checkpointTriplet(
      ['library-entry', 'orrery', 'library-shard'],
      [180, 2550, 5050],
      500,
    ),
    sparks: points(['glyph-a', 'glyph-b', 'glyph-c'], [1080, 3100, 4550], 350),
    hazards: points(['lh1', 'lh2', 'lh3'], [1550, 3500, 4400], 610).map((p, i) => ({
      ...p,
      activePhase: i % 2 === 0 ? 'day' : 'night',
    })),
    enemies: [
      { id: 'harpy-1', configId: 'mirror-harpy', x: 900, y: 300 },
      { id: 'ink-1', configId: 'ink-sprite', x: 1450, y: 470 },
      { id: 'owl-1', configId: 'echo-owl', x: 2300, y: 300 },
      { id: 'harpy-2', configId: 'mirror-harpy', x: 3250, y: 280 },
      { id: 'ink-2', configId: 'ink-sprite', x: 4000, y: 470 },
      { id: 'archivist-echo-boss', configId: 'archivist-echo', x: 4800, y: 330 },
    ],
  },
  'clock-fortress': {} as CampaignLevelDefinition,
  'eclipse-heart': {} as CampaignLevelDefinition,
};

export const CAMPAIGN_LEVEL_ORDER: readonly CampaignLevelId[] = [
  'garden-first-dawn',
  'whispering-forest',
  'sky-library',
  'clock-fortress',
  'eclipse-heart',
];

export function createLevelContent(levelId: CampaignLevelId): PrototypeContentConfig {
  const level = CAMPAIGN_LEVELS[levelId];
  const enemyTypes = { ...PROTOTYPE_MONSTERS, ...STAGE4_ENEMIES };
  return {
    abilities: PROTOTYPE_ABILITIES,
    mobilityAbilities: PROTOTYPE_MOBILITY_ABILITIES,
    supportAbilities: PROTOTYPE_SUPPORT_ABILITIES,
    specialAbilities: PROTOTYPE_SPECIAL_ABILITIES,
    phaseDurationMs: 30_000,
    enemyTypes,
    enemies: level.enemies.map((spawn) => ({
      id: spawn.id,
      configId: spawn.configId,
      health: enemyTypes[spawn.configId]?.health ?? 1,
    })),
  };
}
