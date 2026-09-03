import { describe, expect, it } from 'vitest';
import { BossPhaseTracker } from '@core/index';

describe('BossPhaseTracker', () => {
  it('moves monotonically through three health phases', () => {
    const tracker = new BossPhaseTracker(300);
    expect(tracker.update(250)).toEqual({ changed: false, phase: 1 });
    expect(tracker.update(180)).toEqual({ changed: true, phase: 2 });
    expect(tracker.update(80)).toEqual({ changed: true, phase: 3 });
  });
});
