import type { GameAction } from './game-action';
import { GameInputState } from './game-input-state';

const KEY_ACTIONS: Readonly<Record<string, GameAction>> = {
  ArrowDown: 'move-down',
  ArrowLeft: 'move-left',
  ArrowRight: 'move-right',
  ArrowUp: 'jump',
  Digit1: 'primary-ability',
  Digit2: 'special-ability',
  Digit3: 'support-ability',
  Digit4: 'ultimate',
  Escape: 'pause',
  KeyA: 'move-left',
  KeyD: 'move-right',
  KeyE: 'interact',
  KeyT: 'restart-checkpoint',
  KeyS: 'move-down',
  KeyW: 'jump',
  Space: 'jump',
  Tab: 'switch-cat',
};

export class KeyboardInputAdapter {
  readonly #input: GameInputState;
  readonly #target: Window;

  constructor(input: GameInputState, target: Window = window) {
    this.#input = input;
    this.#target = target;
  }

  connect(): () => void {
    const handleKeyDown = (event: KeyboardEvent) => {
      const action = KEY_ACTIONS[event.code];
      if (!action) return;
      event.preventDefault();
      this.#input.press(action);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      const action = KEY_ACTIONS[event.code];
      if (!action) return;
      event.preventDefault();
      this.#input.release(action);
    };
    const handleBlur = () => this.#input.reset();

    this.#target.addEventListener('keydown', handleKeyDown);
    this.#target.addEventListener('keyup', handleKeyUp);
    this.#target.addEventListener('blur', handleBlur);

    return () => {
      this.#target.removeEventListener('keydown', handleKeyDown);
      this.#target.removeEventListener('keyup', handleKeyUp);
      this.#target.removeEventListener('blur', handleBlur);
      this.#input.reset();
    };
  }
}
