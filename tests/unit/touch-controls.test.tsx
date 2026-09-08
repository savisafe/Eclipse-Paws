import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameInputState } from '@adapters/input/index';
import { TouchControls } from '@ui/components/TouchControls';

// jsdom has no Pointer Events, so the deck's own contract is asserted against events it builds
// itself. `pointerId` is what the deck matches on, so it has to survive the trip.
function pointerEvent(type: string, pointerId: number): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'pointerId', { value: pointerId });
  return event;
}

function renderDeck() {
  const inputState = new GameInputState();
  render(<TouchControls inputState={inputState} />);
  return { inputState, right: screen.getByRole('button', { name: 'Двигаться вправо' }) };
}

describe('TouchControls', () => {
  afterEach(cleanup);

  it('holds the action for as long as the finger is down', () => {
    const { inputState, right } = renderDeck();

    fireEvent(right, pointerEvent('pointerdown', 1));
    expect(inputState.isPressed('move-right')).toBe(true);
    expect(right).toHaveAttribute('data-pressed', 'true');

    fireEvent(right, pointerEvent('pointerup', 1));
    expect(inputState.isPressed('move-right')).toBe(false);
    expect(right).not.toHaveAttribute('data-pressed');
  });

  // The regression behind "управление не работает, персонажи не двигаются": WebKit captures a
  // touch pointer implicitly and answers the redundant explicit request by handing the capture
  // straight back, so a `lostpointercapture` handler released the button in the same tick it was
  // pressed and the cat never moved. Only a real end of the gesture may end a press.
  it('keeps the action held when the browser hands the pointer capture back', () => {
    const { inputState, right } = renderDeck();

    fireEvent(right, pointerEvent('pointerdown', 1));
    fireEvent(right, pointerEvent('gotpointercapture', 1));
    fireEvent(right, pointerEvent('lostpointercapture', 1));

    expect(inputState.isPressed('move-right')).toBe(true);
  });

  it('still presses when the browser refuses the pointer capture', () => {
    const { inputState, right } = renderDeck();
    right.setPointerCapture = () => {
      throw new DOMException('no such pointer', 'NotFoundError');
    };

    fireEvent(right, pointerEvent('pointerdown', 1));

    expect(inputState.isPressed('move-right')).toBe(true);
  });

  it('ends the press when the gesture ends away from the button', () => {
    const { inputState, right } = renderDeck();

    fireEvent(right, pointerEvent('pointerdown', 4));
    window.dispatchEvent(pointerEvent('pointerup', 4));

    expect(inputState.isPressed('move-right')).toBe(false);
  });

  it('ends the press when the system cancels the pointer', () => {
    const { inputState, right } = renderDeck();

    fireEvent(right, pointerEvent('pointerdown', 4));
    window.dispatchEvent(pointerEvent('pointercancel', 4));

    expect(inputState.isPressed('move-right')).toBe(false);
  });

  it('leaves a held button alone when another finger is lifted', () => {
    const { inputState, right } = renderDeck();
    const attack = screen.getByRole('button', { name: 'Атаковать' });

    fireEvent(right, pointerEvent('pointerdown', 1));
    fireEvent(attack, pointerEvent('pointerdown', 2));
    fireEvent(attack, pointerEvent('pointerup', 2));

    expect(inputState.isPressed('move-right')).toBe(true);
    expect(inputState.isPressed('primary-ability')).toBe(false);
  });

  it('lets go of a held action when the deck itself goes away', () => {
    const { inputState, right } = renderDeck();

    fireEvent(right, pointerEvent('pointerdown', 1));
    cleanup();

    expect(inputState.isPressed('move-right')).toBe(false);
  });

  it('drops every held action when the page goes to the background', () => {
    const { inputState, right } = renderDeck();

    fireEvent(right, pointerEvent('pointerdown', 1));
    document.dispatchEvent(new Event('visibilitychange'));

    expect(inputState.isPressed('move-right')).toBe(false);
  });

  // Two fingers on the glass are a pinch to a phone, and the gesture it starts cancels every
  // pointer it had going — including the one holding a direction button.
  it('refuses the browser default touch behaviour on a button', () => {
    const { right } = renderDeck();
    const touchStart = new Event('touchstart', { bubbles: true, cancelable: true });

    right.dispatchEvent(touchStart);

    expect(touchStart.defaultPrevented).toBe(true);
  });

  it('queues a one-shot action once per press', () => {
    const { inputState } = renderDeck();
    const jump = screen.getByRole('button', { name: 'Прыгнуть' });

    fireEvent(jump, pointerEvent('pointerdown', 1));
    expect(inputState.consume('jump')).toBe(true);
    expect(inputState.consume('jump')).toBe(false);
  });

  // The window-level net is only armed while something is actually held: ten buttons each
  // listening for every pointerup on the page would be a needless tax on a phone.
  it('takes its window listeners back down once the press ends', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const count = (spy: typeof add, type: string) =>
      spy.mock.calls.filter(([name]) => name === type).length;
    const { right } = renderDeck();

    fireEvent(right, pointerEvent('pointerdown', 1));
    expect(count(add, 'pointerup')).toBe(1);
    expect(count(add, 'pointercancel')).toBe(1);

    fireEvent(right, pointerEvent('pointerup', 1));
    expect(count(remove, 'pointerup')).toBe(1);
    expect(count(remove, 'pointercancel')).toBe(1);

    add.mockRestore();
    remove.mockRestore();
  });
});
