export type GameAction =
  | 'move-up'
  | 'move-down'
  | 'move-left'
  | 'move-right'
  | 'jump'
  | 'primary-ability'
  | 'mobility-ability'
  | 'support-ability'
  | 'interact'
  | 'change-phase'
  | 'switch-cat'
  | 'restart-checkpoint'
  | 'pause';
