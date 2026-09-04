import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import { PROTOTYPE_ABILITIES, PROTOTYPE_SPECIAL_ABILITIES } from '@content/index';
import { dominantCatForPhase, type CatId } from '@core/index';
import { ATLAS_TEXTURE_KEY, EFFECT_FRAMES } from './sprite-atlas';

export interface EffectTarget {
  id: string;
  sprite: Phaser.Physics.Arcade.Sprite;
}

function targetsInFront(
  actor: Phaser.Physics.Arcade.Sprite,
  targets: readonly EffectTarget[],
  facing: number,
  range: number,
): EffectTarget[] {
  const inFront = targets.filter(({ sprite }) => {
    if (!sprite.active) return false;
    const dx = sprite.x - actor.x;
    return (
      Math.abs(dx) <= range &&
      Math.sign(dx || facing) === facing &&
      Math.abs(sprite.y - actor.y) < 170
    );
  });
  inFront.sort(
    (first, second) => Math.abs(first.sprite.x - actor.x) - Math.abs(second.sprite.x - actor.x),
  );
  return inFront;
}

function targetsInRadius(
  actor: Phaser.Physics.Arcade.Sprite,
  targets: readonly EffectTarget[],
  range: number,
): EffectTarget[] {
  const candidates = targets.filter(
    ({ sprite }) =>
      sprite.active && Phaser.Math.Distance.Between(actor.x, actor.y, sprite.x, sprite.y) <= range,
  );
  candidates.sort(
    (first, second) =>
      Phaser.Math.Distance.Between(actor.x, actor.y, first.sprite.x, first.sprite.y) -
      Phaser.Math.Distance.Between(actor.x, actor.y, second.sprite.x, second.sprite.y),
  );
  return candidates;
}

function fadeGraphics(
  scene: Phaser.Scene,
  graphics: Phaser.GameObjects.Graphics,
  duration = 220,
): void {
  scene.tweens.add({
    targets: graphics,
    alpha: 0,
    duration,
    onComplete: () => graphics.destroy(),
  });
}

function showHitFeedback(
  scene: Phaser.Scene,
  target: EffectTarget,
  damage: number,
  empowered: boolean,
): void {
  target.sprite.setTintFill(empowered ? 0xffffff : 0x8c899a);
  scene.time.delayedCall(90, () => target.sprite.clearTint());
  const label = scene.add
    .text(target.sprite.x, target.sprite.y - 60, `${Math.round(damage)}`, {
      color: empowered ? '#fff0a6' : '#c7c5d4',
      fontFamily: 'system-ui, sans-serif',
      fontSize: empowered ? '22px' : '15px',
      fontStyle: 'bold',
      stroke: '#17152f',
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(20);
  scene.tweens.add({
    targets: label,
    y: label.y - 34,
    alpha: 0,
    duration: 420,
    onComplete: () => label.destroy(),
  });
}

export function playPrimaryAttack(
  scene: Phaser.Scene,
  gameplay: GameplayController,
  actor: Phaser.Physics.Arcade.Sprite,
  catId: CatId,
  facing: number,
  targets: readonly EffectTarget[],
  _reducedMotion = false,
): void {
  const config = PROTOTYPE_ABILITIES[catId];
  const empowered = dominantCatForPhase(gameplay.getSnapshot().phase) === catId;
  const graphics = scene.add.graphics().setDepth(12);
  const color = catId === 'luma' ? 0xffe38a : 0x9b67ef;
  graphics.lineStyle(catId === 'luma' ? 12 : 18, color, empowered ? 0.95 : 0.28);
  graphics.beginPath();
  graphics.arc(
    actor.x + facing * 52,
    actor.y,
    48,
    facing > 0 ? -0.9 : 2.2,
    facing > 0 ? 0.9 : 4.05,
  );
  graphics.strokePath();
  fadeGraphics(scene, graphics, _reducedMotion ? 1 : 180);

  const target = targetsInFront(actor, targets, facing, config.range)[0];
  if (target) {
    const result = gameplay.attackEnemy(target.id);
    if (result) showHitFeedback(scene, target, result.damage, empowered);
  }
}

function drawLightning(
  scene: Phaser.Scene,
  actor: Phaser.Physics.Arcade.Sprite,
  target: Phaser.Physics.Arcade.Sprite,
  reducedMotion: boolean,
): void {
  const graphics = scene.add.graphics().setDepth(14);
  graphics.lineStyle(8, 0xffef9b, 1);
  graphics.beginPath();
  graphics.moveTo(actor.x + 20, actor.y - 18);
  const segments = 7;
  for (let index = 1; index <= segments; index += 1) {
    const progress = index / segments;
    const x = Phaser.Math.Linear(actor.x + 20, target.x, progress);
    const y = Phaser.Math.Linear(actor.y - 18, target.y, progress) + (index % 2 === 0 ? 18 : -18);
    graphics.lineTo(x, y);
  }
  graphics.strokePath();
  graphics.lineStyle(3, 0x63dcff, 0.85);
  graphics.lineBetween(target.x, target.y, target.x - 40, target.y - 55);
  graphics.lineBetween(target.x, target.y, target.x + 48, target.y - 45);
  fadeGraphics(scene, graphics, 320);
  const paintedLightning = scene.add
    .image(target.x, target.y - 55, ATLAS_TEXTURE_KEY, EFFECT_FRAMES.lightning)
    .setScale(0.58)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(15);
  scene.tweens.add({
    targets: paintedLightning,
    alpha: 0,
    duration: 360,
    onComplete: () => paintedLightning.destroy(),
  });
  if (!reducedMotion) scene.cameras.main.flash(90, 255, 233, 130, false);
}

function drawShadowSpike(scene: Phaser.Scene, x: number, y: number, index: number): void {
  const spike = scene.add
    .image(x, y, ATLAS_TEXTURE_KEY, EFFECT_FRAMES.shadowSpikes)
    .setOrigin(0.5, 0.78)
    .setScale(0.34 + index * 0.025, 0.04)
    .setDepth(13);
  scene.tweens.add({
    targets: spike,
    scaleY: 0.34 + index * 0.025,
    duration: 150,
    yoyo: true,
    hold: 180,
    onComplete: () => spike.destroy(),
  });
}

export function playSpecialAbility(
  scene: Phaser.Scene,
  gameplay: GameplayController,
  actor: Phaser.Physics.Arcade.Sprite,
  catId: CatId,
  facing: number,
  targets: readonly EffectTarget[],
  reducedMotion = false,
): boolean {
  const config = PROTOTYPE_SPECIAL_ABILITIES[catId];
  const inRange =
    catId === 'luma'
      ? targetsInRadius(actor, targets, config.range)
      : targetsInFront(actor, targets, facing, config.range);

  const target = inRange[0];
  if (!target) return false;
  const result = gameplay.useSpecialAbility(target.id);
  if (!result) return false;

  if (catId === 'luma') {
    drawLightning(scene, actor, target.sprite, reducedMotion);
    showHitFeedback(
      scene,
      target,
      result.damage,
      dominantCatForPhase(gameplay.getSnapshot().phase) === catId,
    );
    return true;
  }

  const groundY = actor.y + 45;
  for (let index = 0; index < 5; index += 1) {
    drawShadowSpike(scene, actor.x + facing * (55 + index * 52), groundY, index);
  }
  showHitFeedback(
    scene,
    target,
    result.damage,
    dominantCatForPhase(gameplay.getSnapshot().phase) === catId,
  );
  if (!reducedMotion) scene.cameras.main.shake(180, 0.006);
  return true;
}
