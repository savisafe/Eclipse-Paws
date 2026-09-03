import { useEffect } from 'react';
import type { GameplayController } from '@application/index';
import type { GameInputState } from '@adapters/input/index';
import type { AppState } from '@core/index';
import type { CampaignLevelDefinition } from '@content/index';
import { GameCanvas } from './GameCanvas';
import { GameHud } from './GameHud';
import { PauseOverlay } from './PauseOverlay';
import { TouchControls } from './TouchControls';
import { useSettingsStore } from '@ui/store/settings-store';

interface GameScreenProps {
  appState: AppState;
  gameplay: GameplayController;
  inputState: GameInputState;
  level: CampaignLevelDefinition;
  onPauseToggle: () => void;
  onLevelCompleted: () => void;
  onReady: () => void;
  onReturnToMenu: () => void;
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
}: GameScreenProps) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const effectsVolume = useSettingsStore((state) => state.effectsVolume);
  const vibration = useSettingsStore((state) => state.vibration);
  useEffect(() => gameplay.setPaused(appState === 'paused'), [appState, gameplay]);

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
      />
      <GameHud gameplay={gameplay} />
      <div className="control-hint" aria-hidden="true">
        A/D — бег · Space — прыжок · J — атака · Shift — рывок · Q — защита · F — магия · R — фаза ·
        X — приём
      </div>
      <TouchControls inputState={inputState} />
      <div className="orientation-hint" role="status">
        ↻ Поверните устройство горизонтально для лучшего обзора
      </div>
      {appState === 'loading-level' ? (
        <div className="level-loading" role="status">
          <span className="level-loading__orb" aria-hidden="true" />
          Открываем Сад первой зари…
        </div>
      ) : null}
      {appState === 'paused' ? (
        <PauseOverlay onResume={onPauseToggle} onReturnToMenu={onReturnToMenu} />
      ) : null}
    </main>
  );
}
