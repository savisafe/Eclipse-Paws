import type { PrototypeContentConfig } from '@core/index';
import {
  PRIMARY_ABILITIES,
  SPECIAL_ABILITIES,
  SUPPORT_ABILITIES,
} from '../abilities/canon-abilities';
import { PROTOTYPE_MONSTERS } from '../enemies/prototype-monsters';
import { SILENCE_ENEMIES } from '../enemies/silence-hounds';
import { STAGE4_ENEMIES } from '../enemies/stage4-enemies';
import { STAGE5_ENEMIES } from '../enemies/stage5-enemies';
import { validateCampaignContent } from '../schema';

// Level roster matches the seven Eclipse Paws locations from `ECLIPSE_PAWS_SCENARIO.md` /
// `src/adapters/phaser/dream-environment-manifest.ts`. Geometry, enemy placement and mechanic
// wiring below are an intentional **graybox pass** (see the level production pipeline in
// `ECLIPSE_PAWS_RECONSTRUCTION_PLAN.md` §6): five of the seven levels reuse the previous 5-level
// prototype's proven, already-tested geometry/enemy rosters/mechanics wholesale (only relabeled to
// the new id/title), and the two new slots (`forgotten-smiles-carnival`, `last-star-field`) get
// freshly authored placeholder geometry using existing, already-wired enemy configs — nothing here
// references an enemy or mechanic that doesn't already have working atlas frames / adapter code,
// so the game stays fully playable end-to-end. Real per-level content (unique rooms, the new
// Silence-family enemies, actual scripted dialogue) is separate future LV1-NNN..LV7-NNN work.
export type CampaignLevelId =
  | 'garden-first-dawn'
  | 'whispering-lanterns'
  | 'midday-clock-city'
  | 'unread-letters-sea'
  | 'forgotten-smiles-carnival'
  | 'last-star-field'
  | 'eternal-sleep-heart';

// Only finished levels belong here. The remaining campaign definitions stay available as
// development content, but the application must not expose or launch them for players yet.
export const PLAYABLE_CAMPAIGN_LEVELS: readonly CampaignLevelId[] = ['garden-first-dawn'];

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
  background:
    | 'garden'
    | 'forest'
    | 'library'
    | 'fortress'
    | 'eclipse'
    | 'city'
    | 'sea'
    | 'carnival'
    | 'field'
    | 'heart';
  bossId: string;
  checkpoints: readonly [LevelPoint, LevelPoint, LevelPoint];
  coverZones: readonly PlatformRect[];
  difficulty: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** Enemies that start hidden and are released by the level's own script. */
  dormantEnemyIds?: readonly string[];
  enemies: readonly (LevelPoint & { configId: string })[];
  hazards: readonly (LevelPoint & { activePhase: 'day' | 'night' })[];
  id: CampaignLevelId;
  index: number;
  mechanic: 'flowers' | 'shadow-bridges' | 'constellations' | 'clocks' | 'boss-rush';
  objective: string;
  phaseDurationMs: number;
  /** 'story' levels change day/night only when their script says so (§12). */
  phaseMode?: 'timer' | 'story';
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
  // Level 1 is the one level the scenario calls approved (§12, «Сад первой зари»), so its
  // geometry is authored rather than graybox: a single continuous garden floor whose height
  // changes from zone to zone, without elevated platforms or bottomless pits. The scenario
  // bottomless pits — the scenario explicitly forbids "набор прямоугольных платформ над
  // одинаковыми пропастями" here and asks for water, hedges and height as the obstacles instead.
  // Zone boundaries, props and inhabitants live in `garden-first-dawn-scene.ts`.
  'garden-first-dawn': {
    id: 'garden-first-dawn',
    index: 1,
    difficulty: 1,
    title: 'Сад первой зари',
    subtitle: 'Глава I · Обучение',
    story:
      'Сад первой зари застыл во вневременном раннем утре. Лумус и Нокс ищут первый след Элиаса.',
    objective: 'найди Садовника · разбуди солнечные часы · переживи первую ночь сада',
    background: 'garden',
    mechanic: 'flowers',
    // Nightfall here is a story event the sundial triggers, never a timer (§12). The duration is
    // kept only because the phase clock still renders it; `phaseMode` is what disables the cycle.
    phaseMode: 'story',
    phaseDurationMs: 45_000,
    worldWidth: 5200,
    bossId: 'hound-alpha',
    // The hounds of Silence only appear at the level's turning point ("Только теперь появляются
    // первые противники"), so every enemy here starts dormant and the story script wakes them.
    dormantEnemyIds: ['hound-1', 'hound-2', 'hound-3', 'hound-alpha'],
    // Level 1 has no crouch-in-cover spots: hiding here is Теневой покров (§12), and the generic
    // purple cover ellipse only cluttered the painted garden.
    coverZones: [],
    platforms: [
      // Continuous garden floor, zone by zone (§12 «Ландшафт и построение маршрута»).
      { x: 380, y: 670, width: 780, height: 100 },
      { x: 1160, y: 645, width: 800, height: 110 },
      { x: 1960, y: 686, width: 800, height: 110 },
      { x: 2710, y: 700, width: 700, height: 120 },
      { x: 3410, y: 670, width: 700, height: 100 },
      { x: 4110, y: 650, width: 700, height: 110 },
      { x: 4830, y: 670, width: 760, height: 100 },
    ],
    phasePlatforms: [],
    // The middle checkpoint sits immediately before the turning point, as §14 «Сложность и
    // честность» requires ("контрольная точка ставится перед сложным испытанием"); the last one
    // is the gate the level ends at.
    checkpoints: checkpointTriplet(
      ['awakening-meadow', 'night-path', 'memory-gate'],
      [180, 4480, 5060],
      500,
    ),
    sparks: [
      point('spark-dew', 700, 550),
      point('spark-greenhouse', 2500, 570),
      point('spark-sundial', 4250, 525),
    ],
    hazards: [],
    enemies: [
      { configId: 'silence-hound', id: 'hound-1', x: 4560, y: 560 },
      { configId: 'silence-hound', id: 'hound-2', x: 4780, y: 560 },
      { configId: 'silence-hound', id: 'hound-3', x: 4960, y: 560 },
      { configId: 'silence-hound-alpha', id: 'hound-alpha', x: 5060, y: 550 },
    ],
  },
  'whispering-lanterns': {
    id: 'whispering-lanterns',
    index: 2,
    difficulty: 2,
    title: 'Лес шепчущих фонарей',
    subtitle: 'Глава II · Черновой уровень (graybox)',
    story:
      'Плейсхолдер: геометрия и противники перенесены из прежней версии без изменений. Фон и ' +
      'название уже соответствуют новому сценарию — лес фонарей и обсерватория.',
    objective: 'выбери тропу · пройди лес · Великий Гриб',
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
      ['forest-edge', 'whisper-lantern', 'forest-goal'],
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
  'midday-clock-city': {
    id: 'midday-clock-city',
    index: 3,
    difficulty: 3,
    title: 'Город тысячи полуденных часов',
    subtitle: 'Глава III · Черновой уровень (graybox)',
    story:
      'Плейсхолдер: геометрия и противники перенесены из прежней версии без изменений. Фон и ' +
      'название уже соответствуют новому сценарию — спешащий город с центральной часовой башней.',
    objective: 'пройди часовой механизм · чередуй фазы · Сумеречный голем',
    background: 'city',
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
      ['city-gate', 'great-clock', 'city-goal'],
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
  'unread-letters-sea': {
    id: 'unread-letters-sea',
    index: 4,
    difficulty: 4,
    title: 'Море непрочитанных писем',
    subtitle: 'Глава IV · Черновой уровень (graybox)',
    story:
      'Плейсхолдер: геометрия и противники перенесены из прежней версии без изменений. Фон и ' +
      'название уже соответствуют новому сценарию — бумажное море и погасший маяк.',
    objective: 'зажги три зеркала [E] · меняй фазу · Архивариус Эхо',
    background: 'sea',
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
    checkpoints: checkpointTriplet(['sea-shore', 'sea-orrery', 'sea-goal'], [180, 2550, 4580], 500),
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
  'forgotten-smiles-carnival': {
    id: 'forgotten-smiles-carnival',
    index: 5,
    difficulty: 5,
    title: 'Карнавал забытых улыбок',
    subtitle: 'Глава V · Черновой уровень (graybox)',
    story:
      'Плейсхолдер: новая, но пока черновая геометрия и временный набор противников. Фон и ' +
      'название уже соответствуют новому сценарию — вечный праздник, который повторяется по кругу.',
    objective: 'пройди по кругу карнавала · собери огни · Маэстро Улыбка',
    background: 'carnival',
    mechanic: 'shadow-bridges',
    phaseDurationMs: 32_000,
    worldWidth: 3900,
    bossId: 'carnival-golem-1',
    coverZones: [{ x: 1900, y: 560, width: 200, height: 160 }],
    platforms: [
      { x: 480, y: 670, width: 960, height: 100 },
      { x: 1350, y: 670, width: 560, height: 100 },
      { x: 2100, y: 670, width: 760, height: 100 },
      { x: 2900, y: 670, width: 680, height: 100 },
      { x: 3550, y: 670, width: 400, height: 100 },
      { x: 640, y: 520, width: 260, height: 28 },
      { x: 1150, y: 430, width: 240, height: 28 },
      { x: 1700, y: 500, width: 260, height: 28 },
      { x: 2350, y: 400, width: 260, height: 28 },
      { x: 3000, y: 470, width: 260, height: 28 },
    ],
    phasePlatforms: [
      { x: 900, y: 380, width: 140, height: 22 },
      { x: 2650, y: 350, width: 140, height: 22 },
    ],
    checkpoints: checkpointTriplet(
      ['carnival-gate', 'carousel', 'carnival-goal'],
      [180, 1900, 3800],
      500,
    ),
    sparks: [
      point('confetti-a', 900, 340),
      point('confetti-b', 2350, 350),
      point('confetti-c', 3200, 400),
    ],
    hazards: [hazard('mirror-maze', 2450, 'night')],
    enemies: [
      { configId: 'shadefang', id: 'shadefang-carnival-1', x: 780, y: 460 },
      { configId: 'light-wisp', id: 'light-wisp-carnival-1', x: 1450, y: 320 },
      { configId: 'spore-beast', id: 'spore-beast-carnival-1', x: 2450, y: 460 },
      { configId: 'twilight-golem', id: 'carnival-golem-1', x: 3450, y: 450 },
    ],
  },
  'last-star-field': {
    id: 'last-star-field',
    index: 6,
    difficulty: 6,
    title: 'Поле последней звезды',
    subtitle: 'Глава VI · Черновой уровень (graybox)',
    story:
      'Плейсхолдер: новая, но пока черновая геометрия и временный набор противников. Фон и ' +
      'название уже соответствуют новому сценарию — луг детства и тихое послевоенное поле.',
    objective: 'пройди луг · собери созвездие · воздушный змей',
    background: 'field',
    mechanic: 'clocks',
    phaseDurationMs: 28_000,
    worldWidth: 4100,
    bossId: 'field-mushroom-boss',
    coverZones: [
      { x: 1500, y: 560, width: 200, height: 160 },
      { x: 3100, y: 560, width: 200, height: 160 },
    ],
    platforms: [
      { x: 460, y: 670, width: 920, height: 100 },
      { x: 1300, y: 670, width: 560, height: 100 },
      { x: 2000, y: 670, width: 680, height: 100 },
      { x: 2800, y: 670, width: 640, height: 100 },
      { x: 3500, y: 670, width: 460, height: 100 },
      { x: 620, y: 500, width: 260, height: 28 },
      { x: 1150, y: 400, width: 250, height: 28 },
      { x: 1750, y: 320, width: 260, height: 28 },
      { x: 2400, y: 450, width: 280, height: 28 },
      { x: 3050, y: 350, width: 270, height: 28 },
      { x: 3650, y: 500, width: 300, height: 28 },
    ],
    phasePlatforms: [
      { x: 950, y: 320, width: 150, height: 24 },
      { x: 2150, y: 280, width: 150, height: 24 },
      { x: 3350, y: 300, width: 150, height: 24 },
    ],
    checkpoints: checkpointTriplet(
      ['field-hill', 'lone-tree', 'field-goal'],
      [180, 2050, 4000],
      500,
    ),
    sparks: [point('star-a', 950, 260), point('star-b', 2150, 220), point('star-c', 3350, 250)],
    hazards: [hazard('trench-a', 1650, 'night'), hazard('trench-b', 3200, 'day')],
    enemies: [
      { id: 'thorn-field-1', configId: 'thorn-stalker', x: 780, y: 460 },
      { id: 'moth-field-1', configId: 'lantern-moth', x: 1500, y: 270 },
      { id: 'spore-field-1', configId: 'elder-spore', x: 2200, y: 460 },
      { id: 'thorn-field-2', configId: 'thorn-stalker', x: 2900, y: 450 },
      { id: 'field-mushroom-boss', configId: 'great-mushroom', x: 3800, y: 430 },
    ],
  },
  'eternal-sleep-heart': {
    id: 'eternal-sleep-heart',
    index: 7,
    difficulty: 7,
    title: 'Сердце вечного сна',
    subtitle: 'Глава VII · Финал · Черновой уровень (graybox)',
    story:
      'Плейсхолдер: геометрия и противники перенесены из прежней версии без изменений. Фон и ' +
      'название уже соответствуют новому сценарию — дом Сомниума и дверь в реальность.',
    objective: 'защити Элиаса · используй обе силы · разбей замки Стража',
    background: 'heart',
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
      ['heart-entry', 'broken-door', 'heart-goal'],
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
  'whispering-lanterns',
  'midday-clock-city',
  'unread-letters-sea',
  'forgotten-smiles-carnival',
  'last-star-field',
  'eternal-sleep-heart',
];

// ARC-014: fail fast with a readable message on malformed content, instead of silently defaulting
// (see `createLevelContent` below, which used to fall back to `health: 1` for unknown configIds).
validateCampaignContent({
  abilities: {
    abilities: PRIMARY_ABILITIES,
    specialAbilities: SPECIAL_ABILITIES,
    supportAbilities: SUPPORT_ABILITIES,
  },
  enemyTypes: { ...PROTOTYPE_MONSTERS, ...SILENCE_ENEMIES, ...STAGE4_ENEMIES, ...STAGE5_ENEMIES },
  levels: CAMPAIGN_LEVELS,
});

export function createLevelContent(levelId: CampaignLevelId): PrototypeContentConfig {
  const level = CAMPAIGN_LEVELS[levelId];
  const enemyTypes = {
    ...PROTOTYPE_MONSTERS,
    ...SILENCE_ENEMIES,
    ...STAGE4_ENEMIES,
    ...STAGE5_ENEMIES,
  };
  return {
    abilities: PRIMARY_ABILITIES,
    supportAbilities: SUPPORT_ABILITIES,
    specialAbilities: SPECIAL_ABILITIES,
    initialCheckpointId: level.checkpoints[0].id,
    phaseDurationMs: level.phaseDurationMs,
    phaseMode: level.phaseMode ?? 'timer',
    enemyTypes,
    enemies: level.enemies.map((spawn) => ({
      id: spawn.id,
      configId: spawn.configId,
      health: enemyTypes[spawn.configId]?.health ?? 1,
    })),
  };
}
