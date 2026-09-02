import { describe, expect, it } from 'vitest';
import { SequencePuzzle } from '@core/index';

describe('SequencePuzzle', () => {
  it('resets on a wrong flower and solves only in order', () => {
    const puzzle = new SequencePuzzle(['sun', 'twilight', 'moon']);

    expect(puzzle.activate('twilight')).toEqual({ accepted: false, progress: 0, solved: false });
    expect(puzzle.activate('sun').progress).toBe(1);
    expect(puzzle.activate('twilight').progress).toBe(2);
    expect(puzzle.activate('moon').solved).toBe(true);
  });
});
