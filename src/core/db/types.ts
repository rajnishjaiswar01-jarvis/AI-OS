/**
 * AI OS — Database Entity Types
 *
 * Type definitions for all Dexie-stored entities.
 * Schema version 1: projects, settings, memory.
 * Schema version 2: notes.
 * Schema version 3: tasks.
 * Schema version 4: files.
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

// ─── FileEntry ───────────────────────────────────────────────────────

/**
 * File entry type discriminator.
 *
 * Uses const object + type union (not enum) to satisfy erasableSyntaxOnly.
 *
 * @see ADR-010 — Single-Level Folder Hierarchy
 */
export const FileEntryType = {
  File: 'file',
  Folder: 'folder',
} as const;

export type FileEntryType = (typeof FileEntryType)[keyof typeof FileEntryType];

export interface FileEntry {
  /** Primary key (UUID v4) */
  id: string;
  /** Foreign key to Project — files are always project-scoped */
  projectId: string;
  /**
   * Parent folder ID. null = project root.
   * If non-null, must reference a root-level folder (parentId constraint: depth ≤ 1).
   *
   * @see ADR-010 Invariant #1, #5
   */
  parentId: string | null;
  /** Display name (e.g., "report.md"). Must not contain / or \\ */
  name: string;
  /** Discriminator: "file" or "folder" */
  type: FileEntryType;
  /** Text content. Always "" for folders (ADR-010 Invariant #2) */
  content: string;
  /** Soft delete flag — hidden from UI but recoverable */
  isDeleted: boolean;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last-modified timestamp */
  updatedAt: string;
}
