export class BondHealth {
  readonly #maximum: number;
  #current: number;

  constructor(maximum = 3) {
    if (!Number.isInteger(maximum) || maximum <= 0) {
      throw new Error('Maximum bond health must be a positive integer.');
    }

    this.#maximum = maximum;
    this.#current = maximum;
  }

  get current(): number {
    return this.#current;
  }

  get maximum(): number {
    return this.#maximum;
  }

  get depleted(): boolean {
    return this.#current === 0;
  }

  damage(amount: number): number {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Damage must be a positive finite number.');
    }

    this.#current = Math.max(0, this.#current - amount);
    return this.#current;
  }

  restore(): void {
    this.#current = this.#maximum;
  }
}
