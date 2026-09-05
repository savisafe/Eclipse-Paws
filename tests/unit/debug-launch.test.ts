import { afterEach, describe, expect, it, vi } from 'vitest';
import { readDebugLaunchParams, shouldAutoStartDebugLaunch } from '@ui/debug-launch';

function setSearch(search: string): void {
  window.history.replaceState(null, '', search);
}

const NO_FLAGS = {
  checkpointId: null,
  heroLevel: null,
  level: null,
  phaseDurationMs: null,
  startNearCombat: false,
  startNearFinish: false,
} as const;

describe('debug launch params (ARC-015)', () => {
  afterEach(() => {
    setSearch('');
    vi.unstubAllEnvs();
  });

  it('returns every flag disabled with no query string', () => {
    setSearch('');
    const params = readDebugLaunchParams();
    expect(params).toEqual({
      checkpointId: null,
      heroLevel: null,
      level: null,
      phaseDurationMs: null,
      startNearCombat: false,
      startNearFinish: false,
    });
    expect(shouldAutoStartDebugLaunch(params)).toBe(false);
  });

  it('parses a valid level, checkpoint, heroLevel and phaseDurationMs', () => {
    setSearch('?level=whispering-forest&checkpoint=forest-shard&heroLevel=3&phaseDurationMs=500');
    const params = readDebugLaunchParams();
    expect(params.level).toBe('whispering-forest');
    expect(params.checkpointId).toBe('forest-shard');
    expect(params.heroLevel).toBe(3);
    expect(params.phaseDurationMs).toBe(500);
    expect(shouldAutoStartDebugLaunch(params)).toBe(true);
  });

  it('ignores a level id that does not exist in the campaign order', () => {
    setSearch('?level=not-a-real-level');
    expect(readDebugLaunchParams().level).toBeNull();
  });

  it('ignores a non-integer or sub-1 heroLevel', () => {
    setSearch('?heroLevel=abc');
    expect(readDebugLaunchParams().heroLevel).toBeNull();
    setSearch('?heroLevel=0');
    expect(readDebugLaunchParams().heroLevel).toBeNull();
  });

  it('ignores a phaseDurationMs below the 100ms floor', () => {
    setSearch('?phaseDurationMs=50');
    expect(readDebugLaunchParams().phaseDurationMs).toBeNull();
  });

  it('reads startNearCombat/startNearFinish as plain presence flags', () => {
    setSearch('?startNearCombat');
    expect(readDebugLaunchParams()).toMatchObject({
      startNearCombat: true,
      startNearFinish: false,
    });
    setSearch('?startNearFinish');
    expect(readDebugLaunchParams()).toMatchObject({
      startNearCombat: false,
      startNearFinish: true,
    });
  });

  describe('shouldAutoStartDebugLaunch', () => {
    it('is true when a level or checkpoint is requested', () => {
      expect(shouldAutoStartDebugLaunch({ ...NO_FLAGS, level: 'whispering-forest' })).toBe(true);
      expect(shouldAutoStartDebugLaunch({ ...NO_FLAGS, checkpointId: 'forest-shard' })).toBe(true);
    });

    it('is false for heroLevel/phaseDurationMs/startNear* alone (regression guard)', () => {
      // These flags are meant to be combined with a manual "Новая игра" → "Начать уровень" click,
      // exactly like tests/e2e/boot-menu.spec.ts does — auto-starting on them broke every one of
      // those e2e tests (they never reached a clickable "Новая игра" button).
      expect(shouldAutoStartDebugLaunch({ ...NO_FLAGS, heroLevel: 3 })).toBe(false);
      expect(shouldAutoStartDebugLaunch({ ...NO_FLAGS, phaseDurationMs: 500 })).toBe(false);
      expect(shouldAutoStartDebugLaunch({ ...NO_FLAGS, startNearCombat: true })).toBe(false);
      expect(shouldAutoStartDebugLaunch({ ...NO_FLAGS, startNearFinish: true })).toBe(false);
    });
  });
});
