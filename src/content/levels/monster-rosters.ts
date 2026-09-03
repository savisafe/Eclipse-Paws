export const LEVEL_MONSTER_ROSTERS = {
  'garden-first-dawn': ['shadefang', 'spore-beast', 'light-wisp'],
  'whispering-forest': ['thorn-stalker', 'lantern-moth', 'elder-spore'],
  'sky-library': ['mirror-harpy', 'ink-sprite', 'echo-owl'],
  'clock-fortress': ['clockwork-mite', 'eclipse-knight', 'pendulum-wraith', 'fortress-golem'],
  'eclipse-heart': ['dawn-fragment', 'void-maw', 'eclipse-sentinel', 'dawn-devourer'],
} as const;

export type LevelRosterId = keyof typeof LEVEL_MONSTER_ROSTERS;
