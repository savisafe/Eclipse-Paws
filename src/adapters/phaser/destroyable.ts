/**
 * ARC-010: every Phaser-facing system owned by `PrototypeScene` must implement this so
 * `#shutdown()` can release non-Phaser-managed resources (AudioContext, app-level event
 * subscriptions, internal collections) uniformly, instead of an ad-hoc subset. Phaser's own
 * `TweenManager`/`Clock`/`DisplayList` already self-clean on the scene's `SHUTDOWN` event (each
 * registers its own listener — see `node_modules/phaser/src/{tweens/TweenManager,time/Clock,
 * gameobjects/DisplayList}.js`), so `destroy()` here only needs to cover what Phaser does not
 * already own.
 */
export interface Destroyable {
  destroy(): void;
}
