/**
 * AI OS — App Registry
 *
 * Central registry for all applications in AI OS.
 * Replaces hardcoded app arrays in Dock and Desktop.
 *
 * The `experimental` flag allows future apps (e.g., Memory)
 * to be registered without appearing in production UI.
 */

import type { ComponentType } from 'react';

// ─── Types ───────────────────────────────────────────────────────────

export interface AppDefinition {
  /** Unique app identifier (e.g., 'chat', 'settings') */
  id: string;
  /** Display name shown in Dock tooltip and panel title */
  name: string;
  /** Emoji or icon string for the Dock */
  icon: string;
  /** React component to render when the app is opened */
  component: ComponentType;
  /**
   * If true, the app is hidden from the Dock unless experimental
   * features are enabled. Defaults to false.
   */
  experimental?: boolean;
  /**
   * Default window dimensions when opening this app.
   * Falls back to 480×560 if not specified.
   */
  defaultSize?: { width: number; height: number };
  /**
   * If true, only one instance of this app can be open at a time.
   * Opening a singleton app that's already open will focus the existing window.
   * @default false
   */
  singleton?: boolean;
}

// ─── Registry State ──────────────────────────────────────────────────

const apps = new Map<string, AppDefinition>();

// ─── Public API ──────────────────────────────────────────────────────

/** Register an application. */
export function registerApp(app: AppDefinition): void {
  if (apps.has(app.id)) {
    console.warn(`[App Registry] App "${app.id}" is already registered. Overwriting.`);
  }
  apps.set(app.id, app);
}

/** Get an app definition by ID. */
export function getApp(id: string): AppDefinition | undefined {
  return apps.get(id);
}

/** List all registered apps (including experimental). */
export function listApps(): AppDefinition[] {
  return Array.from(apps.values());
}

/** List only non-experimental apps (for Dock display). */
export function listVisibleApps(): AppDefinition[] {
  return Array.from(apps.values()).filter((app) => !app.experimental);
}

/**
 * Reset the registry. Primarily for testing.
 * @internal
 */
export function _resetAppRegistry(): void {
  apps.clear();
}
