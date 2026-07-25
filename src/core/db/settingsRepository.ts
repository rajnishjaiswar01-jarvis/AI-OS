/**
 * AI OS — Settings Repository
 *
 * Data access layer for the settings table.
 * Generic key-value store for app-level settings.
 * This is the ONLY settings file that imports Dexie.
 *
 * Used by services to persist settings like activeProjectId, theme, etc.
 *
 * @see DATABASE_DESIGN.md §2 — settings table
 */

import { db } from '@core/db/database';
import type { Setting } from '@core/db/types';

// ─── Settings Repository ─────────────────────────────────────────────

export const settingsRepository = {
  /** Get a setting value by key. Returns undefined if not found. */
  async get<T = unknown>(key: string): Promise<T | undefined> {
    const setting = await db.settings.get(key);
    return setting?.value as T | undefined;
  },

  /** Set a setting value. Creates or updates. */
  async set(key: string, value: unknown): Promise<void> {
    const setting: Setting = { key, value };
    await db.settings.put(setting);
  },

  /** Remove a setting by key. */
  async remove(key: string): Promise<void> {
    await db.settings.delete(key);
  },
};
