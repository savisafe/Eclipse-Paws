import Phaser from 'phaser';

export interface RendererContextHandlers {
  onLost: () => void;
  onRestored: () => void;
}

/**
 * Watches the WebGL context the game draws through.
 *
 * A phone drops that context when the system needs the memory back — which is precisely when the
 * player is deep in a level with every texture resident. Phaser rebuilds its own GL resources when
 * the browser hands the context back (3.85+), so the renderer itself recovers; what it does *not*
 * do is stop the game. `WebGLRenderer.preRender/render/postRender` return early while the context
 * is lost, but `Game.step` still runs `scene.update`, so the picture freezes on its last frame
 * while the phase clock, the enemies and the damage carry on out of sight. The player sees the
 * game hang, and finds the cats hurt — or the level lost — if it ever comes back.
 *
 * So the game has to hear about it: the scene is paused while the context is gone, and resumed
 * when it returns. On the Canvas fallback there is no context to lose and this is a no-op.
 */
export function watchRendererContext(
  game: Phaser.Game,
  handlers: RendererContextHandlers,
): () => void {
  const renderer = game.renderer;
  if (!(renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return () => undefined;

  const onLost = () => handlers.onLost();
  const onRestored = () => handlers.onRestored();
  renderer.on(Phaser.Renderer.Events.LOSE_WEBGL, onLost);
  renderer.on(Phaser.Renderer.Events.RESTORE_WEBGL, onRestored);

  // The context can already be gone by the time this runs: the loss fires on the canvas, and the
  // game is created a frame or two before anything subscribes to it.
  if (renderer.contextLost) handlers.onLost();

  return () => {
    renderer.off(Phaser.Renderer.Events.LOSE_WEBGL, onLost);
    renderer.off(Phaser.Renderer.Events.RESTORE_WEBGL, onRestored);
  };
}
