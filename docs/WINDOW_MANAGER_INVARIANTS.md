# Window Manager Invariants

These rules must always hold true. Validate against this checklist
when modifying any file in `src/shell/`.

## Identity

- Window IDs are `crypto.randomUUID()`. Never sequential, never timestamp-based.
- Window IDs are stable for the lifetime of the window instance.

## Singleton

- Singleton apps never have more than one window instance in the store.
- Opening a singleton that already exists focuses (or restores) the existing window.

## Z-Index

- Z-index always increases monotonically via `nextZIndex++`.
- No two windows ever share the same z-index.
- Base z-index is `100`. Windows occupy the `100–999` band.
- Higher bands are reserved: `1000+` context menus, `2000+` toasts, `3000+` dialogs, `4000+` emergency overlays.

## Active Window

- At most one window is active at any time (`activeWindowId`).
- Opening or focusing a window makes it active.
- Minimizing the active window clears `activeWindowId`.
- Closing the active window activates the top-most visible remaining window (highest z-index, not minimized).
- Closing the last window sets `activeWindowId` to `null`.
- A minimized window cannot be active until restored.

## Layering

- Desktop is a pure renderer. It never imports the app registry.
- Desktop reads window state from `windowStore` and renders `<Window>` components.
- `Window.tsx` resolves app components through `windowManager`, not the registry directly.
- `windowManager` is the only orchestration layer between UI and `windowStore`.
- Components never mutate `windowStore` directly — always through `windowManager`.

## Cascade

- New windows are positioned via cascade: base `(80, 40)`, offset `+30px` per step.
- Cascade wraps after 8 steps (back to base position).

## Test Coverage (Sprint 1E)

- 87 tests cover the window manager, selectors, regressions, stress tests, edge cases, cold start, and repository cleanup.
- All invariants above are verified by at least one test.
