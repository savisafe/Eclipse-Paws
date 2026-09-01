import type { CatId, Phase } from './models';

export const DOMINANT_POWER_MODIFIER = 1.5;
export const WEAK_POWER_MODIFIER = 0.25;

export function dominantCatForPhase(phase: Phase): CatId {
  return phase === 'day' ? 'luma' : 'nox';
}

export function weakCatForPhase(phase: Phase): CatId {
  return phase === 'day' ? 'nox' : 'luma';
}

export function powerModifierFor(catId: CatId, phase: Phase): number {
  return catId === dominantCatForPhase(phase) ? DOMINANT_POWER_MODIFIER : WEAK_POWER_MODIFIER;
}
