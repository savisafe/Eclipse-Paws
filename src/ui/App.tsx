import { useCallback, useEffect, useState } from 'react';
import { AppController, GameplayController, ProgressService } from '@application/index';
import { GameInputState } from '@adapters/input/index';
import { LocalStorageSaveRepository } from '@adapters/storage/index';
import {
  CAMPAIGN_LEVEL_ORDER,
  CAMPAIGN_LEVELS,
  createLevelContent,
  type CampaignLevelId,
} from '@content/index';
import { BootScreen } from '@ui/components/BootScreen';
import { GameScreen } from '@ui/components/GameScreen';
import { MainMenu } from '@ui/components/MainMenu';
import { LevelResult } from '@ui/components/LevelResult';
import { StoryIntro } from '@ui/components/StoryIntro';
import { Credits } from '@ui/components/Credits';
import { useAppController } from '@ui/hooks/use-app-controller';
import { useSessionStore } from '@ui/store/session-store';
import { useSettingsStore } from '@ui/store/settings-store';

function createCampaignGameplay(levelId: CampaignLevelId): GameplayController {
  const requestedDuration = Number(
    new URLSearchParams(window.location.search).get('phaseDurationMs'),
  );
  const content =
    import.meta.env.DEV && Number.isFinite(requestedDuration) && requestedDuration >= 100
      ? { ...createLevelContent(levelId), phaseDurationMs: requestedDuration }
      : createLevelContent(levelId);
  return new GameplayController(content);
}

function initialLevelFromLocation(): CampaignLevelId {
  const requested = new URLSearchParams(window.location.search).get('level');
  return import.meta.env.DEV &&
    requested &&
    CAMPAIGN_LEVEL_ORDER.includes(requested as CampaignLevelId)
    ? (requested as CampaignLevelId)
    : 'garden-first-dawn';
}

export function App() {
  const [appController] = useState(() => new AppController());
  const [inputState] = useState(() => new GameInputState());
  const [progressService] = useState(
    () => new ProgressService(new LocalStorageSaveRepository(window.localStorage)),
  );
  const [selectedLevel, setSelectedLevel] = useState<CampaignLevelId>(initialLevelFromLocation);
  const [unlockedLevels, setUnlockedLevels] = useState<CampaignLevelId[]>(['garden-first-dawn']);
  const [gameplay, setGameplay] = useState(() =>
    createCampaignGameplay(initialLevelFromLocation()),
  );
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
      setUnlockedLevels(save.unlockedLevels as CampaignLevelId[]);
      unsubscribe = useSettingsStore.subscribe((settings) => {
        void progressService.saveSettings({
          effectsVolume: settings.effectsVolume,
          musicVolume: settings.musicVolume,
          reducedMotion: settings.reducedMotion,
          vibration: settings.vibration,
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
    setGameplay(createCampaignGameplay(selectedLevel));
    appController.startNewGame();
  }, [appController, inputState, selectedLevel]);
  const openLevelIntro = useCallback((levelId: CampaignLevelId) => {
    setSelectedLevel(levelId);
    setShowIntro(true);
  }, []);
  const openIntro = useCallback(
    () => openLevelIntro(selectedLevel),
    [openLevelIntro, selectedLevel],
  );
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
    void progressService
      .completeLevel(selectedLevel, snapshot.elapsedMs, snapshot.sparksCollected)
      .then((save) => setUnlockedLevels(save.unlockedLevels as CampaignLevelId[]));
    appController.completeLevel();
  }, [appController, gameplay, progressService, selectedLevel]);
  const currentIndex = CAMPAIGN_LEVEL_ORDER.indexOf(selectedLevel);
  const nextLevel = CAMPAIGN_LEVEL_ORDER[currentIndex + 1];
  const startNextLevel = useCallback(() => {
    if (!nextLevel) return;
    appController.returnToMenu();
    openLevelIntro(nextLevel);
  }, [appController, nextLevel, openLevelIntro]);
  const showCredits = useCallback(() => appController.showCredits(), [appController]);
  const continueGame = useCallback(() => {
    const available = CAMPAIGN_LEVEL_ORDER.filter((levelId) => unlockedLevels.includes(levelId));
    openLevelIntro(available.at(-1) ?? 'garden-first-dawn');
  }, [openLevelIntro, unlockedLevels]);

  if (appState === 'boot') return <BootScreen />;
  if (appState === 'credits') return <Credits onMenu={returnToMenu} />;
  if (appState === 'main-menu') {
    return showIntro ? (
      <StoryIntro
        onBack={closeIntro}
        onStart={startFromIntro}
        story={CAMPAIGN_LEVELS[selectedLevel].story}
        subtitle={CAMPAIGN_LEVELS[selectedLevel].subtitle}
        title={CAMPAIGN_LEVELS[selectedLevel].title}
      />
    ) : (
      <MainMenu
        onContinue={continueGame}
        onNewGame={openIntro}
        onSelectLevel={openLevelIntro}
        unlockedLevels={unlockedLevels}
      />
    );
  }
  if (appState === 'level-result') {
    const snapshot = gameplay.getSnapshot();
    return (
      <LevelResult
        elapsedMs={snapshot.elapsedMs}
        levelTitle={CAMPAIGN_LEVELS[selectedLevel].title}
        nextLevelTitle={
          nextLevel
            ? CAMPAIGN_LEVELS[nextLevel].title
            : selectedLevel === 'eclipse-heart'
              ? 'Финал'
              : undefined
        }
        onMenu={returnToMenu}
        onNext={
          nextLevel ? startNextLevel : selectedLevel === 'eclipse-heart' ? showCredits : undefined
        }
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
      level={CAMPAIGN_LEVELS[selectedLevel]}
      onPauseToggle={togglePause}
      onLevelCompleted={completeLevel}
      onReady={levelReady}
      onReturnToMenu={returnToMenu}
    />
  );
}
