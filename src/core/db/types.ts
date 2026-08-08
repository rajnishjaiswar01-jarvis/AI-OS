/**
 * AI OS — Database Entity Types
 *
 * Type definitions for all Dexie-stored entities.
 * Schema version 1: projects, settings, memory.
 */

// ─── Project ─────────────────────────────────────────────────────────

export interface Project {
  /** Primary key (UUID v4) */
  id: string;
  /** User-visible project name */
  name: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last-modified timestamp */
  updatedAt: string;
}

// ─── Setting ─────────────────────────────────────────────────────────

export interface Setting {
  /** Setting key (e.g., 'theme', 'wallpaper', 'ai.defaultProvider') */
  key: string;
  /** Setting value (JSON-serializable) */
  value: unknown;
}

// ─── Memory ──────────────────────────────────────────────────────────

export interface MemoryEntry {
  /** Primary key (auto-incremented) */
  id?: number;
  /** Memory category (e.g., 'recentProjects', 'recentFiles', 'workspace') */
  category: string;
  /** Arbitrary data for this memory entry */
  data: unknown;
  /** ISO 8601 timestamp */
  createdAt: string;
}

// ─── Note ────────────────────────────────────────────────────────────

export interface Note {
  /** Primary key (UUID v4) */
  id: string;
  /** Foreign key to Project — notes are always project-scoped */
  projectId: string;
  /** User-visible note title */
  title: string;
  /** Markdown-compatible plain text content */
  content: string;
  /** Soft delete flag — hidden from UI but recoverable */
  isDeleted: boolean;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last-modified timestamp */
  updatedAt: string;
}
