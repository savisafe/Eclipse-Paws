import { create } from 'zustand';

interface SettingsStore {
  musicVolume: number;
  effectsVolume: number;
  reducedMotion: boolean;
  setMusicVolume: (musicVolume: number) => void;
  setEffectsVolume: (effectsVolume: number) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  musicVolume: 70,
  effectsVolume: 80,
  reducedMotion: false,
  setMusicVolume: (musicVolume) => set({ musicVolume }),
  setEffectsVolume: (effectsVolume) => set({ effectsVolume }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}));
