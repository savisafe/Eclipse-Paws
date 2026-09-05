export type AppState =
  | 'boot'
  | 'main-menu'
  | 'prologue'
  | 'loading-level'
  | 'playing'
  | 'paused'
  | 'level-result'
  | 'epilogue'
  | 'credits';

export const APP_TRANSITIONS: Readonly<Record<AppState, readonly AppState[]>> = {
  boot: ['main-menu'],
  'main-menu': ['prologue', 'loading-level', 'credits'],
  prologue: ['loading-level', 'main-menu'],
  'loading-level': ['playing', 'main-menu'],
  playing: ['paused', 'level-result', 'main-menu'],
  paused: ['playing', 'main-menu'],
  'level-result': ['main-menu', 'loading-level', 'credits', 'epilogue'],
  epilogue: ['credits', 'main-menu'],
  credits: ['main-menu'],
};
