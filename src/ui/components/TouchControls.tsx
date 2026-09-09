import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { GameInputState } from '@adapters/input/index';
import type { GameAction } from '@adapters/input/index';

interface TouchControlsProps {
  inputState: GameInputState;
}

interface TouchButtonProps {
  action: GameAction;
  inputState: GameInputState;
  label: string;
  symbol: string;
}

function TouchButton({ action, inputState, label, symbol }: TouchButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  // The pointer that is holding this button down, so a second finger landing elsewhere can never
  // end a press it did not start.
  const pointerIdRef = useRef<number | null>(null);
  const [pressed, setPressed] = useState(false);

  const release = useCallback(() => {
    if (pointerIdRef.current === null) return;
    pointerIdRef.current = null;
    setPressed(false);
    inputState.release(action);
  }, [action, inputState]);

  const press = (event: ReactPointerEvent<HTMLButtonElement>) => {
    pointerIdRef.current = event.pointerId;
    setPressed(true);
    // The press is registered *before* the capture is asked for: a touch pointer is already
    // captured implicitly by the spec, and a browser that answers the redundant request with a
    // throw must not be able to swallow the button press with it.
    inputState.press(action);
    try {
      // Keeps the button working when the thumb rolls off its edge mid-hold.
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Best effort only — the window-level listeners below end the press either way.
    }
  };

  const releaseOwnPointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current === event.pointerId) release();
  };

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    // Refusing the browser's own touch behaviour on the deck is what keeps a second finger from
    // being read as the start of a pinch: iOS answers such a gesture by cancelling *every* pointer
    // it had going, which released the direction button the other thumb was still holding and
    // stopped the cat dead. `touch-action: none` alone does not cover it, and React attaches
    // `touchstart` passively, so the listener has to be a native, non-passive one.
    const swallowGesture = (event: TouchEvent) => event.preventDefault();
    button.addEventListener('touchstart', swallowGesture, { passive: false });
    return () => button.removeEventListener('touchstart', swallowGesture);
  }, []);

  useEffect(() => {
    if (!pressed) return;
    // A press must never outlive the gesture that started it. `pointerup` can land somewhere else
    // entirely when the capture was refused, and a system gesture (the iOS home indicator, a
    // notification, the app going to the background) can end a touch without delivering anything
    // to the button at all — without this the cat would keep running.
    const endPointer = (event: PointerEvent) => {
      if (pointerIdRef.current === event.pointerId) release();
    };
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', release);
    return () => {
      window.removeEventListener('pointerup', endPointer);
      window.removeEventListener('pointercancel', endPointer);
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', release);
      // A no-op on the ordinary path, since the release that cleared `pressed` already ran it.
      // It matters when the deck goes away under a held thumb — a level ending, a pause — where
      // nothing else would ever lift the action off the input state.
      release();
    };
  }, [pressed, release]);

  return (
    <button
      aria-label={label}
      className={`touch-button touch-button--${action}`}
      // `:active` cannot be relied on once the default touch behaviour is refused above, and the
      // player has to see that the button took the press.
      data-pressed={pressed ? 'true' : undefined}
      onPointerCancel={releaseOwnPointer}
      onPointerDown={press}
      onPointerUp={releaseOwnPointer}
      ref={buttonRef}
      type="button"
    >
      {symbol}
    </button>
  );
}

export function TouchControls({ inputState }: TouchControlsProps) {
  return (
    <div className="touch-controls" aria-label="Сенсорное управление">
      {/* Hiding is a movement, so it sits under the thumb that moves — and it leaves the two
          clusters the same three rows tall, which is what lets them fill the portrait deck. */}
      <div className="touch-dpad">
        <TouchButton action="jump" inputState={inputState} label="Прыгнуть" symbol="▲" />
        <TouchButton
          action="move-left"
          inputState={inputState}
          label="Двигаться влево"
          symbol="◀"
        />
        <TouchButton
          action="move-right"
          inputState={inputState}
          label="Двигаться вправо"
          symbol="▶"
        />
        <TouchButton action="move-down" inputState={inputState} label="Спрятаться" symbol="◒" />
      </div>
      <div className="touch-actions">
        <TouchButton action="switch-cat" inputState={inputState} label="Сменить кота" symbol="↔" />
        <TouchButton
          action="interact"
          inputState={inputState}
          label="Взаимодействовать"
          symbol="E"
        />
        <TouchButton
          action="support-ability"
          inputState={inputState}
          label="Лечение или щит"
          symbol="♥"
        />
        <TouchButton
          action="special-ability"
          inputState={inputState}
          label="Сильная атака"
          symbol="ϟ"
        />
        <TouchButton
          action="ultimate"
          inputState={inputState}
          label="Объятие затмения"
          symbol="✺"
        />
        <TouchButton
          action="primary-ability"
          inputState={inputState}
          label="Атаковать"
          symbol="✦"
        />
      </div>
    </div>
  );
}
