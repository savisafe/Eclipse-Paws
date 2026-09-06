import Phaser from 'phaser';
import type { Destroyable } from './destroyable';

export interface TutorialSignals {
  attacked: boolean;
  interacted: boolean;
  jumped: boolean;
  moved: boolean;
  switched: boolean;
}

export interface TutorialStep {
  signal?: keyof TutorialSignals;
  text: string;
}

const DEFAULT_STEPS: readonly TutorialStep[] = [
  { text: '1/5 · ДВИЖЕНИЕ\nA / D или ◀ / ▶', signal: 'moved' },
  { text: '2/5 · ПРЫЖОК\nSPACE / W или ▲', signal: 'jumped' },
  { text: '3/5 · АТАКА\n1 или ✦', signal: 'attacked' },
  { text: '4/5 · СМЕНА КОТА\nTAB или ↔', signal: 'switched' },
  { text: '5/5 · ПЕРВАЯ ПЕЧАТЬ\nПодойди к руне 1 и нажми E', signal: 'interacted' },
];

export const GARDEN_TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    text: 'СВЯЗЬ ГЕРОЕВ\nОбщая шкала справа — это ваши жизни. Иди вправо  ·  A / D',
    signal: 'moved',
  },
  { text: 'ДВИЖЕНИЕ\nПерепрыгни корень  ·  SPACE / W', signal: 'jumped' },
  {
    text: 'ДВА ГЕРОЯ\nПередай управление Ноксу. Второй кот будет следовать за вами  ·  TAB',
    signal: 'switched',
  },
  { text: 'СПОСОБНОСТИ\nВернись к Люмусу и примени «Оглушающий крик» у колокольчиков  ·  1' },
  {
    text: 'ТЬМА НОКСА\nПереключись на Нокса и используй «Теневой наскок» на синем бутоне, чтобы открыть изгородь  ·  1',
  },
  { text: 'ГЛАВНАЯ ЦЕЛЬ\nНайди след Элиаса. Иди к домику Садовника и поговори с ним  ·  E' },
];

export class TutorialSystem implements Destroyable {
  readonly #icon: Phaser.GameObjects.Arc;
  readonly #panel: Phaser.GameObjects.Container;
  readonly #panelFrame: Phaser.GameObjects.Graphics;
  readonly #reducedMotion: boolean;
  readonly #scene: Phaser.Scene;
  readonly #text: Phaser.GameObjects.Text;
  readonly #title: Phaser.GameObjects.Text;
  readonly #worldMark: Phaser.GameObjects.Container;
  readonly #onStepChange?: (step: number, completed: boolean) => void;
  readonly #steps: readonly TutorialStep[];
  #active = false;
  #completionCall: Phaser.Time.TimerEvent | null = null;
  #finished = false;
  #occluded = false;
  #panelPlacement = '';
  #step = 0;

  constructor(
    scene: Phaser.Scene,
    reducedMotion: boolean,
    steps: readonly TutorialStep[] = DEFAULT_STEPS,
    onStepChange?: (step: number, completed: boolean) => void,
  ) {
    this.#scene = scene;
    this.#reducedMotion = reducedMotion;
    this.#steps = steps;
    this.#onStepChange = onStepChange;
    this.#panelFrame = scene.add.graphics();
    this.#drawPanelFrame();
    this.#icon = scene.add.circle(-186, 0, 24, 0xffcf62, 1).setStrokeStyle(3, 0xfff1bd, 1);
    const bang = scene.add
      .text(-186, -2, '!', {
        color: '#21183f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '25px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.#title = scene.add
      .text(-148, -29, '', {
        color: '#704814',
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.#text = scene.add
      .text(-148, -8, '', {
        color: '#2d2540',
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        lineSpacing: 4,
        wordWrap: { width: 318, useAdvancedWrap: true },
      })
      .setOrigin(0, 0);
    this.#panel = scene.add
      .container(330, 555, [this.#panelFrame, this.#icon, bang, this.#title, this.#text])
      .setScrollFactor(0)
      .setDepth(38)
      .setVisible(false);
    const markCircle = scene.add.circle(0, 0, 25, 0xffc94f, 1).setStrokeStyle(4, 0xffffff, 1);
    const markText = scene.add
      .text(0, -2, '!', {
        color: '#251a43',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.#worldMark = scene.add
      .container(0, 0, [markCircle, markText])
      .setDepth(40)
      .setVisible(false);
    if (!reducedMotion)
      scene.tweens.add({
        targets: [this.#icon, this.#worldMark],
        scale: 1.12,
        duration: 720,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
  }

  observe(signals: TutorialSignals, actor: Phaser.Physics.Arcade.Sprite): void {
    if (!this.#active || this.#finished) return;
    this.#positionMark(actor);
    const step = this.#steps[this.#step];
    if (!step?.signal || !signals[step.signal]) return;
    if (step.signal === 'interacted' && Math.abs(actor.x - 900) >= 115) return;
    this.#advance();
  }

  complete(stepIndex: number): void {
    if (!this.#active || this.#finished || this.#step !== stepIndex) return;
    this.#advance();
  }

  start(step = 0): void {
    this.#completionCall?.remove(false);
    this.#finished = false;
    this.#active = true;
    this.#step = Phaser.Math.Clamp(step, 0, this.#steps.length - 1);
    this.#panelPlacement = '';
    this.#showStepText(this.#steps[this.#step]?.text ?? '');
    this.#panel.setAlpha(1).setVisible(!this.#occluded);
    this.#worldMark.setAlpha(1).setVisible(!this.#occluded);
    this.#onStepChange?.(this.#step, false);
  }

  stop(): void {
    this.#active = false;
    this.#panel.setVisible(false);
    this.#worldMark.setVisible(false);
  }

  /** Story dialogue always owns the screen; tutorial state waits invisibly underneath it. */
  setOccluded(occluded: boolean): void {
    if (this.#occluded === occluded) return;
    this.#occluded = occluded;
    const visible = this.#active && !this.#finished && !occluded;
    this.#panel.setVisible(visible);
    this.#worldMark.setVisible(visible);
    if (visible) this.#panelPlacement = '';
  }

  #advance(): void {
    this.#step += 1;
    if (this.#step < this.#steps.length) {
      this.#showStepText(this.#steps[this.#step]?.text ?? '');
      this.#panelPlacement = '';
      this.#onStepChange?.(this.#step, false);
      return;
    }
    this.#finished = true;
    this.#active = false;
    this.#worldMark.setVisible(false);
    this.#onStepChange?.(this.#step, true);
    this.#showStepText('ГОТОВО\n✓ Обучение завершено');
    this.#completionCall = this.#scene.time.delayedCall(this.#reducedMotion ? 500 : 1000, () => {
      this.#scene.tweens.add({
        targets: this.#panel,
        alpha: 0,
        y: this.#panel.y - 18,
        duration: this.#reducedMotion ? 1 : 420,
        onComplete: () => this.#panel.setVisible(false),
      });
    });
  }

  #positionMark(actor: Phaser.Physics.Arcade.Sprite): void {
    const targets: Record<number, { x: number; y: number }> = {
      3: { x: 1080, y: 455 },
      4: { x: 2100, y: 410 },
      5: { x: 4176, y: 390 },
    };
    const target = targets[this.#step] ?? { x: actor.x + 75, y: actor.y - 105 };
    this.#worldMark.setPosition(target.x, target.y);
    this.#positionPanel(target);
  }

  #positionPanel(target: { x: number; y: number }): void {
    const camera = this.#scene.cameras.main;
    const screenX = (target.x - camera.worldView.x) * camera.zoom;
    const screenY = (target.y - camera.worldView.y) * camera.zoom;
    const horizontal = screenX < camera.width / 2 ? 'right' : 'left';
    const vertical = screenY < camera.height / 2 ? 'bottom' : 'top';
    const placement = `${horizontal}-${vertical}`;
    if (placement === this.#panelPlacement) return;
    this.#panelPlacement = placement;
    const x = horizontal === 'right' ? camera.width - 250 : 250;
    const y = vertical === 'bottom' ? camera.height - 155 : 155;
    this.#scene.tweens.killTweensOf(this.#panel);
    if (this.#reducedMotion) this.#panel.setPosition(x, y);
    else this.#scene.tweens.add({ targets: this.#panel, x, y, duration: 420, ease: 'Cubic.Out' });
  }

  #showStepText(value: string): void {
    const [title, ...body] = value.split('\n');
    this.#title.setText(title ?? '');
    this.#text.setText(body.join('\n')).setColor('#2d2540');
    this.#scene.tweens.killTweensOf([this.#title, this.#text]);
    if (this.#reducedMotion) {
      this.#title.setAlpha(1).setX(-148);
      this.#text.setAlpha(1).setX(-148);
      return;
    }
    this.#title.setAlpha(0).setX(-122);
    this.#text.setAlpha(0).setX(-108);
    this.#scene.tweens.add({
      targets: this.#title,
      x: -148,
      alpha: 1,
      duration: 280,
      ease: 'Cubic.Out',
    });
    this.#scene.tweens.add({
      targets: this.#text,
      x: -148,
      alpha: 1,
      delay: 80,
      duration: 360,
      ease: 'Cubic.Out',
    });
  }

  #drawPanelFrame(): void {
    const frame = this.#panelFrame;
    frame.fillStyle(0x171638, 0.45);
    frame.fillRoundedRect(-222, -68, 444, 136, 24);
    frame.fillStyle(0xfff0c4, 0.98);
    frame.fillRoundedRect(-214, -62, 428, 124, 20);
    frame.fillStyle(0xf3d994, 0.3);
    frame.fillRoundedRect(-205, -53, 410, 106, 16);
    frame.lineStyle(3, 0xd99b3c, 0.95);
    frame.strokeRoundedRect(-214, -62, 428, 124, 20);
    frame.lineStyle(1, 0x7b5ab7, 0.65);
    frame.strokeRoundedRect(-207, -55, 414, 110, 16);
    frame.fillStyle(0x6ae2dc, 0.9);
    frame.fillTriangle(-214, 0, -224, -8, -224, 8);
    frame.fillStyle(0xffce63, 0.9);
    frame.fillTriangle(214, 0, 224, -8, 224, 8);
  }

  destroy(): void {
    this.#scene.tweens.killTweensOf([
      this.#icon,
      this.#worldMark,
      this.#panel,
      this.#title,
      this.#text,
    ]);
    this.#completionCall?.remove(false);
    this.#panel.destroy(true);
    this.#worldMark.destroy(true);
  }
}
