import { useCallback, useEffect, useState } from 'react';
import type { GameplayController } from '@application/index';
import type { GameInputState } from '@adapters/input/index';
import type { AppState } from '@core/index';
import type { CampaignLevelDefinition } from '@content/index';
import { GameCanvas } from './GameCanvas';
import { GameHud } from './GameHud';
import { PauseOverlay } from './PauseOverlay';
import { RendererLostOverlay } from './RendererLostOverlay';
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
  // The browser can take the drawing surface away mid-level to reclaim memory. Phaser stops
  // rendering but keeps stepping the scene, so without this the picture freezes while the phase
  // clock runs, the hounds keep biting and the player cannot see any of it (see
  // `adapters/phaser/renderer-context.ts`).
  const [rendererLost, setRendererLost] = useState(false);
  const [rendererStalled, setRendererStalled] = useState(false);
  const handleRendererLost = useCallback(() => setRendererLost(true), []);
  const handleRendererRestored = useCallback(() => {
    setRendererLost(false);
    setRendererStalled(false);
  }, []);
  useEffect(() => {
    if (!rendererLost) return;
    // Usually the context is handed back within a frame or two. When it is not, the only way out
    // is a reload, and the player needs to be told that rather than left waiting.
    const timeoutId = window.setTimeout(() => setRendererStalled(true), 6_000);
    return () => window.clearTimeout(timeoutId);
  }, [rendererLost]);
  useEffect(
    () => gameplay.setPaused(appState === 'paused' || showTutorialChoice || rendererLost),
    [appState, gameplay, rendererLost, showTutorialChoice],
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
        onRendererLost={handleRendererLost}
        onRendererRestored={handleRendererRestored}
      />
      <GameHud
        gameplay={gameplay}
        onPause={onPauseToggle}
        tutorialStep={tutorial.enabled ? tutorial.step : null}
      />
      {/* Level 1 carries its own authored, world-triggered dialogue inside the scene
          (`garden/garden-level-system.ts`), so the generic level-intro card would only repeat it. */}
      {level.id === 'garden-first-dawn' ? null : (
        <DialogueOverlay levelId={level.id} reducedMotion={reducedMotion} />
      )}
      <TouchControls inputState={inputState} />
      <div className="orientation-hint" role="status">
        ↻ Поверните устройство горизонтально
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
      {rendererLost ? (
        <RendererLostOverlay onReload={() => window.location.reload()} stalled={rendererStalled} />
      ) : null}
    </main>
  );
}
