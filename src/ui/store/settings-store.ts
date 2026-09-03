import { create } from 'zustand';

interface SettingsStore {
  musicVolume: number;
  effectsVolume: number;
  reducedMotion: boolean;
  vibration: boolean;
  setMusicVolume: (musicVolume: number) => void;
  setEffectsVolume: (effectsVolume: number) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  setVibration: (vibration: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  musicVolume: 70,
  effectsVolume: 80,
  reducedMotion: false,
  vibration: true,
  setMusicVolume: (musicVolume) => set({ musicVolume }),
  setEffectsVolume: (effectsVolume) => set({ effectsVolume }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setVibration: (vibration) => set({ vibration }),
}));
