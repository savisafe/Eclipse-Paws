import type { Phase } from '../models';

export interface PhaseAdvanceResult {
  changed: boolean;
  phase: Phase;
}

export class PhaseCycle {
  readonly #durationMs: number;
  #elapsedMs = 0;
  #phase: Phase;

  constructor(durationMs: number, initialPhase: Phase = 'day') {
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      throw new Error('Phase duration must be a positive finite number.');
    }

    this.#durationMs = durationMs;
    this.#phase = initialPhase;
  }

  get phase(): Phase {
    return this.#phase;
  }

  get remainingMs(): number {
    return this.#durationMs - this.#elapsedMs;
  }

  advance(deltaMs: number): PhaseAdvanceResult {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) {
      throw new Error('Simulation delta must be a non-negative finite number.');
    }

    this.#elapsedMs += deltaMs;
    let changed = false;

    while (this.#elapsedMs >= this.#durationMs) {
      this.#elapsedMs -= this.#durationMs;
      this.#phase = this.#phase === 'day' ? 'night' : 'day';
      changed = true;
    }

    return { changed, phase: this.#phase };
  }

  changePhase(): Phase {
    this.#elapsedMs = 0;
    this.#phase = this.#phase === 'day' ? 'night' : 'day';
    return this.#phase;
  }
}
