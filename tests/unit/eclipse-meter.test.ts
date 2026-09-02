import { describe, expect, it } from 'vitest';
import { EclipseMeter } from '@core/index';

describe('EclipseMeter', () => {
  it('clamps gains and rejects unaffordable spends', () => {
    const meter = new EclipseMeter();
    expect(meter.spend(50)).toBe(false);
    meter.gain(140);
    expect(meter.current).toBe(100);
    expect(meter.spend(50)).toBe(true);
    expect(meter.current).toBe(50);
  });
});
