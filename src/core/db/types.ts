/**
 * AI OS — Database Entity Types
 *
 * Type definitions for all Dexie-stored entities.
 * Schema version 1: projects, settings, memory.
 * Schema version 2: notes.
 * Schema version 3: tasks.
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

// ─── Task ────────────────────────────────────────────────────────────

/**
 * Task lifecycle status.
 *
 * Uses const object + type union (not enum) to satisfy erasableSyntaxOnly.
 * Any valid status can be set freely — no transition graph in Sprint 3.
 *
 * @see WindowState for the same pattern.
 */
export const TaskStatus = {
  Todo: 'todo',
  InProgress: 'in_progress',
  Done: 'done',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export interface Task {
  /** Primary key (UUID v4) */
  id: string;
  /** Foreign key to Project — tasks are always project-scoped */
  projectId: string;
  /** User-visible task title (required, ≤200 chars) */
  title: string;
  /** Optional task description */
  description: string;
  /** Current lifecycle status */
  status: TaskStatus;
  /** Soft delete flag — hidden from UI but recoverable */
  isDeleted: boolean;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last-modified timestamp */
  updatedAt: string;
}
