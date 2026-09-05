// NOTE: exported but currently unconsumed anywhere in the codebase (see
// docs/AUDITS/KNOWN_ISSUES.md #2) — likely scaffolding for a future bestiary screen. Kept in sync
// with `CAMPAIGN_LEVELS` enemy rosters so it doesn't silently rot, but it is not a source of truth
// for gameplay.
export const LEVEL_MONSTER_ROSTERS = {
  'garden-first-dawn': ['shadefang', 'spore-beast', 'light-wisp'],
  'whispering-lanterns': ['thorn-stalker', 'lantern-moth', 'elder-spore'],
  'midday-clock-city': ['clockwork-mite', 'eclipse-knight', 'pendulum-wraith', 'fortress-golem'],
  'unread-letters-sea': ['mirror-harpy', 'ink-sprite', 'echo-owl'],
  'forgotten-smiles-carnival': ['shadefang', 'spore-beast', 'light-wisp'],
  'last-star-field': ['thorn-stalker', 'lantern-moth', 'elder-spore'],
  'eternal-sleep-heart': ['dawn-fragment', 'void-maw', 'eclipse-sentinel', 'dawn-devourer'],
} as const;

export type LevelRosterId = keyof typeof LEVEL_MONSTER_ROSTERS;
