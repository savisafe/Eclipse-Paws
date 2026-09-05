import Phaser from 'phaser';
import type { Destroyable } from '../destroyable';

const KEY_PATTERN = /\s*\[([^\]]+)]\s*$/;

/**
 * The little "what does [E] do here" plaque above props and NPCs.
 *
 * It is drawn rather than dropped into a `Phaser.Text` background, because a hard black rectangle
 * over the painted garden reads as a debug label. The plaque keeps the HUD's own language — deep
 * blue, thin gold border, the key in its own cap — so an interaction hint looks like part of the
 * game (§14: hints are shown visually first, and important information never depends on colour
 * alone).
 */
export class GardenPrompt implements Destroyable {
  readonly #cap: Phaser.GameObjects.Graphics;
  readonly #capLabel: Phaser.GameObjects.Text;
  readonly #container: Phaser.GameObjects.Container;
  readonly #label: Phaser.GameObjects.Text;
  readonly #plaque: Phaser.GameObjects.Graphics;
  #text = '';

  constructor(scene: Phaser.Scene, depth = 30) {
    this.#plaque = scene.add.graphics();
    this.#label = scene.add
      .text(0, 0, '', {
        color: '#fff6db',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.#cap = scene.add.graphics();
    this.#capLabel = scene.add
      .text(0, 0, '', {
        color: '#2a2140',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.#container = scene.add
      .container(0, 0, [this.#plaque, this.#label, this.#cap, this.#capLabel])
      .setDepth(depth)
      .setVisible(false);
  }

  get visible(): boolean {
    return this.#container.visible;
  }

  hide(): void {
    this.#container.setVisible(false);
  }

  show(text: string, x: number, y: number): void {
    if (text !== this.#text) this.#render(text);
    this.#container.setPosition(Math.round(x), Math.round(y)).setVisible(true);
  }

  destroy(): void {
    this.#container.destroy(true);
  }

  #render(text: string): void {
    this.#text = text;
    // A trailing "[E]" becomes a key cap instead of literal brackets in the sentence.
    const key = KEY_PATTERN.exec(text)?.[1] ?? null;
    const label = key ? text.replace(KEY_PATTERN, '') : text;
    this.#label.setText(label);

    const capWidth = key ? Math.max(24, key.length * 11 + 12) : 0;
    const gap = key ? 9 : 0;
    const paddingX = 13;
    const width = paddingX * 2 + this.#label.width + gap + capWidth;
    const height = 32;

    this.#plaque.clear();
    this.#plaque.fillStyle(0x0d1030, 0.82);
    this.#plaque.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    this.#plaque.lineStyle(2, 0xffd873, 0.6);
    this.#plaque.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    this.#label.setPosition(-width / 2 + paddingX, 0);

    this.#cap.clear();
    this.#capLabel.setText(key ?? '');
    if (!key) {
      this.#capLabel.setVisible(false);
      return;
    }
    const capX = width / 2 - paddingX - capWidth;
    this.#cap.fillStyle(0xffe8ab, 0.95);
    this.#cap.fillRoundedRect(capX, -11, capWidth, 22, 7);
    this.#capLabel.setPosition(capX + capWidth / 2, 0).setVisible(true);
  }
}
