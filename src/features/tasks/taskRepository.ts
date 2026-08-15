/**
 * AI OS — Task Repository
 *
 * Data access layer for the tasks table.
 * This is the ONLY file in the tasks feature that imports Dexie.
 *
 * Rule: No business logic here. No validation. No UUID generation.
 *       Just CRUD operations on the database.
 *
 * No status filtering method — status filtering is done in-memory
 * at the store/UI layer (Sprint 3 Constraint #4).
 *
 * @see noteRepository.ts — same pattern
 */

import { db } from '@core/db/database';
import type { Task } from '@core/db/types';

// ─── Task Repository ─────────────────────────────────────────────────

export const taskRepository = {
  /**
   * Get all non-deleted tasks for a project, sorted by most recently created.
   * Soft-deleted tasks are excluded by default.
   */
  async findByProject(projectId: string): Promise<Task[]> {
    return db.tasks
      .where('projectId')
      .equals(projectId)
      .filter((t) => !t.isDeleted)
      .reverse()
      .sortBy('createdAt');
  },

  /** Find a single task by ID (including soft-deleted — for internal service use). */
  async findById(id: string): Promise<Task | undefined> {
    return db.tasks.get(id);
  },

  /** Insert or update a task record. */
  async upsert(task: Task): Promise<void> {
    await db.tasks.put(task);
  },

  /** Hard-delete a task by ID. */
  async remove(id: string): Promise<void> {
    await db.tasks.delete(id);
  },

  /** Count non-deleted tasks for a project. */
  async count(projectId: string): Promise<number> {
    return db.tasks
      .where('projectId')
      .equals(projectId)
      .filter((t) => !t.isDeleted)
      .count();
  },
};
