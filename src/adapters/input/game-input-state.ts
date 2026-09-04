import type { GameAction } from './game-action';

const ONE_SHOT_ACTIONS = new Set<GameAction>([
  'primary-ability',
  'special-ability',
  'jump',
  'support-ability',
  'interact',
  'change-phase',
  'switch-cat',
  'restart-checkpoint',
  'ultimate',
  'pause',
]);

export class GameInputState {
  readonly #active = new Set<GameAction>();
  readonly #queued = new Set<GameAction>();

  press(action: GameAction): void {
    if (ONE_SHOT_ACTIONS.has(action) && !this.#active.has(action)) this.#queued.add(action);
    this.#active.add(action);
  }

  release(action: GameAction): void {
    this.#active.delete(action);
  }

  isPressed(action: GameAction): boolean {
    return this.#active.has(action);
  }

  consume(action: GameAction): boolean {
    if (!this.#queued.has(action)) return false;
    this.#queued.delete(action);
    return true;
  }

  reset(): void {
    this.#active.clear();
    this.#queued.clear();
  }
}
