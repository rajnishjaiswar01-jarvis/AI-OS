/**
 * AI OS — Note Repository
 *
 * Data access layer for the notes table.
 * This is the ONLY file in the notes feature that imports Dexie.
 *
 * Rule: No business logic here. No validation. No UUID generation.
 *       Just CRUD operations on the database.
 *
 * @see FOUNDATION_FREEZE.md — Repository Pattern
 */

import { db } from '@core/db/database';
import type { Note } from '@core/db/types';

// ─── Note Repository ─────────────────────────────────────────────────

export const noteRepository = {
  /**
   * Get all non-deleted notes for a project, sorted by most recently updated.
   * Soft-deleted notes are excluded by default.
   */
  async findByProject(projectId: string): Promise<Note[]> {
    return db.notes
      .where('projectId')
      .equals(projectId)
      .filter((n) => !n.isDeleted)
      .reverse()
      .sortBy('updatedAt');
  },

  /** Find a single note by ID (including soft-deleted). */
  async findById(id: string): Promise<Note | undefined> {
    return db.notes.get(id);
  },

  /** Insert or update a note record. */
  async upsert(note: Note): Promise<void> {
    await db.notes.put(note);
  },

  /** Hard-delete a note by ID. */
  async remove(id: string): Promise<void> {
    await db.notes.delete(id);
  },

  /** Count non-deleted notes for a project. */
  async count(projectId: string): Promise<number> {
    return db.notes
      .where('projectId')
      .equals(projectId)
      .filter((n) => !n.isDeleted)
      .count();
  },
};
