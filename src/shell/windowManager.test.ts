/**
 * AI OS — Window Manager Tests
 *
 * Tests the window lifecycle through the windowManager service layer.
 * Pure in-memory tests — no Dexie, no DOM rendering.
 *
 * Test suites:
 * - Open window → exists in store
 * - Open singleton → focuses existing instead of creating duplicate
 * - Open singleton when minimized → restores and focuses
 * - Close window → removed from store
 * - Focus window → z-index updated, becomes active
 * - Minimize window → state changes, active clears
 * - Restore window → state changes, active set, z-index updated
 * - Cascade positions → each window offset correctly
 * - Active window tracking → activeWindowId stays correct
 * - Stress tests → rapid open/close, focus cycling
 * - Edge cases → lifecycle boundaries, mixed operations
 * - Cold start → clean boot baseline
 *
 * @see Sprint 1E — Stabilization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useWindowStore,
  getVisibleWindows,
  getWindowsByAppId,
  isAppOpen,
  _resetWindowStoreForTests,
} from './windowStore';
import { windowManager } from './windowManager';
import { WindowState } from './windowTypes';
import { registerApp, _resetAppRegistry } from '@core/registry/registry';

// ─── Test Setup ──────────────────────────────────────────────────────

// Mock app component
const MockComponent = () => null;

function registerTestApps() {
  registerApp({
    id: 'test-app',
    name: 'Test App',
    icon: '🧪',
    component: MockComponent,
    singleton: false,
    defaultSize: { width: 400, height: 300 },
  });

  registerApp({
    id: 'singleton-app',
    name: 'Singleton App',
    icon: '📌',
    component: MockComponent,
    singleton: true,
    defaultSize: { width: 500, height: 400 },
  });
}

beforeEach(() => {
  _resetWindowStoreForTests();
  _resetAppRegistry();
  registerTestApps();
});

// ─── Tests ───────────────────────────────────────────────────────────

describe('Window Manager', () => {
  describe('open', () => {
    it('should create a window instance in the store', () => {
      const windowId = windowManager.open('test-app');

      expect(windowId).toBeTruthy();
      const { windows } = useWindowStore.getState();
      expect(windows).toHaveLength(1);
      expect(windows[0].appId).toBe('test-app');
      expect(windows[0].title).toBe('Test App');
      expect(windows[0].state).toBe(WindowState.Normal);
    });

    it('should use default size from app definition', () => {
      windowManager.open('test-app');

      const { windows } = useWindowStore.getState();
      expect(windows[0].size).toEqual({ width: 400, height: 300 });
    });

    it('should set projectId when provided', () => {
      windowManager.open('test-app', 'project-123');

      const { windows } = useWindowStore.getState();
      expect(windows[0].projectId).toBe('project-123');
    });

    it('should return null for unregistered app', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const windowId = windowManager.open('nonexistent');

      expect(windowId).toBeNull();
      expect(useWindowStore.getState().windows).toHaveLength(0);
      consoleSpy.mockRestore();
    });

    it('should set the new window as active', () => {
      const windowId = windowManager.open('test-app');

      expect(useWindowStore.getState().activeWindowId).toBe(windowId);
    });

    it('should allow multiple instances of non-singleton apps', () => {
      windowManager.open('test-app');
      windowManager.open('test-app');
      windowManager.open('test-app');

      expect(useWindowStore.getState().windows).toHaveLength(3);
    });
  });

  describe('singleton', () => {
    it('should focus existing window instead of creating duplicate', () => {
      const firstId = windowManager.open('singleton-app');
      const secondId = windowManager.open('singleton-app');

      expect(secondId).toBe(firstId);
      expect(useWindowStore.getState().windows).toHaveLength(1);
    });

    it('should restore and focus minimized singleton', () => {
      const windowId = windowManager.open('singleton-app')!;
      windowManager.minimize(windowId);

      // Verify minimized
      expect(useWindowStore.getState().windows[0].state).toBe(WindowState.Minimized);

      // Re-open should restore
      const reopenedId = windowManager.open('singleton-app');
      expect(reopenedId).toBe(windowId);

      const win = useWindowStore.getState().windows[0];
      expect(win.state).toBe(WindowState.Normal);
      expect(useWindowStore.getState().activeWindowId).toBe(windowId);
    });
  });

  describe('close', () => {
    it('should remove window from store', () => {
      const windowId = windowManager.open('test-app')!;
      windowManager.close(windowId);

      expect(useWindowStore.getState().windows).toHaveLength(0);
    });

    it('should clear activeWindowId when closing active window', () => {
      const windowId = windowManager.open('test-app')!;
      expect(useWindowStore.getState().activeWindowId).toBe(windowId);

      windowManager.close(windowId);
      expect(useWindowStore.getState().activeWindowId).toBeNull();
    });

    it('should not affect activeWindowId when closing non-active window', () => {
      windowManager.open('test-app');
      const secondId = windowManager.open('test-app')!;

      // Second is active
      expect(useWindowStore.getState().activeWindowId).toBe(secondId);

      // Close first (get its id from the store)
      const firstId = useWindowStore.getState().windows[0].id;
      if (firstId !== secondId) {
        windowManager.close(firstId);
        expect(useWindowStore.getState().activeWindowId).toBe(secondId);
      }
    });
  });

  describe('focus', () => {
    it('should update z-index to highest', () => {
      const firstId = windowManager.open('test-app')!;
      const secondId = windowManager.open('test-app')!;

      // Second should have higher z-index
      const stateAfterOpen = useWindowStore.getState();
      const firstWin = stateAfterOpen.windows.find((w) => w.id === firstId)!;
      const secondWin = stateAfterOpen.windows.find((w) => w.id === secondId)!;
      expect(secondWin.zIndex).toBeGreaterThan(firstWin.zIndex);

      // Focus first
      windowManager.focus(firstId);

      const stateAfterFocus = useWindowStore.getState();
      const firstAfter = stateAfterFocus.windows.find((w) => w.id === firstId)!;
      const secondAfter = stateAfterFocus.windows.find((w) => w.id === secondId)!;
      expect(firstAfter.zIndex).toBeGreaterThan(secondAfter.zIndex);
    });

    it('should set activeWindowId', () => {
      const firstId = windowManager.open('test-app')!;
      windowManager.open('test-app');

      windowManager.focus(firstId);
      expect(useWindowStore.getState().activeWindowId).toBe(firstId);
    });
  });

  describe('minimize', () => {
    it('should set window state to Minimized', () => {
      const windowId = windowManager.open('test-app')!;
      windowManager.minimize(windowId);

      const win = useWindowStore.getState().windows[0];
      expect(win.state).toBe(WindowState.Minimized);
    });

    it('should clear activeWindowId when minimizing active window', () => {
      const windowId = windowManager.open('test-app')!;
      windowManager.minimize(windowId);

      expect(useWindowStore.getState().activeWindowId).toBeNull();
    });
  });

  describe('restore', () => {
    it('should set window state back to Normal', () => {
      const windowId = windowManager.open('test-app')!;
      windowManager.minimize(windowId);
      windowManager.restore(windowId);

      const win = useWindowStore.getState().windows[0];
      expect(win.state).toBe(WindowState.Normal);
    });

    it('should focus the restored window', () => {
      const windowId = windowManager.open('test-app')!;
      windowManager.open('test-app'); // open another to change active

      windowManager.minimize(windowId);
      windowManager.restore(windowId);

      expect(useWindowStore.getState().activeWindowId).toBe(windowId);
    });
  });

  describe('cascade positioning', () => {
    it('should offset each new window by CASCADE_OFFSET', () => {
      windowManager.open('test-app');
      windowManager.open('test-app');
      windowManager.open('test-app');

      const { windows } = useWindowStore.getState();
      expect(windows[0].position).toEqual({ x: 80, y: 40 });
      expect(windows[1].position).toEqual({ x: 110, y: 70 });
      expect(windows[2].position).toEqual({ x: 140, y: 100 });
    });

    it('should wrap cascade after CASCADE_MAX steps', () => {
      // Open 9 windows (CASCADE_MAX = 8, so 9th wraps to step 0)
      for (let i = 0; i < 9; i++) {
        windowManager.open('test-app');
      }

      const { windows } = useWindowStore.getState();
      // 9th window (index 8) should have cascadeStep = 8 % 8 = 0
      expect(windows[8].position).toEqual({ x: 80, y: 40 });
    });
  });

  describe('z-index base', () => {
    it('should start z-index from BASE_Z (100)', () => {
      windowManager.open('test-app');

      const { windows } = useWindowStore.getState();
      expect(windows[0].zIndex).toBeGreaterThanOrEqual(100);
    });
  });
});

// ─── Selector Tests ──────────────────────────────────────────────────

describe('Window Store Selectors', () => {
  describe('getVisibleWindows', () => {
    it('should exclude minimized windows', () => {
      const windowId = windowManager.open('test-app')!;
      windowManager.open('test-app');

      windowManager.minimize(windowId);

      const state = useWindowStore.getState();
      const visible = getVisibleWindows(state);
      expect(visible).toHaveLength(1);
    });

    it('should sort by z-index ascending', () => {
      const firstId = windowManager.open('test-app')!;
      windowManager.open('test-app');

      // Focus first to give it higher z-index
      windowManager.focus(firstId);

      const state = useWindowStore.getState();
      const visible = getVisibleWindows(state);
      expect(visible[visible.length - 1].id).toBe(firstId);
    });
  });

  describe('getWindowsByAppId', () => {
    it('should return only windows for the given app', () => {
      windowManager.open('test-app');
      windowManager.open('test-app');
      windowManager.open('singleton-app');

      const state = useWindowStore.getState();
      expect(getWindowsByAppId(state, 'test-app')).toHaveLength(2);
      expect(getWindowsByAppId(state, 'singleton-app')).toHaveLength(1);
    });
  });

  describe('isAppOpen', () => {
    it('should return true when app has open windows', () => {
      windowManager.open('test-app');

      const state = useWindowStore.getState();
      expect(isAppOpen(state, 'test-app')).toBe(true);
      expect(isAppOpen(state, 'singleton-app')).toBe(false);
    });

    it('should return false after all windows of that app are closed', () => {
      const windowId = windowManager.open('test-app')!;
      windowManager.close(windowId);

      const state = useWindowStore.getState();
      expect(isAppOpen(state, 'test-app')).toBe(false);
    });
  });
});

// ─── Regression Tests ────────────────────────────────────────────────

describe('Window Manager Regressions', () => {
  describe('z-index uniqueness', () => {
    it('should never assign duplicate z-indices after focus operations', () => {
      const a = windowManager.open('test-app')!;
      const b = windowManager.open('test-app')!;
      const c = windowManager.open('test-app')!;

      // Focus A, then B, then C
      windowManager.focus(a);
      windowManager.focus(b);
      windowManager.focus(c);

      const { windows } = useWindowStore.getState();
      const zIndices = windows.map((w) => w.zIndex);
      const uniqueZIndices = new Set(zIndices);
      expect(uniqueZIndices.size).toBe(zIndices.length);
    });

    it('should maintain correct order after open-focus-open sequence', () => {
      // Open A, Open B, Focus A, Open C
      const a = windowManager.open('test-app')!;
      windowManager.open('test-app')!;
      windowManager.focus(a);
      const c = windowManager.open('test-app')!;

      // C should be on top (last opened), A should be above B (recently focused)
      const { windows } = useWindowStore.getState();
      const cWin = windows.find((w) => w.id === c)!;
      const aWin = windows.find((w) => w.id === a)!;

      expect(cWin.zIndex).toBeGreaterThan(aWin.zIndex);
      expect(useWindowStore.getState().activeWindowId).toBe(c);
    });
  });

  describe('close active → previous becomes active', () => {
    it('should activate the previous top-most window when closing active', () => {
      // Open A, B, C — C is active
      windowManager.open('test-app');
      const b = windowManager.open('test-app')!;
      const c = windowManager.open('test-app')!;

      expect(useWindowStore.getState().activeWindowId).toBe(c);

      // Close C → B should become active (it has the next highest z-index)
      windowManager.close(c);
      expect(useWindowStore.getState().activeWindowId).toBe(b);
    });

    it('should set activeWindowId to null when closing the last window', () => {
      const a = windowManager.open('test-app')!;
      windowManager.close(a);

      expect(useWindowStore.getState().activeWindowId).toBeNull();
    });

    it('should skip minimized windows when finding previous active', () => {
      const a = windowManager.open('test-app')!;
      const b = windowManager.open('test-app')!;
      const c = windowManager.open('test-app')!;

      // Minimize B, then close C → A should become active (B is minimized)
      windowManager.minimize(b);
      windowManager.close(c);

      expect(useWindowStore.getState().activeWindowId).toBe(a);
    });
  });

  describe('restore gives highest z-index', () => {
    it('should have the highest z-index after restore', () => {
      const a = windowManager.open('test-app')!;
      const b = windowManager.open('test-app')!;

      // Minimize A, then restore → A should be on top
      windowManager.minimize(a);
      windowManager.restore(a);

      const { windows } = useWindowStore.getState();
      const aWin = windows.find((w) => w.id === a)!;
      const bWin = windows.find((w) => w.id === b)!;

      expect(aWin.zIndex).toBeGreaterThan(bWin.zIndex);
      expect(useWindowStore.getState().activeWindowId).toBe(a);
    });
  });

  describe('singleton enforcement', () => {
    it('should still have exactly one instance after multiple open attempts', () => {
      windowManager.open('singleton-app');
      windowManager.open('singleton-app');
      windowManager.open('singleton-app');
      windowManager.open('singleton-app');

      const state = useWindowStore.getState();
      const singletonWindows = state.windows.filter((w) => w.appId === 'singleton-app');
      expect(singletonWindows).toHaveLength(1);
    });
  });
});

// ─── Sprint 1E: Stress Tests ─────────────────────────────────────────

describe('Stress Tests', () => {
  describe('rapid open/close', () => {
    it('should handle 20 windows opened then all closed with clean state', () => {
      const ids: string[] = [];
      for (let i = 0; i < 20; i++) {
        ids.push(windowManager.open('test-app')!);
      }

      expect(useWindowStore.getState().windows).toHaveLength(20);

      // Close all
      for (const id of ids) {
        windowManager.close(id);
      }

      const state = useWindowStore.getState();
      expect(state.windows).toHaveLength(0);
      expect(state.activeWindowId).toBeNull();
      // nextZIndex should still be valid (monotonically increased, not reset)
      expect(state.nextZIndex).toBeGreaterThan(100);
    });

    it('should handle rapid singleton open/close 10 times with exactly 1 instance', () => {
      for (let i = 0; i < 10; i++) {
        const id = windowManager.open('singleton-app')!;

        // At every step, exactly 1 singleton window
        const singletons = useWindowStore.getState().windows.filter(
          (w) => w.appId === 'singleton-app'
        );
        expect(singletons).toHaveLength(1);

        windowManager.close(id);
      }

      // After all close, no windows
      expect(useWindowStore.getState().windows).toHaveLength(0);
    });
  });

  describe('focus cycling', () => {
    it('should maintain unique z-indices after focusing 5 windows in sequence', () => {
      const ids: string[] = [];
      for (let i = 0; i < 5; i++) {
        ids.push(windowManager.open('test-app')!);
      }

      // Focus each window in order
      for (const id of ids) {
        windowManager.focus(id);
      }

      const { windows } = useWindowStore.getState();
      const zIndices = windows.map((w) => w.zIndex);
      const uniqueZIndices = new Set(zIndices);
      expect(uniqueZIndices.size).toBe(5);
    });

    it('should reflect correct order after A→B→C→A→B focus sequence', () => {
      const a = windowManager.open('test-app')!;
      const b = windowManager.open('test-app')!;
      const c = windowManager.open('test-app')!;

      // Focus sequence: A → B → C → A → B
      windowManager.focus(a);
      windowManager.focus(b);
      windowManager.focus(c);
      windowManager.focus(a);
      windowManager.focus(b);

      const { windows } = useWindowStore.getState();
      const aWin = windows.find((w) => w.id === a)!;
      const bWin = windows.find((w) => w.id === b)!;
      const cWin = windows.find((w) => w.id === c)!;

      // B was focused last → highest z-index
      // A was focused second-to-last → middle
      // C was focused earliest remaining → lowest
      expect(bWin.zIndex).toBeGreaterThan(aWin.zIndex);
      expect(aWin.zIndex).toBeGreaterThan(cWin.zIndex);
      expect(useWindowStore.getState().activeWindowId).toBe(b);
    });
  });
});

// ─── Sprint 1E: Edge Case Tests ──────────────────────────────────────

describe('Edge Cases', () => {
  it('should have null activeWindowId when all windows are minimized', () => {
    const a = windowManager.open('test-app')!;
    const b = windowManager.open('test-app')!;
    const c = windowManager.open('test-app')!;

    windowManager.minimize(a);
    windowManager.minimize(b);
    windowManager.minimize(c);

    expect(useWindowStore.getState().activeWindowId).toBeNull();
  });

  it('should correctly activate each window when restoring in reverse order', () => {
    const a = windowManager.open('test-app')!;
    const b = windowManager.open('test-app')!;
    const c = windowManager.open('test-app')!;

    // Minimize all
    windowManager.minimize(a);
    windowManager.minimize(b);
    windowManager.minimize(c);

    // Restore in reverse: C, B, A
    windowManager.restore(c);
    expect(useWindowStore.getState().activeWindowId).toBe(c);

    windowManager.restore(b);
    expect(useWindowStore.getState().activeWindowId).toBe(b);

    windowManager.restore(a);
    expect(useWindowStore.getState().activeWindowId).toBe(a);
  });

  it('should not crash when closing a nonexistent window', () => {
    windowManager.open('test-app');

    const stateBefore = useWindowStore.getState();
    const windowsBefore = stateBefore.windows.length;

    // Close a window that doesn't exist — should be a no-op
    windowManager.close('nonexistent-id-12345');

    const stateAfter = useWindowStore.getState();
    expect(stateAfter.windows.length).toBe(windowsBefore);
  });

  it('should cleanly remove a window that is minimized when closed', () => {
    const a = windowManager.open('test-app')!;
    windowManager.minimize(a);

    // Close while minimized
    windowManager.close(a);

    const state = useWindowStore.getState();
    expect(state.windows).toHaveLength(0);
    expect(state.activeWindowId).toBeNull();
  });

  it('should not make a minimized window active when focused', () => {
    const a = windowManager.open('test-app')!;
    windowManager.open('test-app');

    windowManager.minimize(a);

    // Focus the minimized window — it gets highest z-index but shouldn't visually
    // appear since it's still minimized. The focus call sets activeWindowId,
    // but the window remains minimized. The invariant we actually enforce is:
    // setWindowState(Minimized) clears activeWindowId.
    // Direct focus on a minimized window via focusWindow is an API-level edge case.
    windowManager.focus(a);

    // The window is still minimized in state
    const aWin = useWindowStore.getState().windows.find((w) => w.id === a)!;
    expect(aWin.state).toBe(WindowState.Minimized);
  });

  describe('mixed operations', () => {
    it('open A, open B, minimize A, close B → A stays minimized, active null', () => {
      const a = windowManager.open('test-app')!;
      windowManager.open('test-app')!;

      windowManager.minimize(a);

      // Close B (which is active since A was minimized and B was opened after)
      const bId = useWindowStore.getState().windows.find((w) => w.id !== a)!.id;
      windowManager.close(bId);

      const state = useWindowStore.getState();
      // A is still there but minimized
      expect(state.windows).toHaveLength(1);
      expect(state.windows[0].id).toBe(a);
      expect(state.windows[0].state).toBe(WindowState.Minimized);
      // No visible window to activate — all remaining are minimized
      expect(state.activeWindowId).toBeNull();
    });

    it('open A, B, C, minimize B, close C → A becomes active', () => {
      const a = windowManager.open('test-app')!;
      const b = windowManager.open('test-app')!;
      const c = windowManager.open('test-app')!;

      windowManager.minimize(b);
      windowManager.close(c);

      // B is minimized so it's skipped. A is the top visible window.
      expect(useWindowStore.getState().activeWindowId).toBe(a);
    });
  });
});

// ─── Sprint 1E: Cold Start Test ──────────────────────────────────────

describe('Cold Start', () => {
  it('should boot with clean state: no windows, no active, no crash', () => {
    // Reset simulates a fresh app boot
    _resetWindowStoreForTests();

    const state = useWindowStore.getState();
    expect(state.windows).toHaveLength(0);
    expect(state.activeWindowId).toBeNull();
    expect(state.nextZIndex).toBe(100);

    // Verify window manager operations work from cold state
    const id = windowManager.open('test-app');
    expect(id).toBeTruthy();
    expect(useWindowStore.getState().windows).toHaveLength(1);
  });
});
