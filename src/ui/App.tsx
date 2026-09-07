import { useCallback, useEffect, useRef, useState } from 'react';
import { GameplayController } from '@application/index';
import { createAppServices } from '@ui/composition-root';
import { readDebugLaunchParams, shouldAutoStartDebugLaunch } from '@ui/debug-launch';
import {
  CAMPAIGN_LEVEL_ORDER,
  CAMPAIGN_LEVELS,
  PLAYABLE_CAMPAIGN_LEVELS,
  createLevelContent,
  EPILOGUE_PANELS,
  PROLOGUE_PANELS,
  type CampaignLevelId,
} from '@content/index';
import { BootScreen } from '@ui/components/BootScreen';
import { GameScreen } from '@ui/components/GameScreen';
import { MainMenu } from '@ui/components/MainMenu';
import { LevelResult } from '@ui/components/LevelResult';
import { Slideshow } from '@ui/components/Slideshow';
import { Prologue } from '@ui/components/Prologue';
import { StoryIntro } from '@ui/components/StoryIntro';
import { Credits } from '@ui/components/Credits';
import { useAppController } from '@ui/hooks/use-app-controller';
import { useSessionStore } from '@ui/store/session-store';
import { useSettingsStore } from '@ui/store/settings-store';
import { createDefaultHeroProgress, type HeroProgress } from '@core/index';

const DEBUG_LAUNCH = readDebugLaunchParams();

function createCampaignGameplay(
  levelId: CampaignLevelId,
  progress?: HeroProgress,
): GameplayController {
  // Asking for a phase duration means asking for the timed cycle, so the override also switches a
  // story-driven level (level 1) back to the timer — otherwise the flag would silently do nothing.
  const content =
    DEBUG_LAUNCH.phaseDurationMs !== null
      ? {
          ...createLevelContent(levelId),
          phaseDurationMs: DEBUG_LAUNCH.phaseDurationMs,
          phaseMode: 'timer' as const,
        }
      : createLevelContent(levelId);
  const gameplay = new GameplayController(content, progress);
  const requestedCheckpointId = DEBUG_LAUNCH.checkpointId;
  if (
    requestedCheckpointId &&
    CAMPAIGN_LEVELS[levelId].checkpoints.some((point) => point.id === requestedCheckpointId)
  ) {
    gameplay.reachCheckpoint(requestedCheckpointId);
  }
  return gameplay;
}

function applyDevHeroLevelOverride(progress: HeroProgress): HeroProgress {
  return DEBUG_LAUNCH.heroLevel === null
    ? progress
    : { ...progress, level: DEBUG_LAUNCH.heroLevel };
}

function initialLevelFromLocation(): CampaignLevelId {
  return DEBUG_LAUNCH.level && PLAYABLE_CAMPAIGN_LEVELS.includes(DEBUG_LAUNCH.level)
    ? DEBUG_LAUNCH.level
    : 'garden-first-dawn';
}

export function App() {
  const [{ appController, inputState, progressService }] = useState(createAppServices);
  const [selectedLevel, setSelectedLevel] = useState<CampaignLevelId>(initialLevelFromLocation);
  const [unlockedLevels, setUnlockedLevels] = useState<CampaignLevelId[]>(['garden-first-dawn']);
  const [heroProgress, setHeroProgress] = useState<HeroProgress>(() =>
    applyDevHeroLevelOverride(createDefaultHeroProgress()),
  );
  const [gameplay, setGameplay] = useState(() =>
    createCampaignGameplay(initialLevelFromLocation()),
  );
  const [showIntro, setShowIntro] = useState(false);
  const [tutorialPromptRequested, setTutorialPromptRequested] = useState(false);
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
      setUnlockedLevels(
        save.unlockedLevels.filter((level): level is CampaignLevelId =>
          PLAYABLE_CAMPAIGN_LEVELS.includes(level as CampaignLevelId),
        ),
      );
      setHeroProgress(applyDevHeroLevelOverride(save.heroProgress));
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
    setTutorialPromptRequested(false);
    inputState.reset();
    setGameplay(createCampaignGameplay(selectedLevel, heroProgress));
    appController.startNewGame();
  }, [appController, heroProgress, inputState, selectedLevel]);
  const startBrandNewGame = useCallback(() => {
    setSelectedLevel(CAMPAIGN_LEVEL_ORDER[0]!);
    appController.showPrologue();
  }, [appController]);
  const handlePrologueComplete = useCallback(() => {
    // COM-019: seamless transition — the last prologue panel leads straight into gameplay,
    // not through another intro card ("skip ведёт в уровень 1 без двойной загрузки").
    inputState.reset();
    setGameplay(createCampaignGameplay(CAMPAIGN_LEVEL_ORDER[0]!, heroProgress));
    setTutorialPromptRequested(true);
    appController.prologueFinished();
  }, [appController, heroProgress, inputState]);
  const startEpilogue = useCallback(() => appController.showEpilogue(), [appController]);
  const handleEpilogueComplete = useCallback(() => appController.showCredits(), [appController]);
  const debugAutostarted = useRef(false);
  useEffect(() => {
    if (debugAutostarted.current) return;
    if (appState !== 'main-menu' || !shouldAutoStartDebugLaunch(DEBUG_LAUNCH)) return;
    debugAutostarted.current = true;
    const timeoutId = window.setTimeout(() => startNewGame(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [appState, startNewGame]);
  const openLevelIntro = useCallback((levelId: CampaignLevelId) => {
    setSelectedLevel(levelId);
    setShowIntro(true);
  }, []);
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
      .completeLevel(selectedLevel, snapshot.elapsedMs, snapshot.sparksCollected, {
        level: snapshot.heroLevel,
        loot: { ...snapshot.loot },
        xp: snapshot.heroXp,
      })
      .then((save) => {
        setUnlockedLevels(save.unlockedLevels as CampaignLevelId[]);
        setHeroProgress(save.heroProgress);
      });
    appController.completeLevel();
  }, [appController, gameplay, progressService, selectedLevel]);
  const currentIndex = PLAYABLE_CAMPAIGN_LEVELS.indexOf(selectedLevel);
  const nextLevel = PLAYABLE_CAMPAIGN_LEVELS[currentIndex + 1];
  const startNextLevel = useCallback(() => {
    if (!nextLevel) return;
    appController.returnToMenu();
    openLevelIntro(nextLevel);
  }, [appController, nextLevel, openLevelIntro]);
  const continueGame = useCallback(() => {
    const available = PLAYABLE_CAMPAIGN_LEVELS.filter((levelId) =>
      unlockedLevels.includes(levelId),
    );
    openLevelIntro(available.at(-1) ?? 'garden-first-dawn');
  }, [openLevelIntro, unlockedLevels]);

  if (appState === 'boot') return <BootScreen />;
  if (appState === 'credits') return <Credits onMenu={returnToMenu} />;
  if (appState === 'prologue') {
    return <Prologue onComplete={handlePrologueComplete} panels={PROLOGUE_PANELS} />;
  }
  if (appState === 'epilogue') {
    return (
      <Slideshow
        onComplete={handleEpilogueComplete}
        panels={EPILOGUE_PANELS}
        title="Эпилог: Те, кто остаются рядом"
      />
    );
  }
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
        onNewGame={startBrandNewGame}
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
            : selectedLevel === 'eternal-sleep-heart'
              ? 'Финал'
              : undefined
        }
        onMenu={returnToMenu}
        onNext={
          nextLevel
            ? startNextLevel
            : selectedLevel === 'eternal-sleep-heart'
              ? startEpilogue
              : undefined
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
      tutorialPromptRequested={tutorialPromptRequested}
    />
  );
}
