import Phaser from 'phaser';
import type { GameplayController } from '@application/index';
import { PRIMARY_ABILITIES, SPECIAL_ABILITIES } from '@content/index';
import { dominantCatForPhase, type CatId } from '@core/index';
import { EFFECT_TEXTURES } from './sprite-atlas';

// Kept in the adapter: it is a feel/animation length, not a rule the core needs to know about.
const DASH_INVULNERABILITY_MS = 320;
const BLINK_DISTANCE = 190;

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

// Оглушающий крик (§12): a shout that briefly stuns everyone nearby and deals little damage —
// its job is to open a safe window, wake sleeping plants and trigger sound mechanisms.
export function playStunningShout(
  scene: Phaser.Scene,
  gameplay: GameplayController,
  actor: Phaser.Physics.Arcade.Sprite,
  reducedMotion: boolean,
  targets: readonly EffectTarget[],
): void {
  const config = PRIMARY_ABILITIES.luma;
  const empowered = dominantCatForPhase(gameplay.getSnapshot().phase) === 'luma';
  const ring = scene.add
    .circle(actor.x, actor.y - 10, config.range * 0.35, 0xffe38a, 0)
    .setStrokeStyle(9, 0xffe9a8, empowered ? 0.95 : 0.45)
    .setDepth(12);
  scene.tweens.add({
    targets: ring,
    scale: 2.6,
    alpha: 0,
    duration: reducedMotion ? 1 : 320,
    onComplete: () => ring.destroy(),
  });

  const inRange = targetsInRadius(actor, targets, config.range);
  if (inRange.length === 0) return;
  gameplay.stunEnemies(inRange.map((target) => target.id));
  inRange.forEach((target) => showStunMark(scene, target, reducedMotion));
  const nearest = inRange[0]!;
  const result = gameplay.attackEnemy(nearest.id);
  if (result) showHitFeedback(scene, nearest, result.damage, empowered);
}

function showStunMark(scene: Phaser.Scene, target: EffectTarget, reducedMotion: boolean): void {
  const mark = scene.add
    .text(target.sprite.x, target.sprite.y - 84, '✷', {
      color: '#ffe9a8',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      stroke: '#17152f',
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(21);
  scene.tweens.add({
    targets: mark,
    angle: reducedMotion ? 0 : 30,
    alpha: 0,
    duration: reducedMotion ? 1 : 900,
    onComplete: () => mark.destroy(),
  });
}

// Теневой наскок (§12): Нокс переносится к отмеченной цели, наносит удар и возвращается в
// исходную точку; во время движения он неуязвим. The return is instant, so the strike is drawn
// as a shadow streak out and back rather than by moving the physics body away from the player.
// A dash with nothing to strike still has to feel like a dash: §12 gives Нокс the move for
// traversal too ("позволяет ... пролетать через узкие теневые проходы"), and the garden has no
// enemies at all until its turning point — so pressing the button there used to do nothing.
export function playShadowBlink(
  scene: Phaser.Scene,
  gameplay: GameplayController,
  actor: Phaser.Physics.Arcade.Sprite,
  facing: number,
  solids: Phaser.Physics.Arcade.StaticGroup,
  reducedMotion = false,
): void {
  gameplay.grantInvulnerability(DASH_INVULNERABILITY_MS);
  const startX = actor.x;
  const body = actor.body as Phaser.Physics.Arcade.Body | null;
  const halfWidth = body ? body.halfWidth : 36;
  const halfHeight = body ? body.halfHeight : 60;

  // Step forward until something solid is in the way, so a blink never lands inside geometry.
  let reached = startX;
  for (let step = 1; step <= 12; step += 1) {
    const candidate = startX + facing * step * (BLINK_DISTANCE / 12);
    const blocked = solids.getChildren().some((child) => {
      const solid = (
        child as Phaser.GameObjects.GameObject & {
          body: Phaser.Physics.Arcade.StaticBody | null;
        }
      ).body;
      if (!solid?.enable) return false;
      return (
        candidate + halfWidth > solid.x &&
        candidate - halfWidth < solid.x + solid.width &&
        actor.y + halfHeight > solid.y &&
        actor.y - halfHeight < solid.y + solid.height
      );
    });
    if (blocked) break;
    reached = candidate;
  }

  const afterimage = scene.add
    .image(startX, actor.y, actor.texture.key, actor.frame.name)
    .setScale(actor.scaleX, actor.scaleY)
    .setFlipX(actor.flipX)
    .setTint(0x9b67ef)
    .setAlpha(0.75)
    .setDepth(5);
  scene.tweens.add({
    targets: afterimage,
    x: reached,
    alpha: 0,
    duration: reducedMotion ? 1 : DASH_INVULNERABILITY_MS * 0.6,
    onComplete: () => afterimage.destroy(),
  });
  actor.setPosition(reached, actor.y);
}

export function playShadowDash(
  scene: Phaser.Scene,
  gameplay: GameplayController,
  actor: Phaser.Physics.Arcade.Sprite,
  facing: number,
  targets: readonly EffectTarget[],
  reducedMotion = false,
): boolean {
  const config = PRIMARY_ABILITIES.nox;
  const target = targetsInFront(actor, targets, facing, config.range)[0];
  if (!target) return false;

  gameplay.grantInvulnerability(DASH_INVULNERABILITY_MS);
  const streak = scene.add
    .line(0, 0, actor.x, actor.y, target.sprite.x, target.sprite.y, 0x9b67ef, 0.9)
    .setOrigin(0, 0)
    .setLineWidth(10)
    .setDepth(13);
  const afterimage = scene.add
    .image(actor.x, actor.y, actor.texture.key, actor.frame.name)
    .setScale(actor.scaleX, actor.scaleY)
    .setFlipX(actor.flipX)
    .setTint(0x9b67ef)
    .setAlpha(0.85)
    .setDepth(14);
  scene.tweens.add({
    targets: afterimage,
    x: target.sprite.x,
    y: target.sprite.y,
    alpha: 0.2,
    duration: reducedMotion ? 1 : DASH_INVULNERABILITY_MS * 0.45,
    yoyo: true,
    onComplete: () => afterimage.destroy(),
  });
  scene.tweens.add({
    targets: streak,
    alpha: 0,
    duration: reducedMotion ? 1 : 260,
    onComplete: () => streak.destroy(),
  });

  const result = gameplay.attackEnemy(target.id);
  if (!result) return false;
  showHitFeedback(
    scene,
    target,
    result.damage,
    dominantCatForPhase(gameplay.getSnapshot().phase) === 'nox',
  );
  return true;
}

// Луч света (§12): a directed mid-range beam, not a lightning strike from above.
function drawLightBeam(
  scene: Phaser.Scene,
  actor: Phaser.Physics.Arcade.Sprite,
  target: Phaser.Physics.Arcade.Sprite,
  reducedMotion: boolean,
): void {
  const graphics = scene.add.graphics().setDepth(14);
  graphics.lineStyle(16, 0xffef9b, 0.55);
  graphics.lineBetween(actor.x + 20, actor.y - 8, target.x, target.y);
  graphics.lineStyle(6, 0xfff8d8, 1);
  graphics.lineBetween(actor.x + 20, actor.y - 8, target.x, target.y);
  fadeGraphics(scene, graphics, 320);
  const paintedLightning = scene.add
    .image(target.x, target.y - 55, EFFECT_TEXTURES.lightBeam)
    .setDisplaySize(96, 96)
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

function drawLightBeamForward(
  scene: Phaser.Scene,
  actor: Phaser.Physics.Arcade.Sprite,
  facing: number,
  range: number,
  reducedMotion: boolean,
): void {
  const endX = actor.x + facing * range * 0.72;
  const graphics = scene.add.graphics().setDepth(14);
  graphics.lineStyle(16, 0xffef9b, 0.55);
  graphics.lineBetween(actor.x + facing * 20, actor.y - 8, endX, actor.y - 8);
  graphics.lineStyle(6, 0xfff8d8, 1);
  graphics.lineBetween(actor.x + facing * 20, actor.y - 8, endX, actor.y - 8);
  fadeGraphics(scene, graphics, reducedMotion ? 1 : 320);
}

// Теневые иглы (§12): a row of soft magical spikes that fade into smoke.
function drawShadowNeedle(scene: Phaser.Scene, x: number, y: number, index: number): void {
  // The icon is 160px tall, so a needle stands ~70px high once it is fully out of the ground.
  const grown = 0.44 + index * 0.03;
  const spike = scene.add
    .image(x, y, EFFECT_TEXTURES.shadowNeedles)
    .setOrigin(0.5, 0.78)
    .setScale(grown, 0.05)
    .setDepth(13);
  scene.tweens.add({
    targets: spike,
    scaleY: grown,
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
  const config = SPECIAL_ABILITIES[catId];
  // Both level-2 abilities are directional: Луч света is "направленный луч средней дальности"
  // and Теневые иглы rise from the ground in a row in front of Нокс (§12).
  const inRange = targetsInFront(actor, targets, facing, config.range);

  const target = inRange[0];
  if (!target) {
    if (!gameplay.castSpecialAbility()) return false;
    if (catId === 'luma') {
      drawLightBeamForward(scene, actor, facing, config.range, reducedMotion);
    } else {
      const groundY = actor.y + 45;
      for (let index = 0; index < 5; index += 1) {
        drawShadowNeedle(scene, actor.x + facing * (55 + index * 52), groundY, index);
      }
      if (!reducedMotion) scene.cameras.main.shake(180, 0.006);
    }
    return true;
  }
  const result = gameplay.useSpecialAbility(target.id);
  if (!result) return false;

  if (catId === 'luma') {
    drawLightBeam(scene, actor, target.sprite, reducedMotion);
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
    drawShadowNeedle(scene, actor.x + facing * (55 + index * 52), groundY, index);
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
