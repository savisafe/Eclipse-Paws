import { describe, expect, it } from 'vitest';
import { AppStateMachine, InvalidAppTransitionError } from '@core/index';

describe('AppStateMachine', () => {
  it('moves through the boot and playable flow', () => {
    const machine = new AppStateMachine();

    expect(machine.state).toBe('boot');
    expect(machine.transition('main-menu')).toBe('main-menu');
    expect(machine.transition('loading-level')).toBe('loading-level');
    expect(machine.transition('playing')).toBe('playing');
    expect(machine.transition('level-result')).toBe('level-result');
    expect(machine.transition('credits')).toBe('credits');
    expect(machine.transition('main-menu')).toBe('main-menu');
    expect(machine.transition('loading-level')).toBe('loading-level');
    expect(machine.transition('playing')).toBe('playing');
    expect(machine.transition('paused')).toBe('paused');
    expect(machine.transition('playing')).toBe('playing');
  });

  it('rejects impossible and repeated transitions without changing state', () => {
    const machine = new AppStateMachine();

    expect(() => machine.transition('playing')).toThrow(InvalidAppTransitionError);
    expect(machine.state).toBe('boot');

    machine.transition('main-menu');
    expect(() => machine.transition('main-menu')).toThrow('main-menu -> main-menu');
    expect(machine.state).toBe('main-menu');
  });

  it('routes a new game through the prologue before gameplay (COM-010A)', () => {
    const machine = new AppStateMachine();
    machine.transition('main-menu');

    expect(machine.transition('prologue')).toBe('prologue');
    expect(machine.transition('loading-level')).toBe('loading-level');
    expect(machine.transition('playing')).toBe('playing');
  });

  it('routes the ending through the epilogue before credits', () => {
    const machine = new AppStateMachine();
    machine.transition('main-menu');
    machine.transition('loading-level');
    machine.transition('playing');
    machine.transition('level-result');

    expect(machine.transition('epilogue')).toBe('epilogue');
    expect(machine.transition('credits')).toBe('credits');
  });

  it('allows returning to the menu from the prologue or the epilogue', () => {
    const prologueMachine = new AppStateMachine();
    prologueMachine.transition('main-menu');
    prologueMachine.transition('prologue');
    expect(prologueMachine.transition('main-menu')).toBe('main-menu');

    const epilogueMachine = new AppStateMachine('level-result');
    epilogueMachine.transition('epilogue');
    expect(epilogueMachine.transition('main-menu')).toBe('main-menu');
  });
});
