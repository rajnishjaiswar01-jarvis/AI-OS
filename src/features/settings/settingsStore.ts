/**
 * AI OS — Settings Store
 *
 * Manages user preferences: theme, wallpaper.
 * Split from the original appStore during Sprint 0 migration.
 *
 * Note: This is the v0.2 migration bridge using localStorage.
 * Sprint 0B will add hydrate() and proper Dexie-backed persistence.
 */

import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light';
export type Wallpaper = 'space' | 'aurora';

interface SettingsState {
  // Theme
  theme: Theme;
  toggleTheme: () => void;

  // Wallpaper
  wallpaper: Wallpaper;
  setWallpaper: (w: Wallpaper) => void;
}

// ─── Store ───────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>((set) => ({
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
}));
