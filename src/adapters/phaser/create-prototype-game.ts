import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { GameInputState } from '@adapters/input/index';
import type { CampaignLevelDefinition } from '@content/index';
import { PrototypeScene } from './prototype-scene';
import { resolveViewport } from './viewport';

export interface CreatePrototypeGameOptions {
  gameplay: GameplayController;
  inputState: GameInputState;
  level: CampaignLevelDefinition;
  onPauseRequested: () => void;
  onLevelCompleted: () => void;
  onReady: () => void;
  parent: HTMLElement;
  reducedMotion: boolean;
  effectsVolume: number;
  vibration: boolean;
  nightBrightness: number;
  startNearFinish: boolean;
  startNearCombat: boolean;
  tutorialActive: boolean;
  tutorialStartStep: number;
  onTutorialStepChange: (step: number, completed: boolean) => void;
}

function measure(parent: HTMLElement): { width: number; height: number } {
  const rect = parent.getBoundingClientRect();
  return {
    width: rect.width || window.innerWidth,
    height: rect.height || window.innerHeight,
  };
}

/**
 * Keeps the game size in step with the element the canvas lives in. A phone changes it far more
 * often than a desktop window does — rotation, the browser's collapsing address bar, and (in
 * portrait) the CSS handing part of the screen to the touch deck — and each of those has to
 * re-derive the field of view, not just re-fit the old one (see `viewport.ts`).
 */
function watchParentSize(game: Phaser.Game, parent: HTMLElement): void {
  let frame = 0;
  const apply = (): void => {
    frame = 0;
    const { width, height } = measure(parent);
    const next = resolveViewport(width, height);
    if (next.width === game.scale.width && next.height === game.scale.height) game.scale.refresh();
    else game.scale.setGameSize(next.width, next.height);
  };
  // Rotation fires resize, orientationchange and a scroll-bar reflow in quick succession; one
  // measurement per frame is enough and keeps Phaser from re-fitting three times.
  const schedule = (): void => {
    if (frame === 0) frame = window.requestAnimationFrame(apply);
  };
  const observer = new ResizeObserver(schedule);
  observer.observe(parent);
  window.addEventListener('orientationchange', schedule);
  game.events.once(Phaser.Core.Events.DESTROY, () => {
    observer.disconnect();
    window.removeEventListener('orientationchange', schedule);
    if (frame !== 0) window.cancelAnimationFrame(frame);
  });
}

export function createPrototypeGame(options: CreatePrototypeGameOptions): Phaser.Game {
  const parent = options.parent;
  const { width, height } = measure(parent);
  const view = resolveViewport(width, height);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: view.width,
    height: view.height,
    parent,
    backgroundColor: '#171738',
    render: { antialias: true, pixelArt: false, roundPixels: false },
    // FIT over an already aspect-matched game size: the canvas fills its element edge to edge,
    // and the letterbox only reappears past the field-of-view caps in `viewport.ts`.
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, expandParent: false },
    physics: {
      default: 'arcade',
      arcade: { debug: false, gravity: { x: 0, y: 1050 }, fixedStep: true },
    },
    scene: new PrototypeScene(options),
    input: { activePointers: 3 },
  });
  watchParentSize(game, parent);
  return game;
}
