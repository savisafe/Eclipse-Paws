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

export const STAGE4_ENEMIES: Readonly<Record<string, EnemyConfig>> = {
  'thorn-stalker': enemy('thorn-stalker', 38, 105, 'ground', 360),
  'lantern-moth': enemy('lantern-moth', 28, 82, 'flying', 470),
  'elder-spore': enemy('elder-spore', 58, 38, 'ground', 650),
  'great-mushroom': enemy('great-mushroom', 150, 24, 'ground', 900),
  'mirror-harpy': enemy('mirror-harpy', 46, 92, 'flying', 430),
  'ink-sprite': enemy('ink-sprite', 34, 112, 'ground', 320),
  'echo-owl': enemy('echo-owl', 52, 68, 'flying', 580),
  'archivist-echo': enemy('archivist-echo', 180, 30, 'flying', 840),
};
