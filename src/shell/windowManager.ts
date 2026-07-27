/**
 * AI OS — Window Manager
 *
 * Orchestration layer for window lifecycle.
 * This is the "brain" of the window system — same role as projectService.
 *
 * Flow: Dock/Component → windowManager → windowStore
 *                                      → registry (for app lookup)
 *
 * The Window Manager never knows how Notes, Chat, or any app works.
 * It only knows: App ID → Registry → React Component → Window.
 *
 * Rule: Components call windowManager. windowManager calls windowStore.
 *       Components never call windowStore mutations directly.
 *
 * @see Sprint 1D — Window Manager
 */

import { useWindowStore, getWindowsByAppId } from './windowStore';
import { WindowState, type WindowInstance } from './windowTypes';
import { getApp } from '@core/registry/registry';

// ─── Constants ───────────────────────────────────────────────────────

/** Default window size when AppDefinition doesn't specify one */
const DEFAULT_SIZE = { width: 480, height: 560 };

/** Base position for cascade placement */
const CASCADE_BASE = { x: 80, y: 40 };

/** Offset between cascaded windows */
const CASCADE_OFFSET = 30;

/** Maximum cascade steps before wrapping */
const CASCADE_MAX = 8;

// ─── Window Manager ──────────────────────────────────────────────────

export const windowManager = {
  /**
   * Open an app in a new window.
   *
   * Singleton logic:
   * - If the app is singleton and already open:
   *   - If minimized → restore + focus
   *   - If normal → just focus
   *   - Returns the existing window ID
   * - Otherwise: creates a new window with cascade positioning
   *
   * @returns The window ID (new or existing), or null if app not found.
   */
  open(appId: string, projectId: string | null = null): string | null {
    const app = getApp(appId);
    if (!app) {
      console.warn(`[Window Manager] App "${appId}" not found in registry.`);
      return null;
    }

    const store = useWindowStore.getState();

    // Singleton check
    if (app.singleton) {
      const existing = getWindowsByAppId(store, appId);
      if (existing.length > 0) {
        const win = existing[0];
        if (win.state === WindowState.Minimized) {
          this.restore(win.id);
        } else {
          this.focus(win.id);
        }
        return win.id;
      }
    }

    // Calculate cascade position
    const windowCount = store.windows.length;
    const cascadeStep = windowCount % CASCADE_MAX;
    const position = {
      x: CASCADE_BASE.x + cascadeStep * CASCADE_OFFSET,
      y: CASCADE_BASE.y + cascadeStep * CASCADE_OFFSET,
    };

    // Resolve size from app definition or default
    const size = app.defaultSize ?? DEFAULT_SIZE;

    // Create window instance
    const window: WindowInstance = {
      id: crypto.randomUUID(),
      appId,
      projectId,
      title: app.name,
      state: WindowState.Normal,
      position,
      size,
      zIndex: 0, // Will be overwritten by addWindow
    };

    store.addWindow(window);
    return window.id;
  },

  /**
   * Close a window by ID.
   * Removes it from the store entirely.
   */
  close(windowId: string): void {
    useWindowStore.getState().removeWindow(windowId);
  },

  /**
   * Focus a window (bring to front).
   * Updates z-index and sets as active window.
   */
  focus(windowId: string): void {
    useWindowStore.getState().focusWindow(windowId);
  },

  /**
   * Minimize a window.
   * Window remains in the store but is hidden from the desktop.
   * Dock still shows the active indicator.
   */
  minimize(windowId: string): void {
    useWindowStore.getState().setWindowState(windowId, WindowState.Minimized);
  },

  /**
   * Restore a minimized window.
   * Sets state back to Normal and focuses it.
   */
  restore(windowId: string): void {
    const store = useWindowStore.getState();
    store.setWindowState(windowId, WindowState.Normal);
    // Focus after restore — need fresh state since setWindowState was called
    useWindowStore.getState().focusWindow(windowId);
  },

  /**
   * Get the app component for a given app ID.
   * Used by Window.tsx to render the correct app content.
   * Keeps registry access behind the manager so Desktop stays a pure renderer.
   */
  getAppComponent(appId: string) {
    const app = getApp(appId);
    return app?.component ?? null;
  },

  /**
   * Get the app icon for a given app ID.
   * Used by Window.tsx title bar.
   */
  getAppIcon(appId: string): string {
    const app = getApp(appId);
    return app?.icon ?? '';
  },
};
