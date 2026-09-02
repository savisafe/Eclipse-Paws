export class EclipseMeter {
  readonly #maximum: number;
  #current = 0;

  constructor(maximum = 100) {
    this.#maximum = maximum;
  }

  get current(): number {
    return this.#current;
  }

  get maximum(): number {
    return this.#maximum;
  }

  gain(amount: number): number {
    this.#current = Math.min(this.#maximum, this.#current + Math.max(0, amount));
    return this.#current;
  }

  spend(amount: number): boolean {
    if (amount < 0 || this.#current < amount) return false;
    this.#current -= amount;
    return true;
  }
}
