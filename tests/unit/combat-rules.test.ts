import { describe, expect, it } from 'vitest';
import {
  DOMINANT_POWER_MODIFIER,
  WEAK_POWER_MODIFIER,
  isStrikeHit,
  powerModifierFor,
  weakCatForPhase,
} from '@core/index';

describe('phase combat rules', () => {
  it('strengthens Luma by day and Nox by night', () => {
    expect(powerModifierFor('luma', 'day')).toBe(DOMINANT_POWER_MODIFIER);
    expect(powerModifierFor('nox', 'night')).toBe(DOMINANT_POWER_MODIFIER);
    expect(powerModifierFor('nox', 'day')).toBe(WEAK_POWER_MODIFIER);
    expect(powerModifierFor('luma', 'night')).toBe(WEAK_POWER_MODIFIER);
  });

  it('identifies the cat enemies should pressure', () => {
    expect(weakCatForPhase('day')).toBe('nox');
    expect(weakCatForPhase('night')).toBe('luma');
  });

  describe('isStrikeHit (ARC-011 continuation)', () => {
    it('hits within the attack range', () => {
      expect(isStrikeHit(50, 100)).toBe(true);
    });

    it('hits within the default 24px buffer past the attack range', () => {
      expect(isStrikeHit(120, 100)).toBe(true);
    });

    it('misses past the attack range plus buffer', () => {
      expect(isStrikeHit(125, 100)).toBe(false);
    });

    it('respects a custom hit buffer', () => {
      expect(isStrikeHit(140, 100, 50)).toBe(true);
      expect(isStrikeHit(151, 100, 50)).toBe(false);
    });
  });
});
