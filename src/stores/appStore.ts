import { create } from 'zustand';
import type { Theme, Wallpaper } from '../types';

interface AppState {
  // Boot
  booted: boolean;
  setBooted: () => void;

  // Theme
  theme: Theme;
  toggleTheme: () => void;

  // Wallpaper
  wallpaper: Wallpaper;
  setWallpaper: (w: Wallpaper) => void;

  // Open apps
  openApps: string[];
  openApp: (id: string) => void;
  closeApp: (id: string) => void;
  bringToFront: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Boot
  booted: false,
  setBooted: () => set({ booted: true }),

  // Theme — load from localStorage or default dark
  theme: (localStorage.getItem('ai-os-theme') as Theme) || 'dark',
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('ai-os-theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return { theme: next };
    }),

  // Wallpaper — load from localStorage or default space
  wallpaper: (localStorage.getItem('ai-os-wallpaper') as Wallpaper) || 'space',
  setWallpaper: (w: Wallpaper) => {
    localStorage.setItem('ai-os-wallpaper', w);
    set({ wallpaper: w });
  },

  // Apps
  openApps: [],
  openApp: (id: string) =>
    set((state) => {
      if (state.openApps.includes(id)) {
        // Bring to front if already open
        return { openApps: [...state.openApps.filter((a) => a !== id), id] };
      }
      return { openApps: [...state.openApps, id] };
    }),
  closeApp: (id: string) =>
    set((state) => ({
      openApps: state.openApps.filter((a) => a !== id),
    })),
  bringToFront: (id: string) =>
    set((state) => ({
      openApps: [...state.openApps.filter((a) => a !== id), id],
    })),
}));
