import { useEffect, useRef, useState } from 'react';
import type { GameplayController } from '@application/index';
import { KeyboardInputAdapter, type GameInputState } from '@adapters/input/index';
import type { CampaignLevelDefinition } from '@content/index';
import { readDebugLaunchParams } from '@ui/debug-launch';

interface NightBrightnessScene {
  setNightBrightness?: (value: number) => void;
}

interface PhaserGameHandle {
  destroy: (removeCanvas: boolean) => void;
  scene: { getScene: (key: string) => unknown };
}

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
  nightBrightness: number;
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
  nightBrightness,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Night brightness is the one setting that must apply без перезапуска сцены: it is an
  // accessibility control the player reaches from the pause menu mid-level (§14).
  const gameRef = useRef<PhaserGameHandle | null>(null);
  // Held in a ref so changing it never re-creates the Phaser game (which would restart the level);
  // the effect below pushes new values into the running scene instead.
  const nightBrightnessRef = useRef(nightBrightness);
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
    let game: PhaserGameHandle | undefined;

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
          nightBrightness: nightBrightnessRef.current,
          startNearFinish,
          startNearCombat,
        });
        gameRef.current = game ?? null;
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
      disconnectKeyboard();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      gameRef.current = null;
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

  useEffect(() => {
    nightBrightnessRef.current = nightBrightness;
    const scene = gameRef.current?.scene.getScene('prototype-platformer') as
      NightBrightnessScene | null | undefined;
    scene?.setNightBrightness?.(nightBrightness);
  }, [nightBrightness]);

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
