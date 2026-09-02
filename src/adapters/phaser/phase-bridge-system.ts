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
    this.#bridges.forEach((bridge) => {
      const active = bridge.requiredPhase === phase;
      bridge.body.enable = active;
      bridge.view.setAlpha(active ? 0.92 : 0.12);
    });
  }
}
