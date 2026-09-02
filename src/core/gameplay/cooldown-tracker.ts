export class CooldownTracker {
  readonly #remaining = new Map<string, number>();

  update(deltaMs: number): void {
    this.#remaining.forEach((remaining, id) => {
      const next = Math.max(0, remaining - deltaMs);
      if (next === 0) this.#remaining.delete(id);
      else this.#remaining.set(id, next);
    });
  }

  ready(id: string): boolean {
    return !this.#remaining.has(id);
  }

  start(id: string, durationMs: number): void {
    this.#remaining.set(id, Math.max(0, durationMs));
  }

  snapshot(): Readonly<Record<string, number>> {
    return Object.fromEntries(this.#remaining);
  }
}
