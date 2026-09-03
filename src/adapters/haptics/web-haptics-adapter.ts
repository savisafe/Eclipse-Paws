import type { HapticsPort } from './haptics-port';

const DURATIONS = { light: 15, medium: 28, heavy: 45 } as const;

export class WebHapticsAdapter implements HapticsPort {
  readonly #enabled: boolean;

  constructor(enabled: boolean) {
    this.#enabled = enabled;
  }

  impact(intensity: 'light' | 'medium' | 'heavy'): Promise<void> {
    if (this.#enabled && 'vibrate' in navigator) navigator.vibrate(DURATIONS[intensity]);
    return Promise.resolve();
  }
}
