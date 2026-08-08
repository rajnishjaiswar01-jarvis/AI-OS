/**
 * AI OS — Database (Dexie)
 *
 * IndexedDB-backed persistent storage using Dexie.
 * Schema version 2: projects, settings, memory, notes.
 *
 * Schema versioning is built-in from day one via Dexie's .version() system.
 * Future sprints will add tables (files, tasks) without breaking
 * existing data.
 */

import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Project, Setting, MemoryEntry, Note } from './types';

// ─── Database Class ──────────────────────────────────────────────────

export class AiOSDatabase extends Dexie {
  projects!: Table<Project, string>;
  settings!: Table<Setting, string>;
  memory!: Table<MemoryEntry, number>;
  notes!: Table<Note, string>;

  constructor(name = 'ai-os-db') {
    super(name);

    // Schema version 1 — Foundation
    this.version(1).stores({
      projects: 'id, name, createdAt, updatedAt',
      settings: 'key',
      memory: '++id, category, createdAt',
    });

    // Schema version 2 — Notes (Sprint 2)
    this.version(2).stores({
      projects: 'id, name, createdAt, updatedAt',
      settings: 'key',
      memory: '++id, category, createdAt',
      notes: 'id, projectId, title, isDeleted, createdAt, updatedAt',
    });
  }
}

// ─── Singleton Instance ──────────────────────────────────────────────

/** Default database instance for the application */
export const db = new AiOSDatabase();
