import {
  GameSession,
  weakCatForPhase,
  type AttackResult,
  type CatId,
  type GameEvent,
  type GameplaySnapshot,
  type HeroProgress,
  type Phase,
  type LootKind,
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

  constructor(content: PrototypeContentConfig, progress?: HeroProgress) {
    this.#session = new GameSession(content, progress);
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

  setPhase(phase: Phase): boolean {
    const changed = this.#session.setPhase(phase);
    this.#flushEvents();
    this.#publish();
    return changed;
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

  castSpecialAbility(): boolean {
    const result = this.#session.castSpecialAbility();
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

  useEclipse(): boolean {
    const used = this.#session.useEclipse();
    this.#flushEvents();
    this.#publish();
    return used;
  }

  stunEnemies(enemyIds: readonly string[]): readonly string[] {
    const stunned = this.#session.stunEnemies(enemyIds);
    this.#flushEvents();
    this.#publish();
    return stunned;
  }

  grantInvulnerability(durationMs: number): void {
    this.#session.grantInvulnerability(durationMs);
  }

  isEnemyStunned(enemyId: string): boolean {
    return this.#session.isEnemyStunned(enemyId);
  }

  collectSpark(sparkId: string): boolean {
    const collected = this.#session.collectSpark(sparkId);
    this.#flushEvents();
    this.#publish();
    return collected;
  }

  collectLoot(sourceId: string): LootKind {
    const kind = this.#session.collectLoot(sourceId);
    this.#flushEvents();
    this.#publish();
    return kind;
  }

  rewardEclipse(amount: number): void {
    this.#session.rewardEclipse(amount);
    this.#publish();
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
