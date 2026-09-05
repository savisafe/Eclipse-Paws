export type AppState =
  'boot' | 'main-menu' | 'loading-level' | 'playing' | 'paused' | 'level-result' | 'credits';

export const APP_TRANSITIONS: Readonly<Record<AppState, readonly AppState[]>> = {
  boot: ['main-menu'],
  'main-menu': ['loading-level', 'credits'],
  'loading-level': ['playing', 'main-menu'],
  playing: ['paused', 'level-result', 'main-menu'],
  paused: ['playing', 'main-menu'],
  'level-result': ['main-menu', 'loading-level', 'credits'],
  credits: ['main-menu'],
};
