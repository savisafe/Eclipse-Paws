import { useSyncExternalStore } from 'react';
import type { GameplayController } from '@application/index';
import type { GameplaySnapshot } from '@core/index';

export function useGameplaySnapshot(controller: GameplayController): GameplaySnapshot {
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
}
