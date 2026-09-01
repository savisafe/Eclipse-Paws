import { useEffect } from 'react';
import type { GameplayController } from '@application/index';
import type { GameInputState } from '@adapters/input/index';
import type { AppState } from '@core/index';
import { GameCanvas } from './GameCanvas';
import { GameHud } from './GameHud';
import { PauseOverlay } from './PauseOverlay';
import { TouchControls } from './TouchControls';

interface GameScreenProps {
  appState: AppState;
  gameplay: GameplayController;
  inputState: GameInputState;
  onPauseToggle: () => void;
  onReady: () => void;
  onReturnToMenu: () => void;
}

export function GameScreen({
  appState,
  gameplay,
  inputState,
  onPauseToggle,
  onReady,
  onReturnToMenu,
}: GameScreenProps) {
  useEffect(() => gameplay.setPaused(appState === 'paused'), [appState, gameplay]);

  return (
    <main className="game-screen" data-game-state={appState}>
      <GameCanvas
        gameplay={gameplay}
        inputState={inputState}
        onPauseRequested={onPauseToggle}
        onReady={onReady}
      />
      <GameHud gameplay={gameplay} />
      <div className="control-hint" aria-hidden="true">
        A/D — бег · W/Space — прыжок · ЛКМ/J — атака · Q/K — магия · T — checkpoint
      </div>
      <TouchControls inputState={inputState} />
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
