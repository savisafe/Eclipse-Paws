import type { Phase } from '../models';

export interface PhaseAdvanceResult {
  changed: boolean;
  phase: Phase;
}

export class PhaseCycle {
  readonly #durationMs: number;
  // ECLIPSE_PAWS_SCENARIO.md §12, «Сад первой зари»: "Ночь наступает не по обычному таймеру, а
  // как сюжетное событие. Игрок заранее понимает, что сам вызвал изменение мира." A story-mode
  // cycle never flips on its own — only `setPhase`/`changePhase` move it.
  readonly #manual: boolean;
  #elapsedMs = 0;
  #phase: Phase;

  constructor(durationMs: number, initialPhase: Phase = 'day', manual = false) {
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      throw new Error('Phase duration must be a positive finite number.');
    }

    this.#durationMs = durationMs;
    this.#manual = manual;
    this.#phase = initialPhase;
  }

  get manual(): boolean {
    return this.#manual;
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

    if (this.#manual) return { changed: false, phase: this.#phase };

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

  setPhase(phase: Phase): boolean {
    if (this.#phase === phase) return false;
    this.#elapsedMs = 0;
    this.#phase = phase;
    return true;
  }
}
