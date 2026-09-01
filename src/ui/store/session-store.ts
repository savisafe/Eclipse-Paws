import { create } from 'zustand';
import type { AppState } from '@core/index';

interface SessionStore {
  appState: AppState;
  setAppState: (appState: AppState) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  appState: 'boot',
  setAppState: (appState) => set({ appState }),
}));
