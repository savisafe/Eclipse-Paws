import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import type { GameInputState } from '@adapters/input/index';
import type { CampaignLevelDefinition } from '@content/index';
import { PrototypeScene } from './prototype-scene';

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
}

export function createPrototypeGame(options: CreatePrototypeGameOptions): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: options.parent,
    backgroundColor: '#171738',
    render: { antialias: true, pixelArt: false, roundPixels: false },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: {
      default: 'arcade',
      arcade: { debug: false, gravity: { x: 0, y: 1050 }, fixedStep: true },
    },
    scene: new PrototypeScene(options),
    input: { activePointers: 2 },
  });
}
