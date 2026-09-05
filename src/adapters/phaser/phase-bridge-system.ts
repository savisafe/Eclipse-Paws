import Phaser from 'phaser';
import type { CampaignLevelDefinition, PlatformRect } from '@content/index';
import type { CatId, Phase } from '@core/index';

interface BridgeView {
  body: Phaser.Physics.Arcade.StaticBody;
  requiredPhase: Phase;
  view: Phaser.GameObjects.TileSprite;
}

export class PhaseBridgeSystem {
  readonly #bridges: BridgeView[];
  #eclipse = false;
  #phase: Phase = 'day';

  constructor(
    scene: Phaser.Scene,
    actors: Record<CatId, Phaser.Physics.Arcade.Sprite>,
    platforms: readonly PlatformRect[],
    mechanic: CampaignLevelDefinition['mechanic'],
  ) {
    this.#bridges = platforms.map((platform, index) => {
      const requiredPhase: Phase =
        mechanic === 'shadow-bridges' || index % 2 === 1 ? 'night' : 'day';
      const view = scene.add
        .tileSprite(platform.x, platform.y, platform.width, platform.height, 'garden-platform-tile')
        .setTileScale(0.22)
        .setTint(requiredPhase === 'night' ? 0x8066b8 : 0xe2c878)
        .setDepth(2);
      scene.physics.add.existing(view, true);
      const body = view.body as Phaser.Physics.Arcade.StaticBody;
      scene.physics.add.collider(Object.values(actors), view);
      return { body, requiredPhase, view };
    });
  }

  update(phase: Phase): void {
    this.#phase = phase;
    this.#refresh();
  }

  // Затмение (§12): "скрытые элементы обеих фаз видны одновременно" — during the twilight window
  // both the day and the night geometry is solid and visible at once.
  setEclipse(active: boolean): void {
    if (this.#eclipse === active) return;
    this.#eclipse = active;
    this.#refresh();
  }

  #refresh(): void {
    this.#bridges.forEach((bridge) => {
      const active = this.#eclipse || bridge.requiredPhase === this.#phase;
      bridge.body.enable = active;
      bridge.view.setAlpha(
        bridge.requiredPhase === this.#phase ? 0.92 : this.#eclipse ? 0.66 : 0.12,
      );
    });
  }
}
