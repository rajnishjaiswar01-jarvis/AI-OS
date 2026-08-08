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

  it('has all four tables', async () => {
    const db = createTestDb();
    await db.open();

    expect(db.tables.map((t) => t.name).sort()).toEqual([
      'memory',
      'notes',
      'projects',
      'settings',
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
});
