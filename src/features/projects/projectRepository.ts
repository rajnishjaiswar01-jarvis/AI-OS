/**
 * AI OS — Project Repository
 *
 * Data access layer for the projects table.
 * This is the ONLY file in the projects feature that imports Dexie.
 *
 * Rule: No business logic here. No validation. No UUID generation.
 *       Just CRUD operations on the database.
 *
 * @see SYSTEM_ARCHITECTURE.md §2.4 — Repository Layer
 * @see DATABASE_DESIGN.md §2 — Schema Definition
 */

import { db } from '@core/db/database';
import type { Project } from '@core/db/types';

// ─── Project Repository ──────────────────────────────────────────────

export const projectRepository = {
  /** Get all projects, sorted by most recently updated first. */
  async findAll(): Promise<Project[]> {
    return db.projects.orderBy('updatedAt').reverse().toArray();
  },

  /** Find a single project by ID. */
  async findById(id: string): Promise<Project | undefined> {
    return db.projects.get(id);
  },

  /** Insert or update a project record. */
  async save(project: Project): Promise<void> {
    await db.projects.put(project);
  },

  /** Delete a project by ID. */
  async remove(id: string): Promise<void> {
    await db.projects.delete(id);
  },

  /** Count total projects. */
  async count(): Promise<number> {
    return db.projects.count();
  },
};
