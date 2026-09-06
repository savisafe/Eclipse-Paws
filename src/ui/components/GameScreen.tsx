import { useCallback, useEffect, useState } from 'react';
import type { GameplayController } from '@application/index';
import type { GameInputState } from '@adapters/input/index';
import type { AppState } from '@core/index';
import type { CampaignLevelDefinition } from '@content/index';
import { GameCanvas } from './GameCanvas';
import { GameHud } from './GameHud';
import { PauseOverlay } from './PauseOverlay';
import { TouchControls } from './TouchControls';
import { useSettingsStore } from '@ui/store/settings-store';
import { DialogueOverlay } from './DialogueOverlay';
import { TutorialChoice } from './TutorialChoice';
import {
  loadTutorialProgress,
  saveTutorialProgress,
} from '@adapters/storage/tutorial-progress-repository';

interface GameScreenProps {
  appState: AppState;
  gameplay: GameplayController;
  inputState: GameInputState;
  level: CampaignLevelDefinition;
  onPauseToggle: () => void;
  onLevelCompleted: () => void;
  onReady: () => void;
  onReturnToMenu: () => void;
  tutorialPromptRequested: boolean;
}

export function GameScreen({
  appState,
  gameplay,
  inputState,
  level,
  onPauseToggle,
  onLevelCompleted,
  onReady,
  onReturnToMenu,
  tutorialPromptRequested,
}: GameScreenProps) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const effectsVolume = useSettingsStore((state) => state.effectsVolume);
  const vibration = useSettingsStore((state) => state.vibration);
  const nightBrightness = useSettingsStore((state) => state.nightBrightness);
  const [showTutorialChoice, setShowTutorialChoice] = useState(
    tutorialPromptRequested && level.id === 'garden-first-dawn',
  );
  const [tutorial, setTutorial] = useState(() => {
    const saved = loadTutorialProgress();
    return tutorialPromptRequested ? { ...saved, enabled: false } : saved;
  });
  const [tutorialRunId, setTutorialRunId] = useState(0);
  useEffect(
    () => gameplay.setPaused(appState === 'paused' || showTutorialChoice),
    [appState, gameplay, showTutorialChoice],
  );

  const acceptTutorial = useCallback(() => {
    const next = { completed: false, enabled: true, step: 0 };
    setTutorial(next);
    saveTutorialProgress(next);
    setTutorialRunId((value) => value + 1);
    setShowTutorialChoice(false);
  }, []);
  const declineTutorial = useCallback(() => {
    const next = { ...tutorial, enabled: false };
    setTutorial(next);
    saveTutorialProgress(next);
    setShowTutorialChoice(false);
  }, [tutorial]);
  const startTutorialFromPause = useCallback(() => {
    const next = { completed: false, enabled: true, step: 0 };
    setTutorial(next);
    saveTutorialProgress(next);
    setTutorialRunId((value) => value + 1);
    onPauseToggle();
  }, [onPauseToggle]);
  const handleTutorialStepChange = useCallback((step: number, completed: boolean) => {
    setTutorial((current) => {
      const next = { completed, enabled: !completed, step };
      saveTutorialProgress(next);
      return current.completed === next.completed &&
        current.enabled === next.enabled &&
        current.step === next.step
        ? current
        : next;
    });
  }, []);

  return (
    <main className="game-screen" data-game-state={appState}>
      <GameCanvas
        gameplay={gameplay}
        inputState={inputState}
        level={level}
        onPauseRequested={onPauseToggle}
        onLevelCompleted={onLevelCompleted}
        onReady={onReady}
        reducedMotion={reducedMotion}
        effectsVolume={effectsVolume}
        vibration={vibration}
        nightBrightness={nightBrightness}
        tutorialActive={tutorial.enabled && level.id === 'garden-first-dawn'}
        tutorialStartStep={tutorial.step}
        tutorialRunId={tutorialRunId}
        onTutorialStepChange={handleTutorialStepChange}
      />
      <GameHud gameplay={gameplay} tutorialStep={tutorial.enabled ? tutorial.step : null} />
      {/* Level 1 carries its own authored, world-triggered dialogue inside the scene
          (`garden/garden-level-system.ts`), so the generic level-intro card would only repeat it. */}
      {level.id === 'garden-first-dawn' ? null : (
        <DialogueOverlay levelId={level.id} reducedMotion={reducedMotion} />
      )}
      <TouchControls inputState={inputState} />
      <div className="orientation-hint" role="status">
        ↻ Поверните устройство горизонтально для лучшего обзора
      </div>
      {appState === 'loading-level' ? (
        <div className="level-loading" role="status">
          <span className="level-loading__orb" aria-hidden="true" />
          Открываем «{level.title}»…
        </div>
      ) : null}
      {appState === 'paused' ? (
        <PauseOverlay
          onResume={onPauseToggle}
          onReturnToMenu={onReturnToMenu}
          onStartTutorial={level.id === 'garden-first-dawn' ? startTutorialFromPause : undefined}
          tutorialCompleted={tutorial.completed}
        />
      ) : null}
      {showTutorialChoice && appState === 'playing' ? (
        <TutorialChoice onAccept={acceptTutorial} onDecline={declineTutorial} />
      ) : null}
    </main>
  );
}
