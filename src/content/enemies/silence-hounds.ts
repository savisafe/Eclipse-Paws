import type { EnemyConfig } from '@core/index';

// ECLIPSE_PAWS_SCENARIO.md §12, «Сад первой зари» → «Перелом»: гончие Безмолвия — "вытянутые
// существа, собранные из дыма, обрывков тени и пустых масок", не животные. They are the sleep's
// defence constructs, sent to push the cats out of the memory rather than to kill them, so the
// first level's fight is deliberately soft: low contact damage and long, readable telegraphs
// ("атаки имеют долгую и понятную подготовку", "урон снижен").
export const SILENCE_HOUND_CONFIG: EnemyConfig = {
  id: 'silence-hound',
  health: 34,
  contactDamage: 1,
  movement: 'ground',
  speed: 74,
  telegraphMs: 760,
};

// The pack leader that closes the level's fight — same rules, just sturdier, per "сложность
// повышается комбинацией известных правил, а не ростом здоровья противников": it is slower and
// telegraphs even longer instead of simply having a huge health pool.
export const SILENCE_HOUND_ALPHA_CONFIG: EnemyConfig = {
  id: 'silence-hound-alpha',
  health: 64,
  contactDamage: 1,
  movement: 'ground',
  speed: 58,
  telegraphMs: 900,
};

export const SILENCE_ENEMIES: Readonly<Record<string, EnemyConfig>> = {
  [SILENCE_HOUND_CONFIG.id]: SILENCE_HOUND_CONFIG,
  [SILENCE_HOUND_ALPHA_CONFIG.id]: SILENCE_HOUND_ALPHA_CONFIG,
};
