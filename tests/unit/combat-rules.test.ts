import { describe, expect, it } from 'vitest';
import {
  DOMINANT_POWER_MODIFIER,
  WEAK_POWER_MODIFIER,
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
});
