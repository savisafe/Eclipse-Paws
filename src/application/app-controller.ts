import { AppStateMachine, type AppState } from '@core/index';

export type AppStateListener = (state: AppState) => void;

export class AppController {
  readonly #machine: AppStateMachine;
  readonly #listeners = new Set<AppStateListener>();

  constructor(machine = new AppStateMachine()) {
    this.#machine = machine;
  }

  get state(): AppState {
    return this.#machine.state;
  }

  start(): void {
    if (this.state === 'boot') {
      this.transition('main-menu');
    }
  }

  startNewGame(): void {
    if (this.state === 'main-menu' || this.state === 'level-result') {
      this.transition('loading-level');
    }
  }

  levelReady(): void {
    if (this.state === 'loading-level') this.transition('playing');
  }

  togglePause(): void {
    if (this.state === 'playing') {
      this.transition('paused');
    } else if (this.state === 'paused') {
      this.transition('playing');
    }
  }

  completeLevel(): void {
    if (this.state === 'playing') this.transition('level-result');
  }

  returnToMenu(): void {
    if (
      this.state === 'loading-level' ||
      this.state === 'playing' ||
      this.state === 'paused' ||
      this.state === 'level-result'
    ) {
      this.transition('main-menu');
    }
  }

  subscribe(listener: AppStateListener): () => void {
    this.#listeners.add(listener);
    listener(this.state);
    return () => this.#listeners.delete(listener);
  }

  transition(to: AppState): void {
    const state = this.#machine.transition(to);
    this.#listeners.forEach((listener) => listener(state));
  }
}
