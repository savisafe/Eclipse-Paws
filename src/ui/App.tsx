import { useCallback, useEffect, useState } from 'react';
import { AppController, GameplayController, ProgressService } from '@application/index';
import { GameInputState } from '@adapters/input/index';
import { LocalStorageSaveRepository } from '@adapters/storage/index';
import { PROTOTYPE_CONTENT } from '@content/index';
import { BootScreen } from '@ui/components/BootScreen';
import { GameScreen } from '@ui/components/GameScreen';
import { MainMenu } from '@ui/components/MainMenu';
import { LevelResult } from '@ui/components/LevelResult';
import { StoryIntro } from '@ui/components/StoryIntro';
import { useAppController } from '@ui/hooks/use-app-controller';
import { useSessionStore } from '@ui/store/session-store';
import { useSettingsStore } from '@ui/store/settings-store';

function createPrototypeGameplay(): GameplayController {
  const requestedDuration = Number(
    new URLSearchParams(window.location.search).get('phaseDurationMs'),
  );
  const content =
    import.meta.env.DEV && Number.isFinite(requestedDuration) && requestedDuration >= 100
      ? { ...PROTOTYPE_CONTENT, phaseDurationMs: requestedDuration }
      : PROTOTYPE_CONTENT;
  return new GameplayController(content);
}

export function App() {
  const [appController] = useState(() => new AppController());
  const [inputState] = useState(() => new GameInputState());
  const [progressService] = useState(
    () => new ProgressService(new LocalStorageSaveRepository(window.localStorage)),
  );
  const [gameplay, setGameplay] = useState(createPrototypeGameplay);
  const [showIntro, setShowIntro] = useState(false);
  useAppController(appController);
  const appState = useSessionStore((state) => state.appState);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => appController.start(), 450);
    return () => window.clearTimeout(timeoutId);
  }, [appController]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let disposed = false;
    void progressService.load().then((save) => {
      if (disposed) return;
      useSettingsStore.setState(save.settings);
      unsubscribe = useSettingsStore.subscribe((settings) => {
        void progressService.saveSettings({
          effectsVolume: settings.effectsVolume,
          musicVolume: settings.musicVolume,
          reducedMotion: settings.reducedMotion,
        });
      });
    });
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [progressService]);

  const startNewGame = useCallback(() => {
    inputState.reset();
    setGameplay(createPrototypeGameplay());
    appController.startNewGame();
  }, [appController, inputState]);
  const openIntro = useCallback(() => setShowIntro(true), []);
  const closeIntro = useCallback(() => setShowIntro(false), []);
  const startFromIntro = useCallback(() => {
    setShowIntro(false);
    startNewGame();
  }, [startNewGame]);
  const levelReady = useCallback(() => appController.levelReady(), [appController]);
  const togglePause = useCallback(() => appController.togglePause(), [appController]);
  const returnToMenu = useCallback(() => appController.returnToMenu(), [appController]);
  const completeLevel = useCallback(() => {
    const snapshot = gameplay.getSnapshot();
    void progressService.completeLevel(
      'garden-first-dawn',
      snapshot.elapsedMs,
      snapshot.sparksCollected,
    );
    appController.completeLevel();
  }, [appController, gameplay, progressService]);

  if (appState === 'boot') return <BootScreen />;
  if (appState === 'main-menu') {
    return showIntro ? (
      <StoryIntro onBack={closeIntro} onStart={startFromIntro} />
    ) : (
      <MainMenu onNewGame={openIntro} />
    );
  }
  if (appState === 'level-result') {
    const snapshot = gameplay.getSnapshot();
    return (
      <LevelResult
        elapsedMs={snapshot.elapsedMs}
        onMenu={returnToMenu}
        onReplay={startNewGame}
        sparks={snapshot.sparksCollected}
        totalSparks={snapshot.totalSparks}
      />
    );
  }

  return (
    <GameScreen
      appState={appState}
      gameplay={gameplay}
      inputState={inputState}
      onPauseToggle={togglePause}
      onLevelCompleted={completeLevel}
      onReady={levelReady}
      onReturnToMenu={returnToMenu}
    />
  );
}
