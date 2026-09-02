import {
  GameSession,
  weakCatForPhase,
  type AttackResult,
  type CatId,
  type GameEvent,
  type GameplaySnapshot,
  type PrototypeContentConfig,
} from '@core/index';

export type GameplayListener = () => void;
export type GameEventListener = (event: GameEvent) => void;

export class GameplayController {
  readonly #eventListeners = new Set<GameEventListener>();
  readonly #listeners = new Set<GameplayListener>();
  readonly #session: GameSession;
  #publishElapsedMs = 0;
  #snapshot: GameplaySnapshot;

  constructor(content: PrototypeContentConfig) {
    this.#session = new GameSession(content);
    this.#snapshot = this.#session.snapshot();
  }

  getSnapshot = (): GameplaySnapshot => this.#snapshot;

  subscribe = (listener: GameplayListener): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  subscribeToEvents(listener: GameEventListener): () => void {
    this.#eventListeners.add(listener);
    return () => this.#eventListeners.delete(listener);
  }

  tick(deltaMs: number): void {
    this.#session.update(deltaMs);
    this.#publishElapsedMs += deltaMs;
    const events = this.#flushEvents();

    if (events.length > 0 || this.#publishElapsedMs >= 100) {
      this.#publishElapsedMs = 0;
      this.#publish();
    }
  }

  switchActiveCat(): CatId {
    const catId = this.#session.switchActiveCat();
    this.#flushEvents();
    this.#publish();
    return catId;
  }

  attackEnemy(enemyId: string): AttackResult | null {
    const result = this.#session.attack(enemyId);
    this.#flushEvents();
    this.#publish();
    return result;
  }

  useSpecialAbility(enemyId: string): AttackResult | null {
    const result = this.#session.attack(enemyId, true);
    this.#flushEvents();
    this.#publish();
    return result;
  }

  useMobility(): boolean {
    const result = this.#session.useMobility();
    this.#flushEvents();
    this.#publish();
    return result !== null;
  }

  useSupport(): boolean {
    const result = this.#session.useSupport();
    this.#flushEvents();
    this.#publish();
    return result !== null;
  }

  manualChangePhase(): boolean {
    const changed = this.#session.manualChangePhase();
    this.#flushEvents();
    this.#publish();
    return changed;
  }

  useUltimate(enemyIds: readonly string[]): boolean {
    const used = this.#session.useUltimate(enemyIds);
    this.#flushEvents();
    this.#publish();
    return used;
  }

  takeDamage(amount: number): boolean {
    const restarted = this.#session.takeDamage(amount);
    this.#flushEvents();
    this.#publish();
    return restarted;
  }

  reachCheckpoint(checkpointId: string): void {
    this.#session.reachCheckpoint(checkpointId);
    this.#flushEvents();
    this.#publish();
  }

  restartCheckpoint(): void {
    this.#session.restartCheckpoint();
    this.#flushEvents();
    this.#publish();
  }

  setPaused(paused: boolean): void {
    this.#session.setPaused(paused);
    this.#flushEvents();
    this.#publish();
  }

  getWeakCat(): CatId {
    return weakCatForPhase(this.#snapshot.phase);
  }

  #flushEvents(): readonly GameEvent[] {
    const events = this.#session.drainEvents();
    events.forEach((event) => this.#eventListeners.forEach((listener) => listener(event)));
    return events;
  }

  #publish(): void {
    this.#snapshot = this.#session.snapshot();
    this.#listeners.forEach((listener) => listener());
  }
}
