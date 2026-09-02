import { useEffect, useRef, useState } from 'react';
import type { GameplayController } from '@application/index';
import { KeyboardInputAdapter, type GameInputState } from '@adapters/input/index';

interface GameCanvasProps {
  gameplay: GameplayController;
  inputState: GameInputState;
  onPauseRequested: () => void;
  onLevelCompleted: () => void;
  onReady: () => void;
  reducedMotion: boolean;
}

export function GameCanvas({
  gameplay,
  inputState,
  onPauseRequested,
  onLevelCompleted,
  onReady,
  reducedMotion,
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
        const startNearFinish =
          import.meta.env.DEV && new URLSearchParams(window.location.search).has('startNearFinish');
        const startNearCombat =
          import.meta.env.DEV && new URLSearchParams(window.location.search).has('startNearCombat');
        game = createPrototypeGame({
          gameplay,
          inputState,
          onPauseRequested,
          onLevelCompleted,
          onReady,
          parent,
          reducedMotion,
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
  }, [gameplay, inputState, onLevelCompleted, onPauseRequested, onReady, reducedMotion]);

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
