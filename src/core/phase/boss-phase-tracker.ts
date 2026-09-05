export class BossPhaseTracker {
  readonly #maximumHealth: number;
  #phase: 1 | 2 | 3 = 1;

  constructor(maximumHealth: number) {
    if (maximumHealth <= 0) throw new Error('Boss maximum health must be positive.');
    this.#maximumHealth = maximumHealth;
  }

  get phase(): 1 | 2 | 3 {
    return this.#phase;
  }

  update(health: number): { changed: boolean; phase: 1 | 2 | 3 } {
    const ratio = Math.max(0, health) / this.#maximumHealth;
    const next = ratio > 2 / 3 ? 1 : ratio > 1 / 3 ? 2 : 3;
    const changed = next !== this.#phase;
    this.#phase = next;
    return { changed, phase: next };
  }
}
