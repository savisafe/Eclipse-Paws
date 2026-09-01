import { describe, expect, it } from 'vitest';
import { GameInputState } from '@adapters/input/index';

describe('GameInputState', () => {
  it('keeps movement held and consumes one-shot actions once', () => {
    const input = new GameInputState();

    input.press('move-up');
    input.press('switch-cat');
    input.press('switch-cat');
    input.press('jump');
    input.press('restart-checkpoint');

    expect(input.isPressed('move-up')).toBe(true);
    expect(input.consume('switch-cat')).toBe(true);
    expect(input.consume('switch-cat')).toBe(false);
    expect(input.consume('jump')).toBe(true);
    expect(input.consume('jump')).toBe(false);
    expect(input.consume('restart-checkpoint')).toBe(true);
    expect(input.consume('restart-checkpoint')).toBe(false);

    input.release('move-up');
    input.release('switch-cat');
    expect(input.isPressed('move-up')).toBe(false);
  });
});
