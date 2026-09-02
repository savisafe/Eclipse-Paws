import { describe, expect, it } from 'vitest';
import { CooldownTracker } from '@core/index';

describe('CooldownTracker', () => {
  it('becomes ready after deterministic simulation time', () => {
    const cooldowns = new CooldownTracker();
    cooldowns.start('ability', 1000);
    cooldowns.update(999);
    expect(cooldowns.ready('ability')).toBe(false);
    expect(cooldowns.snapshot().ability).toBe(1);
    cooldowns.update(1);
    expect(cooldowns.ready('ability')).toBe(true);
  });
});
