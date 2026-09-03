import type { EnemyConfig } from '@core/index';

function enemy(
  id: string,
  health: number,
  speed: number,
  movement: EnemyConfig['movement'],
  telegraphMs = 520,
): EnemyConfig {
  return { id, health, speed, movement, telegraphMs, contactDamage: 1 };
}

export const STAGE5_ENEMIES: Readonly<Record<string, EnemyConfig>> = {
  'clockwork-mite': enemy('clockwork-mite', 42, 115, 'ground', 300),
  'eclipse-knight': enemy('eclipse-knight', 78, 58, 'ground', 620),
  'pendulum-wraith': enemy('pendulum-wraith', 60, 74, 'flying', 500),
  'fortress-golem': enemy('fortress-golem', 220, 24, 'ground', 920),
  'dawn-fragment': enemy('dawn-fragment', 48, 98, 'flying', 360),
  'void-maw': enemy('void-maw', 92, 66, 'ground', 540),
  'eclipse-sentinel': enemy('eclipse-sentinel', 72, 70, 'flying', 480),
  'dawn-devourer': enemy('dawn-devourer', 360, 34, 'ground', 760),
};
