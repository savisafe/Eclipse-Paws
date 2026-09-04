import type { AbilityConfig, CatId } from '@core/index';

export const PROTOTYPE_ABILITIES: Readonly<Record<CatId, AbilityConfig>> = {
  luma: {
    id: 'luma-light-paw',
    owner: 'luma',
    baseDamage: 12,
    cooldownMs: 420,
    effect: 'light-paw',
    range: 135,
  },
  nox: {
    id: 'nox-twilight-claw',
    owner: 'nox',
    baseDamage: 12,
    cooldownMs: 420,
    effect: 'twilight-claw',
    range: 125,
  },
};

export const PROTOTYPE_SPECIAL_ABILITIES: Readonly<Record<CatId, AbilityConfig>> = {
  luma: {
    id: 'luma-sky-lightning',
    owner: 'luma',
    baseDamage: 18,
    cooldownMs: 2600,
    effect: 'lightning',
    range: 520,
  },
  nox: {
    id: 'nox-ground-darkness',
    owner: 'nox',
    baseDamage: 16,
    cooldownMs: 2600,
    effect: 'shadow-spikes',
    range: 280,
  },
};

export const PROTOTYPE_SUPPORT_ABILITIES: Readonly<Record<CatId, AbilityConfig>> = {
  luma: {
    id: 'luma-purring-shield',
    owner: 'luma',
    baseDamage: 0,
    cooldownMs: 8000,
    effect: 'purring-shield',
    range: 180,
  },
  nox: {
    id: 'nox-shadow-decoy',
    owner: 'nox',
    baseDamage: 0,
    cooldownMs: 8000,
    effect: 'shadow-decoy',
    range: 180,
  },
};
