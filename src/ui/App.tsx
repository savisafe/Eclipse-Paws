import { useCallback, useEffect, useState } from 'react';
import { AppController, GameplayController } from '@application/index';
import { GameInputState } from '@adapters/input/index';
import { PROTOTYPE_CONTENT } from '@content/index';
import { BootScreen } from '@ui/components/BootScreen';
import { GameScreen } from '@ui/components/GameScreen';
import { MainMenu } from '@ui/components/MainMenu';
import { LevelResult } from '@ui/components/LevelResult';
import { useAppController } from '@ui/hooks/use-app-controller';
import { useSessionStore } from '@ui/store/session-store';

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
  const [gameplay, setGameplay] = useState(createPrototypeGameplay);
  useAppController(appController);
  const appState = useSessionStore((state) => state.appState);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => appController.start(), 450);
    return () => window.clearTimeout(timeoutId);
  }, [appController]);

  const startNewGame = useCallback(() => {
    inputState.reset();
    setGameplay(createPrototypeGameplay());
    appController.startNewGame();
  }, [appController, inputState]);
  const levelReady = useCallback(() => appController.levelReady(), [appController]);
  const togglePause = useCallback(() => appController.togglePause(), [appController]);
  const returnToMenu = useCallback(() => appController.returnToMenu(), [appController]);
  const completeLevel = useCallback(() => appController.completeLevel(), [appController]);

  if (appState === 'boot') return <BootScreen />;
  if (appState === 'main-menu') return <MainMenu onNewGame={startNewGame} />;
  if (appState === 'level-result') {
    return <LevelResult onMenu={returnToMenu} onReplay={startNewGame} />;
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
