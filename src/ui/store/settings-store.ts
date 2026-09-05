import { create } from 'zustand';

interface SettingsStore {
  musicVolume: number;
  effectsVolume: number;
  // §14 «Доступность»: "яркость настоящей ночи регулируется отдельно" — level 1's night is a
  // real loss of visibility, so players need their own control over how dark it gets.
  nightBrightness: number;
  reducedMotion: boolean;
  vibration: boolean;
  setMusicVolume: (musicVolume: number) => void;
  setEffectsVolume: (effectsVolume: number) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  setNightBrightness: (nightBrightness: number) => void;
  setVibration: (vibration: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  musicVolume: 70,
  effectsVolume: 80,
  nightBrightness: 45,
  reducedMotion: false,
  vibration: true,
  setMusicVolume: (musicVolume) => set({ musicVolume }),
  setEffectsVolume: (effectsVolume) => set({ effectsVolume }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setNightBrightness: (nightBrightness) => set({ nightBrightness }),
  setVibration: (vibration) => set({ vibration }),
}));
