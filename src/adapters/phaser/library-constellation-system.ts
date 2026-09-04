import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import { SequencePuzzle, type CatId, type Phase } from '@core/index';

const MIRRORS = [
  { id: 'sun', x: 1120, required: 'day', icon: '☀', title: 'ЗЕРКАЛО СОЛНЦА' },
  { id: 'moon', x: 2550, required: 'night', icon: '☾', title: 'ЗЕРКАЛО ЛУНЫ' },
  { id: 'eclipse', x: 3970, required: 'day', icon: '◐', title: 'ЗЕРКАЛО ЗАТМЕНИЯ' },
] as const;

interface MirrorView {
  core: Phaser.GameObjects.Arc;
  id: string;
  required: Phase;
  status: Phaser.GameObjects.Text;
  view: Phaser.GameObjects.Container;
}

export class LibraryConstellationSystem {
  readonly #barrier: Phaser.GameObjects.Rectangle;
  readonly #gameplay: GameplayController;
  readonly #mirrors: MirrorView[];
  readonly #puzzle = new SequencePuzzle(MIRRORS.map((mirror) => mirror.id));
  readonly #scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    gameplay: GameplayController,
    actors: Record<CatId, Phaser.Physics.Arcade.Sprite>,
  ) {
    this.#scene = scene;
    this.#gameplay = gameplay;
    this.#mirrors = MIRRORS.map((mirror) => {
      const color = mirror.required === 'day' ? 0xffd46f : 0x9a7bea;
      const shadow = scene.add.circle(0, 7, 59, 0x0d1230, 0.92);
      const outer = scene.add.circle(0, 0, 55, 0x1c2349, 0.94).setStrokeStyle(7, color, 0.94);
      const inner = scene.add.circle(0, 0, 40, 0x111936, 1).setStrokeStyle(3, 0xe8ecff, 0.76);
      const core = scene.add.circle(0, 0, 29, color, 0.32);
      const icon = scene.add
        .text(0, -2, mirror.icon, {
          color: mirror.required === 'day' ? '#fff0a0' : '#e5d7ff',
          fontFamily: 'Georgia, serif',
          fontSize: '39px',
          fontStyle: 'bold',
          stroke: '#11162f',
          strokeThickness: 5,
        })
        .setOrigin(0.5);
      const title = scene.add
        .text(0, -78, mirror.title, {
          color: '#fff5d1',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          stroke: '#11162f',
          strokeThickness: 5,
        })
        .setOrigin(0.5);
      const status = scene.add
        .text(0, 75, `[E] ФАЗА: ${mirror.required === 'day' ? 'ДЕНЬ' : 'НОЧЬ'}`, {
          color: '#d9dcf3',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
          padding: { x: 7, y: 3 },
          backgroundColor: 'rgba(12, 16, 42, 0.88)',
          stroke: '#11162f',
          strokeThickness: 3,
        })
        .setOrigin(0.5);
      const view = scene.add
        .container(mirror.x, 520, [shadow, outer, inner, core, icon, title, status])
        .setDepth(8);
      scene.tweens.add({ targets: outer, angle: 360, duration: 5200, repeat: -1 });
      return { core, id: mirror.id, required: mirror.required, status, view };
    });
    this.#barrier = scene.add.rectangle(4300, 300, 82, 680, 0xc7d5ff, 0.72).setDepth(9);
    this.#barrier.setStrokeStyle(5, 0xffffff, 0.88);
    scene.physics.add.existing(this.#barrier, true);
    scene.physics.add.collider(Object.values(actors), this.#barrier);
    this.applyPhase('day');
  }

  get solved(): boolean {
    return this.#puzzle.solved;
  }

  applyPhase(phase: Phase): void {
    this.#mirrors.forEach((mirror) => {
      const available = mirror.required === phase;
      mirror.view.setAlpha(available ? 1 : 0.55);
      mirror.status
        .setText(
          available
            ? '[E] АКТИВИРОВАТЬ'
            : `[E] НУЖЕН ${mirror.required === 'day' ? 'ДЕНЬ' : 'НОЧЬ'}`,
        )
        .setColor(available ? '#91f4eb' : '#d3cde3');
    });
  }

  interact(active: Phaser.Physics.Arcade.Sprite, phase: Phase): void {
    const mirror = this.#mirrors.find(
      (candidate) =>
        Phaser.Math.Distance.Between(active.x, active.y, candidate.view.x, candidate.view.y) < 105,
    );
    if (!mirror) return;
    if (mirror.required !== phase) {
      mirror.status
        .setText(`СМЕНИ ФАЗУ НА ${mirror.required === 'day' ? 'ДЕНЬ' : 'НОЧЬ'}`)
        .setColor('#ff8b9e');
      this.#scene.tweens.add({
        targets: mirror.view,
        x: mirror.view.x + 8,
        duration: 55,
        yoyo: true,
        repeat: 3,
      });
      return;
    }
    const result = this.#puzzle.activate(mirror.id);
    if (!result.accepted) {
      mirror.status.setText('НУЖНО ДРУГОЕ ЗЕРКАЛО').setColor('#ff8b9e');
      return;
    }
    mirror.core.setAlpha(1).setScale(1.2);
    mirror.status.setText('ЗАЖЖЕНО ✓').setColor('#fff0a0');
    this.#scene.tweens.add({ targets: mirror.view, scale: 1.16, duration: 190, yoyo: true });
    if (result.solved) this.#complete();
  }

  #complete(): void {
    this.#gameplay.rewardEclipse(30);
    const body = this.#barrier.body as Phaser.Physics.Arcade.StaticBody;
    body.enable = false;
    this.#scene.tweens.add({
      targets: this.#barrier,
      alpha: 0,
      scaleY: 0,
      duration: 620,
      onComplete: () => this.#barrier.destroy(),
    });
  }
}
