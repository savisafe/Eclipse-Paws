import type { PrototypeContentConfig } from '@core/index';
import {
  PRIMARY_ABILITIES,
  SPECIAL_ABILITIES,
  SUPPORT_ABILITIES,
} from '../abilities/canon-abilities';
import { PROTOTYPE_MONSTERS } from '../enemies/prototype-monsters';
import type { LevelPoint } from './campaign-levels';

export type ArenaPoint = LevelPoint;

// A small standalone arena used to exercise the rules layer (see tests/unit/game-session.test.ts).
// It deliberately does NOT derive from a campaign level any more: level 1 is authored content that
// changes with the scenario (its enemies are now the hounds of Silence, and its day/night no
// longer runs on a timer), and rule tests should not have to be rewritten every time a designer
// moves a spawn point.
export const PROTOTYPE_SPAWNS = {
  cats: {
    luma: { x: 220, y: 500 },
    nox: { x: 140, y: 500 },
  },
  checkpoints: [
    { id: 'arena-start', x: 180, y: 500 },
    { id: 'arena-middle', x: 2050, y: 500 },
    { id: 'arena-finish', x: 3500, y: 500 },
  ],
  enemies: [
    { configId: 'shadefang', id: 'shadefang-1', x: 720, y: 470 },
    { configId: 'light-wisp', id: 'light-wisp-1', x: 1320, y: 315 },
    { configId: 'spore-beast', id: 'spore-beast-1', x: 2450, y: 470 },
    { configId: 'twilight-golem', id: 'twilight-golem-1', x: 3340, y: 445 },
  ],
} as const;

export const PROTOTYPE_CONTENT: PrototypeContentConfig = {
  abilities: PRIMARY_ABILITIES,
  specialAbilities: SPECIAL_ABILITIES,
  supportAbilities: SUPPORT_ABILITIES,
  initialCheckpointId: 'arena-start',
  phaseDurationMs: 45_000,
  phaseMode: 'timer',
  enemyTypes: PROTOTYPE_MONSTERS,
  enemies: PROTOTYPE_SPAWNS.enemies.map((spawn) => ({
    id: spawn.id,
    configId: spawn.configId,
    health: PROTOTYPE_MONSTERS[spawn.configId]!.health,
  })),
};
