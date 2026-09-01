import { APP_TRANSITIONS, type AppState } from './app-state';

export class InvalidAppTransitionError extends Error {
  constructor(from: AppState, to: AppState) {
    super(`Invalid app transition: ${from} -> ${to}`);
    this.name = 'InvalidAppTransitionError';
  }
}

export class AppStateMachine {
  #state: AppState;

  constructor(initialState: AppState = 'boot') {
    this.#state = initialState;
  }

  get state(): AppState {
    return this.#state;
  }

  canTransition(to: AppState): boolean {
    return APP_TRANSITIONS[this.#state].includes(to);
  }

  transition(to: AppState): AppState {
    if (!this.canTransition(to)) {
      throw new InvalidAppTransitionError(this.#state, to);
    }

    this.#state = to;
    return this.#state;
  }
}
