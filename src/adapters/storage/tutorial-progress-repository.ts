export const TUTORIAL_STORAGE_KEY = 'eclipse-paws-tutorial';

export interface TutorialProgress {
  completed: boolean;
  enabled: boolean;
  step: number;
}

const DEFAULT_PROGRESS: TutorialProgress = { completed: false, enabled: false, step: 0 };

export function loadTutorialProgress(): TutorialProgress {
  try {
    const raw = window.localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const value = JSON.parse(raw) as Partial<TutorialProgress>;
    return {
      completed: value.completed === true,
      enabled: value.enabled === true,
      step: Number.isInteger(value.step) && (value.step ?? 0) >= 0 ? value.step! : 0,
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveTutorialProgress(progress: TutorialProgress): void {
  try {
    window.localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private browsing/storage denial must never prevent the game from starting.
  }
}
