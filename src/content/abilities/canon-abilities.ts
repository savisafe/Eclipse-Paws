import type { AbilityConfig, CatId } from '@core/index';

// Canon ability set of ECLIPSE_PAWS_SCENARIO.md §12. Slot order follows the progression table:
// primary unlocks on level 1, special on 2, support on 3, and the shared Затмение on 5.
// Numbers below are a first balance pass — §15 lists "точные параметры способностей, кулдауны и
// баланс" as still open, so they are expected to move; the names, roles and unlock order are not.

// Оглушающий крик / Теневой наскок.
export const PRIMARY_ABILITIES: Readonly<Record<CatId, AbilityConfig>> = {
  luma: {
    id: 'lumus-stunning-shout',
    name: 'Оглушающий крик',
    owner: 'luma',
    // "Атака не наносит большой урон: её задача — создать безопасное окно" — the shout trades
    // damage for the stun it applies to everyone in range.
    baseDamage: 8,
    cooldownMs: 620,
    effect: 'stunning-shout',
    range: 190,
  },
  nox: {
    id: 'nox-shadow-dash',
    name: 'Теневой наскок',
    owner: 'nox',
    baseDamage: 15,
    cooldownMs: 620,
    effect: 'shadow-dash',
    range: 320,
  },
};

// Луч света / Теневые иглы.
export const SPECIAL_ABILITIES: Readonly<Record<CatId, AbilityConfig>> = {
  luma: {
    id: 'lumus-light-beam',
    name: 'Луч света',
    owner: 'luma',
    baseDamage: 18,
    cooldownMs: 2600,
    effect: 'light-beam',
    range: 520,
  },
  nox: {
    id: 'nox-shadow-needles',
    name: 'Теневые иглы',
    owner: 'nox',
    baseDamage: 16,
    cooldownMs: 2600,
    effect: 'shadow-needles',
    range: 280,
  },
};

// Световой круг / Теневой покров.
export const SUPPORT_ABILITIES: Readonly<Record<CatId, AbilityConfig>> = {
  luma: {
    id: 'lumus-light-circle',
    name: 'Световой круг',
    owner: 'luma',
    baseDamage: 0,
    cooldownMs: 8000,
    effect: 'light-circle',
    range: 180,
  },
  nox: {
    id: 'nox-shadow-veil',
    name: 'Теневой покров',
    owner: 'nox',
    baseDamage: 0,
    cooldownMs: 8000,
    effect: 'shadow-veil',
    range: 180,
  },
};

// Затмение — the shared ability; it belongs to both cats, so it has no single owner slot in the
// per-cat records above.
export const ECLIPSE_ABILITY: AbilityConfig = {
  id: 'eclipse-shared',
  name: 'Затмение',
  owner: 'luma',
  baseDamage: 0,
  cooldownMs: 0,
  effect: 'eclipse',
  range: 0,
};
