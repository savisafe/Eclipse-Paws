import type { EnemyConfig } from '@core/index';
import { SHADEFANG_CONFIG } from './shadefang';

export const SPORE_BEAST_CONFIG: EnemyConfig = {
  id: 'spore-beast',
  health: 48,
  contactDamage: 1,
  movement: 'ground',
  speed: 42,
  telegraphMs: 620,
};

export const LIGHT_WISP_CONFIG: EnemyConfig = {
  id: 'light-wisp',
  health: 24,
  contactDamage: 1,
  movement: 'flying',
  speed: 76,
  telegraphMs: 480,
};

export const TWILIGHT_GOLEM_CONFIG: EnemyConfig = {
  id: 'twilight-golem',
  health: 120,
  contactDamage: 1,
  movement: 'ground',
  speed: 28,
  telegraphMs: 820,
};

export const PROTOTYPE_MONSTERS: Readonly<Record<string, EnemyConfig>> = {
  [SHADEFANG_CONFIG.id]: SHADEFANG_CONFIG,
  [SPORE_BEAST_CONFIG.id]: SPORE_BEAST_CONFIG,
  [LIGHT_WISP_CONFIG.id]: LIGHT_WISP_CONFIG,
  [TWILIGHT_GOLEM_CONFIG.id]: TWILIGHT_GOLEM_CONFIG,
};
