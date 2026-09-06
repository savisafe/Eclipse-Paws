import { beforeEach, describe, expect, it } from 'vitest';
import {
  TUTORIAL_STORAGE_KEY,
  loadTutorialProgress,
  saveTutorialProgress,
} from '@adapters/storage/tutorial-progress-repository';

describe('tutorial progress', () => {
  beforeEach(() => window.localStorage.clear());

  it('uses a safe default and persists the current interactive step', () => {
    expect(loadTutorialProgress()).toEqual({ completed: false, enabled: false, step: 0 });

    saveTutorialProgress({ completed: false, enabled: true, step: 4 });

    expect(loadTutorialProgress()).toEqual({ completed: false, enabled: true, step: 4 });
  });

  it('recovers from invalid stored data', () => {
    window.localStorage.setItem(TUTORIAL_STORAGE_KEY, '{broken');
    expect(loadTutorialProgress()).toEqual({ completed: false, enabled: false, step: 0 });
  });
});
