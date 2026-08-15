/**
 * AI OS — File Repository
 *
 * Data access layer for the files table.
 * This is the ONLY file in the files feature that imports Dexie.
 *
 * Rule: No business logic here. No validation. No UUID generation.
 *       Just CRUD operations on the database.
 *
 * @see noteRepository.ts, taskRepository.ts — same pattern
 * @see ADR-010 — Single-Level Folder Hierarchy
 */

import { db } from '@core/db/database';
import type { FileEntry } from '@core/db/types';

// ─── File Repository ─────────────────────────────────────────────────

export const fileRepository = {
  /**
   * Get all non-deleted entries for a project, sorted by type (folders first) then name.
   * Soft-deleted entries are excluded by default.
   */
  async findByProject(projectId: string): Promise<FileEntry[]> {
    const entries = await db.files
      .where('projectId')
      .equals(projectId)
      .filter((e) => !e.isDeleted)
      .toArray();

    // Sort: folders first, then alphabetical by name
    return entries.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  },

  /**
   * Get all non-deleted children of a parent (folder or root).
   * parentId = null → root-level entries.
   */
  async findByParent(projectId: string, parentId: string | null): Promise<FileEntry[]> {
    const entries = await db.files
      .where('projectId')
      .equals(projectId)
      .filter((e) => !e.isDeleted && e.parentId === parentId)
      .toArray();

    return entries.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  },

  /**
   * Find a non-deleted entry with matching name in the same parent scope.
   * Used for uniqueness checks. Case-insensitive comparison.
   */
  async findByParentAndName(
    projectId: string,
    parentId: string | null,
    name: string,
  ): Promise<FileEntry | undefined> {
    const lowerName = name.toLowerCase();
    return db.files
      .where('projectId')
      .equals(projectId)
      .filter(
        (e) =>
          !e.isDeleted &&
          e.parentId === parentId &&
          e.name.toLowerCase() === lowerName,
      )
      .first();
  },

  /** Find a single entry by ID (including soft-deleted — for internal service use). */
  async findById(id: string): Promise<FileEntry | undefined> {
    return db.files.get(id);
  },

  /** Insert or update a file entry. */
  async upsert(entry: FileEntry): Promise<void> {
    await db.files.put(entry);
  },

  /** Hard-delete an entry by ID. */
  async remove(id: string): Promise<void> {
    await db.files.delete(id);
  },

  /** Count non-deleted entries for a project. */
  async count(projectId: string): Promise<number> {
    return db.files
      .where('projectId')
      .equals(projectId)
      .filter((e) => !e.isDeleted)
      .count();
  },

  /**
   * Get all non-deleted children of a folder (by parentId).
   * Used for cascade operations.
   */
  async findChildren(parentId: string): Promise<FileEntry[]> {
    return db.files
      .where('parentId')
      .equals(parentId)
      .filter((e) => !e.isDeleted)
      .toArray();
  },
};
