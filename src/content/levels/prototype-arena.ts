import { CAMPAIGN_LEVELS, createLevelContent, type LevelPoint } from './campaign-levels';

export type ArenaPoint = LevelPoint;

export const PROTOTYPE_SPAWNS = {
  cats: {
    luma: { x: 220, y: 500 },
    nox: { x: 140, y: 500 },
  },
  checkpoints: CAMPAIGN_LEVELS['garden-first-dawn'].checkpoints,
  enemies: CAMPAIGN_LEVELS['garden-first-dawn'].enemies,
} as const;

export const PROTOTYPE_CONTENT = createLevelContent('garden-first-dawn');
