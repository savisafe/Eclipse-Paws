import { describe, expect, it } from 'vitest';
import { PhaseCycle } from '@core/index';

describe('PhaseCycle', () => {
  it('changes automatically every 30 seconds independent of frame chunks', () => {
    const cycle = new PhaseCycle(30_000);

    for (let frame = 0; frame < 1_799; frame += 1) cycle.advance(1000 / 60);
    expect(cycle.phase).toBe('day');

    const result = cycle.advance(1000 / 60);
    expect(result).toEqual({ changed: true, phase: 'night' });
    expect(cycle.remainingMs).toBeCloseTo(30_000, 5);
  });

  it('handles a delayed simulation update deterministically', () => {
    const cycle = new PhaseCycle(30_000);

    expect(cycle.advance(75_000)).toEqual({ changed: true, phase: 'day' });
    expect(cycle.remainingMs).toBe(15_000);
  });
});
