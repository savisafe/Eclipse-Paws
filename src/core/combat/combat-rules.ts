import type { CatId, Phase } from '../models';

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

// ARC-011 (continuation): third pilot extraction — verbatim from
// `platformer-enemy-system.ts`'s private `#resolveStrike`, which decided whether an enemy's
// telegraphed strike actually lands on the target based on distance alone. The buffer (`+24`)
// mirrors the original inline constant exactly.
export function isStrikeHit(distance: number, attackRange: number, hitBuffer = 24): boolean {
  return distance < attackRange + hitBuffer;
}
