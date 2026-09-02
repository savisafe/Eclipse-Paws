export interface SequenceResult {
  accepted: boolean;
  progress: number;
  solved: boolean;
}

export class SequencePuzzle {
  readonly #sequence: readonly string[];
  #progress = 0;

  constructor(sequence: readonly string[]) {
    if (sequence.length === 0) throw new Error('Puzzle sequence cannot be empty.');
    this.#sequence = sequence;
  }

  get solved(): boolean {
    return this.#progress === this.#sequence.length;
  }

  activate(id: string): SequenceResult {
    if (this.solved) return { accepted: false, progress: this.#progress, solved: true };
    if (id !== this.#sequence[this.#progress]) {
      this.#progress = 0;
      return { accepted: false, progress: 0, solved: false };
    }
    this.#progress += 1;
    return { accepted: true, progress: this.#progress, solved: this.solved };
  }
}
