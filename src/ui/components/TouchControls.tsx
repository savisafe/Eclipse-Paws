import type { PointerEventHandler } from 'react';
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
  const press: PointerEventHandler<HTMLButtonElement> = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    inputState.press(action);
  };
  const release: PointerEventHandler<HTMLButtonElement> = () => inputState.release(action);

  return (
    <button
      aria-label={label}
      className={`touch-button touch-button--${action}`}
      onPointerCancel={release}
      onPointerDown={press}
      onPointerUp={release}
      type="button"
    >
      {symbol}
    </button>
  );
}

export function TouchControls({ inputState }: TouchControlsProps) {
  return (
    <div className="touch-controls" aria-label="Сенсорное управление">
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
      </div>
      <div className="touch-actions">
        <TouchButton action="switch-cat" inputState={inputState} label="Сменить кота" symbol="↔" />
        <TouchButton action="move-down" inputState={inputState} label="Спрятаться" symbol="◒" />
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
