/**
 * AI OS — Database (Dexie)
 *
 * IndexedDB-backed persistent storage using Dexie.
 * Schema version 4: projects, settings, memory, notes, tasks, files.
 *
 * Schema versioning is built-in from day one via Dexie's .version() system.
 * Each sprint adds tables without breaking existing data.
 */

import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Project, Setting, MemoryEntry, Note, Task, FileEntry } from './types';

// ─── Database Class ──────────────────────────────────────────────────

export class AiOSDatabase extends Dexie {
  projects!: Table<Project, string>;
  settings!: Table<Setting, string>;
  memory!: Table<MemoryEntry, number>;
  notes!: Table<Note, string>;
  tasks!: Table<Task, string>;
  files!: Table<FileEntry, string>;

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

    // Schema version 3 — Tasks (Sprint 3)
    this.version(3).stores({
      projects: 'id, name, createdAt, updatedAt',
      settings: 'key',
      memory: '++id, category, createdAt',
      notes: 'id, projectId, title, isDeleted, createdAt, updatedAt',
      tasks: 'id, projectId, status, isDeleted, createdAt, updatedAt',
    });

    // Schema version 4 — Files (Sprint 4)
    this.version(4).stores({
      projects: 'id, name, createdAt, updatedAt',
      settings: 'key',
      memory: '++id, category, createdAt',
      notes: 'id, projectId, title, isDeleted, createdAt, updatedAt',
      tasks: 'id, projectId, status, isDeleted, createdAt, updatedAt',
      files: 'id, projectId, parentId, type, isDeleted, createdAt, updatedAt',
    });
  }
}

// ─── Singleton Instance ──────────────────────────────────────────────

/** Default database instance for the application */
export const db = new AiOSDatabase();

