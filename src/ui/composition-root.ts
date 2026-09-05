import { AppController, ProgressService } from '@application/index';
import { GameInputState } from '@adapters/input/index';
import { LocalStorageSaveRepository } from '@adapters/storage/index';

// ARC-013: a single composition root that wires concrete adapters (LocalStorageSaveRepository,
// GameInputState) into application services. This is the one place allowed to reach into
// `@adapters/*` from the `ui` layer for app-lifetime singletons — everything downstream (App.tsx
// and its descendants) only ever sees the already-constructed services, never the adapters
// directly. It lives in `src/ui` rather than `src/application` because `application` is not
// allowed to depend on concrete adapters (see eslint.config.js) — only something that already
// depends on both, like the UI composition root, can wire them together.

export interface AppServices {
  appController: AppController;
  inputState: GameInputState;
  progressService: ProgressService;
}

export function createAppServices(): AppServices {
  return {
    appController: new AppController(),
    inputState: new GameInputState(),
    progressService: new ProgressService(new LocalStorageSaveRepository(window.localStorage)),
  };
}
