/**
 * AI OS — Window Types
 *
 * Data model for the window management system.
 * WindowInstance represents a single open window on the desktop.
 * WindowState uses an enum (not booleans) to support future states.
 *
 * @see Sprint 1D — Window Manager
 */

// ─── Window State ────────────────────────────────────────────────────

/**
 * Possible states for a window.
 * Even though only Normal and Minimized are implemented in Sprint 1D,
 * Maximized is reserved to avoid a breaking change later.
 *
 * Uses const object + type union instead of enum to satisfy erasableSyntaxOnly.
 */
export const WindowState = {
  Normal: 'normal',
  Minimized: 'minimized',
  Maximized: 'maximized',
} as const;

export type WindowState = (typeof WindowState)[keyof typeof WindowState];

// ─── Window Instance ─────────────────────────────────────────────────

/**
 * Represents a single open window on the desktop.
 *
 * - `appId` links to AppDefinition in the registry.
 * - `projectId` scopes the window to a project (future: Notes, Files, Tasks).
 * - `zIndex` determines stacking order; managed by the window store.
 */
export interface WindowInstance {
  /** Unique window identifier (UUID v4) */
  id: string;

  /** App this window belongs to (references AppDefinition.id) */
  appId: string;

  /** Project scope for this window. Null = global / unscoped. */
  projectId: string | null;

  /** Window title (typically from AppDefinition.name) */
  title: string;

  /** Current window state */
  state: WindowState;

  /** Position relative to the desktop canvas */
  position: {
    x: number;
    y: number;
  };

  /** Window dimensions in pixels */
  size: {
    width: number;
    height: number;
  };

  /** Stacking order. Higher = on top. */
  zIndex: number;
}
