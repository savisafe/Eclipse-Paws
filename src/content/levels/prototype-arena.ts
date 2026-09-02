import type { PrototypeContentConfig } from '@core/index';
import {
  PROTOTYPE_ABILITIES,
  PROTOTYPE_MOBILITY_ABILITIES,
  PROTOTYPE_SPECIAL_ABILITIES,
  PROTOTYPE_SUPPORT_ABILITIES,
} from '../abilities/prototype-abilities';
import { PROTOTYPE_MONSTERS } from '../enemies/prototype-monsters';

export interface ArenaPoint {
  id: string;
  x: number;
  y: number;
}

export const PROTOTYPE_SPAWNS = {
  cats: {
    luma: { x: 220, y: 500 },
    nox: { x: 140, y: 500 },
  },
  checkpoints: [
    { id: 'garden-gate', x: 180, y: 520 },
    { id: 'moon-well', x: 1870, y: 455 },
    { id: 'dawn-shard', x: 5050, y: 500 },
  ],
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
} as const;

export const PROTOTYPE_CONTENT: PrototypeContentConfig = {
  abilities: PROTOTYPE_ABILITIES,
  mobilityAbilities: PROTOTYPE_MOBILITY_ABILITIES,
  specialAbilities: PROTOTYPE_SPECIAL_ABILITIES,
  supportAbilities: PROTOTYPE_SUPPORT_ABILITIES,
  phaseDurationMs: 30_000,
  enemyTypes: PROTOTYPE_MONSTERS,
  enemies: PROTOTYPE_SPAWNS.enemies.map((enemy) => ({
    configId: enemy.configId,
    health: PROTOTYPE_MONSTERS[enemy.configId]?.health ?? 1,
    id: enemy.id,
  })),
};
