import Phaser from 'phaser';
import type { CampaignLevelDefinition, PlatformRect } from '@content/index';
import type { CatId, Phase } from '@core/index';

interface BridgeView {
  body: Phaser.Physics.Arcade.StaticBody;
  requiredPhase: Phase;
  view: Phaser.GameObjects.GameObject & { setAlpha: (value: number) => unknown };
}

// «Сад первой зари» (§12) names both halves of this mechanic: by day you stand on the wide petals
// of an opened light flower, by night on the shadow a tree casts across the path. The garden draws
// them as those two things instead of as a tinted stone slab.
function createGardenBridge(
  scene: Phaser.Scene,
  platform: PlatformRect,
  requiredPhase: Phase,
): Phaser.GameObjects.Container {
  const parts: Phaser.GameObjects.GameObject[] = [];
  if (requiredPhase === 'night') {
    const shadow = scene.add.graphics();
    shadow.fillStyle(0x2a2350, 0.85);
    shadow.fillRoundedRect(
      -platform.width / 2,
      -platform.height / 2,
      platform.width,
      platform.height,
      13,
    );
    shadow.fillStyle(0x160f33, 0.75);
    shadow.fillRoundedRect(
      -platform.width / 2 + 6,
      -platform.height / 2 + 5,
      platform.width - 12,
      platform.height - 10,
      10,
    );
    shadow.lineStyle(2, 0x9f8cf0, 0.6);
    shadow.strokeRoundedRect(
      -platform.width / 2,
      -platform.height / 2,
      platform.width,
      platform.height,
      13,
    );
    parts.push(shadow);
  } else {
    const petals = scene.add.graphics();
    petals.fillStyle(0xffe6a8, 0.92);
    petals.fillRoundedRect(
      -platform.width / 2,
      -platform.height / 2,
      platform.width,
      platform.height,
      13,
    );
    petals.fillStyle(0xffd070, 0.85);
    petals.fillRoundedRect(
      -platform.width / 2,
      -platform.height / 2 + platform.height * 0.55,
      platform.width,
      platform.height * 0.45,
      10,
    );
    parts.push(petals);
    for (let offset = -platform.width / 2 + 22; offset < platform.width / 2 - 10; offset += 44) {
      const petal = scene.add
        .ellipse(offset, -platform.height / 2 - 3, 38, 16, 0xfff3cf, 0.9)
        .setAngle(offset > 0 ? 8 : -8);
      parts.push(petal);
    }
  }
  return scene.add.container(platform.x, platform.y, parts).setDepth(2);
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
    garden = false,
  ) {
    this.#bridges = platforms.map((platform, index) => {
      const requiredPhase: Phase =
        mechanic === 'shadow-bridges' || index % 2 === 1 ? 'night' : 'day';
      const collider = scene.add
        .tileSprite(platform.x, platform.y, platform.width, platform.height, 'garden-platform-tile')
        .setTileScale(0.22)
        .setTint(requiredPhase === 'night' ? 0x8066b8 : 0xe2c878)
        .setDepth(2)
        .setVisible(!garden);
      scene.physics.add.existing(collider, true);
      const body = collider.body as Phaser.Physics.Arcade.StaticBody;
      scene.physics.add.collider(Object.values(actors), collider);
      const view = garden ? createGardenBridge(scene, platform, requiredPhase) : collider;
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
