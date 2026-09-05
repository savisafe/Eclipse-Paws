import Phaser from 'phaser';
import type { Destroyable } from '../destroyable';
import frameUrl from '../../../assets/ui/dialogue-frame-card-v1.png?url';
import {
  portraitForSpeaker,
  portraitKey,
  preloadGardenPortraits,
  type PortraitEmotion,
} from './garden-portraits';

export interface GardenLine {
  /** Which drawn mood the line is spoken in; defaults to neutral. */
  emotion?: PortraitEmotion;
  speaker: string;
  text: string;
}

const FRAME_KEY = 'garden-dialogue-frame';
const CUTOUT_KEY = 'garden-dialogue-portrait-cutout';
const MIST_KEY = 'garden-dialogue-portrait-mist';
const FRAME_WIDTH = 980;
const FRAME_HEIGHT = 327;
const CARD_Y = 542;

// Where the drawn frame puts its own parts, as fractions of the artwork: the round portrait socket
// held by the sun-cat on the left, and the parchment field the text sits on.
const SOCKET = { x: 0.2165, y: 0.466, radius: 0.0685 };
const TEXT_AREA = { left: 0.345, right: 0.86, top: 0.27, bottom: 0.68 };

const TYPE_SPEED_MS = 22;

function frameX(fraction: number): number {
  return (fraction - 0.5) * FRAME_WIDTH;
}

function frameY(fraction: number): number {
  return (fraction - 0.5) * FRAME_HEIGHT;
}

const SOCKET_SIZE = Math.round(SOCKET.radius * FRAME_WIDTH * 2);

// Opaque everywhere except a circle in the middle. Erasing the portrait render texture with it
// leaves exactly the round part that fits the frame's ring.
function ensureCutoutTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(CUTOUT_KEY) && scene.textures.exists(MIST_KEY)) return;
  const canvas = document.createElement('canvas');
  canvas.width = SOCKET_SIZE;
  canvas.height = SOCKET_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is required for the dialogue portrait ring.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, SOCKET_SIZE, SOCKET_SIZE);
  context.globalCompositeOperation = 'destination-out';
  context.beginPath();
  context.arc(SOCKET_SIZE / 2, SOCKET_SIZE / 2, SOCKET_SIZE / 2 - 1, 0, Math.PI * 2);
  context.fill();
  scene.textures.addCanvas(CUTOUT_KEY, canvas);

  const mist = document.createElement('canvas');
  mist.width = SOCKET_SIZE;
  mist.height = SOCKET_SIZE;
  const mistContext = mist.getContext('2d');
  if (!mistContext) throw new Error('Canvas 2D is required for the dialogue portrait mist.');
  const fade = mistContext.createLinearGradient(0, SOCKET_SIZE * 0.58, 0, SOCKET_SIZE);
  fade.addColorStop(0, 'rgba(255, 248, 224, 0)');
  fade.addColorStop(0.62, 'rgba(255, 246, 218, 0.72)');
  fade.addColorStop(1, 'rgba(235, 224, 201, 0.96)');
  mistContext.fillStyle = fade;
  mistContext.fillRect(0, SOCKET_SIZE * 0.52, SOCKET_SIZE, SOCKET_SIZE * 0.48);
  mistContext.fillStyle = 'rgba(255, 250, 232, 0.72)';
  [
    [0.17, 0.82, 0.16],
    [0.36, 0.78, 0.2],
    [0.58, 0.81, 0.18],
    [0.79, 0.77, 0.21],
  ].forEach(([x, y, radius]) => {
    mistContext.beginPath();
    mistContext.arc(x! * SOCKET_SIZE, y! * SOCKET_SIZE, radius! * SOCKET_SIZE, 0, Math.PI * 2);
    mistContext.fill();
  });
  scene.textures.addCanvas(MIST_KEY, mist);
}

/**
 * The dialogue card of «Сад первой зари», built on the drawn frame from the UI kit
 * (`src/assets/ui/dialogue-frame-v1.png`): the sun-cat's ring holds the speaker's portrait, the
 * parchment holds the line, and the moon corner holds the prompt.
 *
 * It lives in the scene rather than in React because garden lines are triggered by world
 * positions and props. Input is never blocked (§14 keeps the game playable and pausable while
 * someone is talking): [E] first finishes the line being typed, then moves to the next one.
 */
export class GardenDialoguePanel implements Destroyable {
  readonly #container: Phaser.GameObjects.Container;
  readonly #hint: Phaser.GameObjects.Text;
  readonly #portrait: Phaser.GameObjects.RenderTexture;
  readonly #portraitMist: Phaser.GameObjects.Image;
  readonly #portraitSource: Phaser.GameObjects.Image;
  readonly #reducedMotion: boolean;
  readonly #scene: Phaser.Scene;
  readonly #speaker: Phaser.GameObjects.Text;
  readonly #text: Phaser.GameObjects.Text;
  // True while the card is fading out. Without it, a press landing inside the fade would be
  // swallowed by the card and restart the fade — mashing [E] next to a prop then looked like the
  // prop was ignoring the player.
  #closing = false;
  #fullText = '';
  #queue: GardenLine[] = [];
  #typer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, reducedMotion: boolean) {
    this.#scene = scene;
    this.#reducedMotion = reducedMotion;

    ensureCutoutTexture(scene);
    const frame = scene.add.image(0, 0, FRAME_KEY).setDisplaySize(FRAME_WIDTH, FRAME_HEIGHT);
    this.#portrait = scene.add
      .renderTexture(frameX(SOCKET.x), frameY(SOCKET.y), SOCKET_SIZE, SOCKET_SIZE)
      .setOrigin(0.5)
      .setVisible(false);
    this.#portraitSource = scene.make.image({ x: 0, y: 0, key: FRAME_KEY }, false);
    this.#portraitMist = scene.make.image({ x: 0, y: 0, key: MIST_KEY }, false);
    this.#speaker = scene.add
      .text(frameX(TEXT_AREA.left), frameY(TEXT_AREA.top), '', {
        color: '#5d3b12',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);
    this.#text = scene.add
      .text(frameX(TEXT_AREA.left), frameY(TEXT_AREA.top) + 36, '', {
        color: '#241d3a',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        lineSpacing: 7,
        wordWrap: { width: (TEXT_AREA.right - TEXT_AREA.left) * FRAME_WIDTH - 18 },
      })
      .setOrigin(0, 0);
    this.#hint = scene.add
      .text(frameX(TEXT_AREA.right), frameY(TEXT_AREA.bottom), '[E] далее', {
        color: '#5b4a7a',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setOrigin(1, 1);

    this.#container = scene.add
      .container(640, CARD_Y, [frame, this.#portrait, this.#speaker, this.#text, this.#hint])
      .setScrollFactor(0)
      .setDepth(42)
      .setVisible(false);
  }

  static preload(scene: Phaser.Scene): void {
    scene.load.image(FRAME_KEY, frameUrl);
    preloadGardenPortraits(scene);
  }

  get busy(): boolean {
    return this.#container.visible && !this.#closing;
  }

  say(lines: readonly GardenLine[]): void {
    if (lines.length === 0) return;
    this.#queue = [...this.#queue, ...lines];
    if (this.#closing) {
      this.#scene.tweens.killTweensOf(this.#container);
      this.#closing = false;
      this.#container.setVisible(false).setAlpha(1).setY(CARD_Y);
    }
    if (!this.#container.visible) this.#showNext();
  }

  /** Returns true when the press was consumed by the card. */
  advance(): boolean {
    if (!this.#container.visible || this.#closing) return false;
    // First press finishes the line being typed; the next one moves on.
    if (this.#typer) {
      this.#finishTyping();
      return true;
    }
    this.#showNext();
    return true;
  }

  #showNext(): void {
    const line = this.#queue.shift();
    if (!line) {
      this.#hide();
      return;
    }

    const speaker = portraitForSpeaker(line.speaker);
    if (speaker) {
      this.#drawPortrait(portraitKey(speaker, line.emotion ?? 'neutral'));
      this.#portrait.setVisible(true);
      this.#pop(this.#portrait);
    } else {
      this.#portrait.setVisible(false);
    }

    this.#speaker.setText(line.speaker);
    this.#fullText = line.text;
    this.#hint.setText(this.#queue.length > 0 ? '[E] далее' : '[E] закрыть');

    const firstLine = !this.#container.visible;
    this.#container.setVisible(true);
    if (firstLine) this.#slideIn();
    this.#startTyping();
  }

  // The frame holds the portrait in a round socket, so the drawn portrait is composed into a
  // render texture and everything outside the circle is erased.
  #drawPortrait(key: string): void {
    const source = this.#portraitSource;
    source.setTexture(key);
    // Portrait cards include the character's chest below the face. Compose the upper 72% and fit
    // that whole region inside the socket; the previous width-fill zoom cut ears, hair and hats.
    const portraitHeight = source.height * 0.72;
    const scale = (SOCKET_SIZE * 0.9) / portraitHeight;
    source.setCrop(0, 0, source.width, portraitHeight);
    source.setScale(scale).setOrigin(0.5);
    this.#portrait.clear();
    this.#portrait.draw(source, SOCKET_SIZE / 2, SOCKET_SIZE / 2);
    this.#portrait.draw(this.#portraitMist, SOCKET_SIZE / 2, SOCKET_SIZE / 2);
    this.#portrait.erase(CUTOUT_KEY, 0, 0);
  }

  #startTyping(): void {
    this.#typer?.remove(false);
    this.#typer = null;
    if (this.#reducedMotion) {
      this.#text.setText(this.#fullText);
      return;
    }
    this.#text.setText('');
    let visible = 0;
    this.#typer = this.#scene.time.addEvent({
      delay: TYPE_SPEED_MS,
      repeat: this.#fullText.length - 1,
      callback: () => {
        visible += 1;
        this.#text.setText(this.#fullText.slice(0, visible));
        if (visible >= this.#fullText.length) {
          this.#typer = null;
        }
      },
    });
  }

  #finishTyping(): void {
    this.#typer?.remove(false);
    this.#typer = null;
    this.#text.setText(this.#fullText);
  }

  #slideIn(): void {
    if (this.#reducedMotion) {
      this.#container.setAlpha(1).setY(CARD_Y);
      return;
    }
    this.#container.setAlpha(0).setY(CARD_Y + 30);
    this.#scene.tweens.add({
      targets: this.#container,
      alpha: 1,
      y: CARD_Y,
      duration: 260,
      ease: 'Back.out',
    });
  }

  #pop(target: Phaser.GameObjects.RenderTexture): void {
    if (this.#reducedMotion) return;
    const scaleX = target.scaleX;
    const scaleY = target.scaleY;
    target.setScale(scaleX * 0.86, scaleY * 0.86);
    this.#scene.tweens.add({
      targets: target,
      scaleX,
      scaleY,
      duration: 220,
      ease: 'Back.out',
    });
  }

  #hide(): void {
    this.#finishTyping();
    if (this.#reducedMotion) {
      this.#container.setVisible(false);
      return;
    }
    this.#closing = true;
    this.#scene.tweens.add({
      targets: this.#container,
      alpha: 0,
      y: CARD_Y + 20,
      duration: 180,
      onComplete: () => {
        this.#closing = false;
        this.#container.setVisible(false).setAlpha(1).setY(CARD_Y);
      },
    });
  }

  destroy(): void {
    this.#queue = [];
    this.#typer?.remove(false);
    this.#scene.tweens.killTweensOf(this.#container);
    this.#scene.tweens.killTweensOf(this.#portrait);
    this.#portraitSource.destroy();
    this.#portraitMist.destroy();
    this.#container.destroy(true);
  }
}
