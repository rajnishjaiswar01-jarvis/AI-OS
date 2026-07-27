/**
 * AI OS — Window Store
 *
 * Pure Zustand state container for window management.
 * NO side effects. NO registry access. NO business logic.
 * All mutations are called by windowManager after orchestration.
 *
 * Follows the same pattern as projectStore:
 *   Component reads → Store holds state → Service mutates
 *
 * @see Sprint 1D — Window Manager
 */

import { create } from 'zustand';
import { WindowState, type WindowInstance } from './windowTypes';

// ─── Constants ───────────────────────────────────────────────────────

/**
 * Base z-index for windows.
 * Keeps window z-indices in the 100–999 range,
 * leaving higher bands free for overlays:
 *   1000  Toasts
 *   2000  Context Menus
 *   3000  Modals
 *   4000  Emergency Dialogs
 */
const BASE_Z = 100;

// ─── Store Interface ─────────────────────────────────────────────────

interface WindowStoreState {
  /** All open window instances */
  windows: WindowInstance[];

  /** Currently focused window ID (null = no window focused) */
  activeWindowId: string | null;

  /** Next z-index to assign. Monotonically increasing from BASE_Z. */
  nextZIndex: number;

  // ─── Mutations (called by windowManager, NEVER directly by components) ───

  addWindow: (window: WindowInstance) => void;
  removeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  setWindowState: (id: string, state: WindowState) => void;
}

// ─── Store ───────────────────────────────────────────────────────────

export const useWindowStore = create<WindowStoreState>((set) => ({
  windows: [],
  activeWindowId: null,
  nextZIndex: BASE_Z,

  addWindow: (window: WindowInstance) =>
    set((state) => ({
      windows: [...state.windows, { ...window, zIndex: state.nextZIndex }],
      activeWindowId: window.id,
      nextZIndex: state.nextZIndex + 1,
    })),

  removeWindow: (id: string) =>
    set((state) => {
      const remaining = state.windows.filter((w) => w.id !== id);

      // If the removed window was active, activate the top-most remaining window
      let nextActiveId: string | null = state.activeWindowId;
      if (state.activeWindowId === id) {
        const topWindow = remaining
          .filter((w) => w.state !== WindowState.Minimized)
          .sort((a, b) => b.zIndex - a.zIndex)[0];
        nextActiveId = topWindow?.id ?? null;
      }

      return { windows: remaining, activeWindowId: nextActiveId };
    }),

  focusWindow: (id: string) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, zIndex: state.nextZIndex } : w
      ),
      activeWindowId: id,
      nextZIndex: state.nextZIndex + 1,
    })),

  setWindowState: (id: string, windowState: WindowState) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, state: windowState } : w
      ),
      // If minimizing the active window, clear active
      activeWindowId:
        windowState === WindowState.Minimized && state.activeWindowId === id
          ? null
          : state.activeWindowId,
    })),
}));

// ─── Selectors ───────────────────────────────────────────────────────

/** Get all visible (non-minimized) windows, sorted by z-index ascending. */
export function getVisibleWindows(state: WindowStoreState): WindowInstance[] {
  return state.windows
    .filter((w) => w.state !== WindowState.Minimized)
    .sort((a, b) => a.zIndex - b.zIndex);
}

/** Get all windows for a given app ID. */
export function getWindowsByAppId(state: WindowStoreState, appId: string): WindowInstance[] {
  return state.windows.filter((w) => w.appId === appId);
}

/** Check if any window is open for a given app ID. */
export function isAppOpen(state: WindowStoreState, appId: string): boolean {
  return state.windows.some((w) => w.appId === appId);
}
