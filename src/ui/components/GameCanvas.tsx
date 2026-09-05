import { useEffect, useRef, useState } from 'react';
import type { GameplayController } from '@application/index';
import { KeyboardInputAdapter, type GameInputState } from '@adapters/input/index';
import type { CampaignLevelDefinition } from '@content/index';
import { readDebugLaunchParams } from '@ui/debug-launch';

interface GameCanvasProps {
  gameplay: GameplayController;
  inputState: GameInputState;
  level: CampaignLevelDefinition;
  onPauseRequested: () => void;
  onLevelCompleted: () => void;
  onReady: () => void;
  reducedMotion: boolean;
  effectsVolume: number;
  vibration: boolean;
}

export function GameCanvas({
  gameplay,
  inputState,
  level,
  onPauseRequested,
  onLevelCompleted,
  onReady,
  reducedMotion,
  effectsVolume,
  vibration,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const keyboard = new KeyboardInputAdapter(inputState);
    const disconnectKeyboard = keyboard.connect();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !gameplay.getSnapshot().paused) {
        onPauseRequested();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    let cancelled = false;
    let game: { destroy: (removeCanvas: boolean) => void } | undefined;

    void import('@adapters/phaser/create-prototype-game')
      .then(({ createPrototypeGame }) => {
        if (cancelled) return;
        const { startNearCombat, startNearFinish } = readDebugLaunchParams();
        game = createPrototypeGame({
          gameplay,
          inputState,
          level,
          onPauseRequested,
          onLevelCompleted,
          onReady,
          parent,
          reducedMotion,
          effectsVolume,
          vibration,
          startNearFinish,
          startNearCombat,
        });
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
      disconnectKeyboard();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      game?.destroy(true);
    };
  }, [
    effectsVolume,
    gameplay,
    inputState,
    level,
    onLevelCompleted,
    onPauseRequested,
    onReady,
    reducedMotion,
    vibration,
  ]);

  return (
    <div className="game-canvas-shell">
      <div className="game-canvas" ref={containerRef} />
      {loadError ? (
        <p className="game-load-error" role="alert">
          Не удалось пробудить арену. Обновите страницу.
        </p>
      ) : null}
    </div>
  );
}
