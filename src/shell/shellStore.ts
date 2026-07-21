/**
 * AI OS — Shell Store
 *
 * Manages desktop shell state: boot status, open apps, and z-ordering.
 * Split from the original appStore during Sprint 0 migration.
 *
 * Note: This is the v0.2 migration bridge. Sprint 0B will refactor this
 * into the proper PanelInfo-based store per STATE_ARCHITECTURE.md §2.6.
 */

import { create } from 'zustand';

interface ShellState {
  // Boot
  booted: boolean;
  setBooted: () => void;

  // Open apps (v0.2 bridge — will become PanelInfo[] in 0B)
  openApps: string[];
  openApp: (id: string) => void;
  closeApp: (id: string) => void;
  bringToFront: (id: string) => void;
}

export const useShellStore = create<ShellState>((set) => ({
  // Boot
  booted: false,
  setBooted: () => set({ booted: true }),

  // Apps
  openApps: [],
  openApp: (id: string) =>
    set((state) => {
      if (state.openApps.includes(id)) {
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
