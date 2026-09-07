import type Phaser from 'phaser';

/**
 * Adaptive viewport.
 *
 * The game is authored inside a 1280×720 frame, but no real screen is exactly 16:9: a handset is
 * ~19.5:9 held sideways and taller than it is wide held upright, a tablet is close to 4:3, and a
 * desktop window is whatever the player dragged it to. Rendering the authored frame with black
 * letterbox bars threw away up to a fifth of a phone screen.
 *
 * So the canvas takes the whole surface it is given and the *camera* absorbs the difference: the
 * authored 1280×720 frame is always fully visible, and the leftover screen shows more of the
 * world instead of bars — wider to the sides on a long screen, more sky and ground on a squarer
 * one. Nothing authored is ever cropped; only the field of view grows.
 */

/** The authored frame. Gameplay tuning (jump height, speeds, platform spacing) assumes it. */
export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;

/**
 * Where "see more" stops. Past these the cats would shrink to specks, so the canvas letterboxes
 * again — and in portrait the CSS hands that leftover strip to the touch-control deck instead of
 * leaving a black bar (`game.css`, `.game-screen` portrait grid). The height cap is what sets how
 * tall that portrait picture may be: 1500 puts it at a little over half the screen, which leaves
 * the deck enough room for full-size controls without turning it into an empty field.
 */
const MAX_WIDTH = 2240;
const MAX_HEIGHT = 1500;

export interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

/** A viewport plus the factor in-canvas UI has to grow by to stay legible on that screen. */
export interface UiViewport extends ViewportSize {
  readonly ui: number;
}

export interface CameraBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Game (world-unit) size for a canvas of `pixelWidth`×`pixelHeight` CSS pixels. */
export function resolveViewport(pixelWidth: number, pixelHeight: number): ViewportSize {
  const width = Math.max(1, Math.round(pixelWidth));
  const height = Math.max(1, Math.round(pixelHeight));
  // Screen pixels per world unit. The axis that runs out of the authored frame first sets it,
  // which is exactly what keeps all of 1280×720 on screen whatever the aspect ratio.
  const pixelsPerUnit = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
  return {
    width: Math.min(MAX_WIDTH, Math.round(width / pixelsPerUnit)),
    height: Math.min(MAX_HEIGHT, Math.round(height / pixelsPerUnit)),
  };
}

/**
 * Camera bounds for a view of `view.height` world units over a level `worldWidth` wide. A view
 * taller than the authored 720 keeps the playable band vertically centred (the extra is sky above
 * and ground below) rather than letting the camera drift off the level.
 */
export function resolveCameraBounds(view: ViewportSize, worldWidth: number): CameraBounds {
  const height = Math.max(DESIGN_HEIGHT, view.height);
  // Slightly more of the surplus goes above the playable band than below it: what the camera
  // shows above the world is sky, and what it shows below is the same strip of undergrowth
  // repeated, so the picture reads better leaning up.
  return { x: 0, y: (DESIGN_HEIGHT - height) * 0.62, width: worldWidth, height };
}

/**
 * How much bigger in-canvas UI has to be drawn on this screen.
 *
 * The world is measured in design units and a phone squeezes 1280 of them into ~390 CSS pixels,
 * so a 20-unit caption lands on the glass at 6 px. The HUD escapes this because it is DOM, but
 * everything Phaser draws — dialogue card, tutorial card, interaction plaques, banners — has to
 * be scaled by the units-per-pixel of the actual canvas to come out the same physical size.
 *
 * Capped at 2.4: past that the cards would eat the whole screen instead of sitting over it.
 */
export function uiScale(scene: Phaser.Scene): number {
  const cssWidth = scene.scale.canvasBounds.width;
  if (!(cssWidth > 0)) return 1;
  return Math.min(2.4, Math.max(1, scene.scale.width / cssWidth));
}

/**
 * First row of the view the DOM HUD does not sit on top of, in world units from the top edge.
 * The HUD is DOM and therefore a fixed physical height, so the world-unit clearance it needs
 * grows with `uiScale` exactly the way the in-canvas captions below it do.
 */
export function hudSafeTop(view: UiViewport): number {
  return 150 * view.ui;
}

/** Current game size plus UI scale — the shape every `layout()` below takes. */
export function sceneViewport(scene: Phaser.Scene): UiViewport {
  return { width: scene.scale.width, height: scene.scale.height, ui: uiScale(scene) };
}
