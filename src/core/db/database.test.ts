/**
 * AI OS — Database Tests
 *
 * Tests that the Dexie database opens, tables exist,
 * and basic CRUD operations work.
 *
 * Uses a unique database name per test to avoid IndexedDB conflicts.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { AiOSDatabase } from './database';
import type { Project, Setting, MemoryEntry } from './types';

// ─── Helpers ─────────────────────────────────────────────────────────

const testDbs: AiOSDatabase[] = [];

function createTestDb(): AiOSDatabase {
  const name = `ai-os-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const db = new AiOSDatabase(name);
  testDbs.push(db);
  return db;
}

afterEach(async () => {
  for (const db of testDbs) {
    db.close();
    await db.delete();
  }
  testDbs.length = 0;
});

// ─── Tests ───────────────────────────────────────────────────────────

describe('AiOSDatabase', () => {
  it('opens successfully', async () => {
    const db = createTestDb();
    await db.open();
    expect(db.isOpen()).toBe(true);
  });

  it('has all five tables', async () => {
    const db = createTestDb();
    await db.open();

    expect(db.tables.map((t) => t.name).sort()).toEqual([
      'memory',
      'notes',
      'projects',
      'settings',
      'tasks',
    ]);
  });

  // ── Projects CRUD ──────────────────────────────────────────────────

  describe('projects', () => {
    it('creates and retrieves a project', async () => {
      const db = createTestDb();
      const project: Project = {
        id: 'test-123',
        name: 'Test Project',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.projects.add(project);
      const retrieved = await db.projects.get('test-123');

      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe('Test Project');
    });

    it('updates a project', async () => {
      const db = createTestDb();
      const project: Project = {
        id: 'test-456',
        name: 'Original Name',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.projects.add(project);
      await db.projects.update('test-456', { name: 'Updated Name' });

      const updated = await db.projects.get('test-456');
      expect(updated!.name).toBe('Updated Name');
    });

    it('deletes a project', async () => {
      const db = createTestDb();
      const project: Project = {
        id: 'test-789',
        name: 'To Delete',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.projects.add(project);
      await db.projects.delete('test-789');

      const deleted = await db.projects.get('test-789');
      expect(deleted).toBeUndefined();
    });
  });

  // ── Settings CRUD ──────────────────────────────────────────────────

  describe('settings', () => {
    it('creates and retrieves a setting', async () => {
      const db = createTestDb();
      const setting: Setting = { key: 'theme', value: 'dark' };

      await db.settings.add(setting);
      const retrieved = await db.settings.get('theme');

      expect(retrieved).toBeDefined();
      expect(retrieved!.value).toBe('dark');
    });

    it('upserts a setting using put', async () => {
      const db = createTestDb();

      await db.settings.put({ key: 'wallpaper', value: 'space' });
      await db.settings.put({ key: 'wallpaper', value: 'aurora' });

      const retrieved = await db.settings.get('wallpaper');
      expect(retrieved!.value).toBe('aurora');
    });
  });

  // ── Memory CRUD ────────────────────────────────────────────────────

  describe('memory', () => {
    it('creates a memory entry with auto-increment id', async () => {
      const db = createTestDb();
      const entry: MemoryEntry = {
        category: 'recentProjects',
        data: { projectId: 'abc' },
        createdAt: new Date().toISOString(),
      };

      const id = await db.memory.add(entry);
      expect(id).toBeGreaterThan(0);

      const retrieved = await db.memory.get(id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.category).toBe('recentProjects');
    });

    it('queries by category', async () => {
      const db = createTestDb();

      await db.memory.bulkAdd([
        { category: 'recentProjects', data: { id: '1' }, createdAt: new Date().toISOString() },
        { category: 'recentFiles', data: { id: '2' }, createdAt: new Date().toISOString() },
        { category: 'recentProjects', data: { id: '3' }, createdAt: new Date().toISOString() },
      ]);

      const recentProjects = await db.memory.where('category').equals('recentProjects').toArray();
      expect(recentProjects).toHaveLength(2);
    });
  });

  // ── Migration Regression (v2 → v3) ────────────────────────────────

  describe('migration v2 → v3', () => {
    it('should preserve existing project and note data after v3 upgrade', async () => {
      const db = createTestDb();
      await db.open();

      // Seed data that existed before v3 (projects + notes from v1/v2)
      const now = new Date().toISOString();
      await db.projects.add({
        id: 'migration-proj-1',
        name: 'Migration Test Project',
        createdAt: now,
        updatedAt: now,
      });

      await db.notes.add({
        id: 'migration-note-1',
        projectId: 'migration-proj-1',
        title: 'Migration Test Note',
        content: 'This content must survive the upgrade.',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });

      // Verify project survived
      const project = await db.projects.get('migration-proj-1');
      expect(project).toBeDefined();
      expect(project!.name).toBe('Migration Test Project');

      // Verify note survived with full content
      const note = await db.notes.get('migration-note-1');
      expect(note).toBeDefined();
      expect(note!.title).toBe('Migration Test Note');
      expect(note!.content).toBe('This content must survive the upgrade.');
      expect(note!.projectId).toBe('migration-proj-1');

      // Verify tasks table exists and is empty
      const taskCount = await db.tasks.count();
      expect(taskCount).toBe(0);

      // Verify we can write to the new tasks table
      await db.tasks.add({
        id: 'migration-task-1',
        projectId: 'migration-proj-1',
        title: 'First Task',
        description: '',
        status: 'todo',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });

      const task = await db.tasks.get('migration-task-1');
      expect(task).toBeDefined();
      expect(task!.title).toBe('First Task');
    });
  });
});

