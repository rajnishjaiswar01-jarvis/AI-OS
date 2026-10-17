/**
 * AI OS — Project Feature Tests
 *
 * Tests the full project lifecycle through the service layer.
 * Uses a fresh test database per test to avoid IndexedDB conflicts.
 *
 * Tests cover:
 * - Create project → exists in store AND Dexie
 * - Rename project → name updated in store AND Dexie
 * - Delete project → removed from store AND Dexie
 * - Delete active project → activeProjectId becomes null
 * - Load projects → hydrates from DB
 * - Active project persists across store reloads
 * - Cascade delete → notes, tasks, files removed with project
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AiOSDatabase } from '@core/db/database';
import { projectRepository } from './projectRepository';
import { noteRepository } from '@features/notes/noteRepository';
import { taskRepository } from '@features/tasks/taskRepository';
import { fileRepository } from '@features/files/fileRepository';
import { projectService } from './projectService';
import { useProjectStore } from './projectStore';
import { settingsRepository } from '@core/db/settingsRepository';
import type { Note, Task, FileEntry } from '@core/db/types';

// ─── Test Database Setup ─────────────────────────────────────────────

const testDbs: AiOSDatabase[] = [];
let testDb: AiOSDatabase;

function createTestDb(): AiOSDatabase {
  const name = `ai-os-project-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const db = new AiOSDatabase(name);
  testDbs.push(db);
  return db;
}

// Mock the database module so all code uses our test DB
vi.mock('@core/db/database', async (importOriginal) => {
  const original = await importOriginal<typeof import('@core/db/database')>();
  return {
    ...original,
    get db() {
      return testDb;
    },
  };
});

beforeEach(() => {
  // Reset Zustand store to clean state
  useProjectStore.setState({
    projects: [],
    activeProjectId: null,
  });

  // Create a fresh test DB
  testDb = createTestDb();
});

afterEach(async () => {
  for (const db of testDbs) {
    db.close();
    await db.delete();
  }
  testDbs.length = 0;
});


// ─── Tests ───────────────────────────────────────────────────────────

describe('Project Service', () => {
  describe('createProject', () => {
    it('should create a project and add it to the store', async () => {
      const project = await projectService.createProject('Test Project');

      expect(project.name).toBe('Test Project');
      expect(project.id).toBeTruthy();
      expect(project.createdAt).toBeTruthy();
      expect(project.updatedAt).toBeTruthy();

      // Verify store
      const { projects } = useProjectStore.getState();
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Test Project');
    });

    it('should set the new project as active', async () => {
      const project = await projectService.createProject('Active Project');

      const { activeProjectId } = useProjectStore.getState();
      expect(activeProjectId).toBe(project.id);
    });

    it('should persist the project to Dexie', async () => {
      const project = await projectService.createProject('Persisted Project');

      const fromDb = await projectRepository.findById(project.id);
      expect(fromDb).toBeDefined();
      expect(fromDb!.name).toBe('Persisted Project');
    });

    it('should reject empty names', async () => {
      await expect(projectService.createProject('')).rejects.toThrow('Project name cannot be empty');
      await expect(projectService.createProject('   ')).rejects.toThrow('Project name cannot be empty');
    });

    it('should reject names over 100 characters', async () => {
      const longName = 'a'.repeat(101);
      await expect(projectService.createProject(longName)).rejects.toThrow('100 characters');
    });

    it('should trim whitespace from names', async () => {
      const project = await projectService.createProject('  Trimmed Name  ');
      expect(project.name).toBe('Trimmed Name');
    });
  });

  describe('renameProject', () => {
    it('should rename a project in store and Dexie', async () => {
      const project = await projectService.createProject('Original');

      await projectService.renameProject(project.id, 'Renamed');

      // Verify store
      const { projects } = useProjectStore.getState();
      expect(projects[0].name).toBe('Renamed');

      // Verify Dexie
      const fromDb = await projectRepository.findById(project.id);
      expect(fromDb!.name).toBe('Renamed');
    });

    it('should update updatedAt on rename', async () => {
      const project = await projectService.createProject('Original');
      const originalUpdatedAt = project.updatedAt;

      // Small delay to ensure different timestamp
      await new Promise((r) => setTimeout(r, 10));

      await projectService.renameProject(project.id, 'Renamed');

      const fromDb = await projectRepository.findById(project.id);
      expect(fromDb!.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should reject empty names', async () => {
      const project = await projectService.createProject('Original');
      await expect(projectService.renameProject(project.id, '')).rejects.toThrow('empty');
    });

    it('should throw NOT_FOUND for non-existent project', async () => {
      await expect(
        projectService.renameProject('non-existent-id', 'Name')
      ).rejects.toThrow('not found');
    });

    it('should no-op if name is unchanged', async () => {
      const project = await projectService.createProject('Same Name');
      const originalUpdatedAt = project.updatedAt;

      await projectService.renameProject(project.id, 'Same Name');

      const fromDb = await projectRepository.findById(project.id);
      expect(fromDb!.updatedAt).toBe(originalUpdatedAt);
    });
  });

  describe('deleteProject', () => {
    it('should remove a project from store and Dexie', async () => {
      const project = await projectService.createProject('To Delete');

      await projectService.deleteProject(project.id);

      // Verify store
      const { projects } = useProjectStore.getState();
      expect(projects).toHaveLength(0);

      // Verify Dexie
      const fromDb = await projectRepository.findById(project.id);
      expect(fromDb).toBeUndefined();
    });

    it('should clear activeProjectId when deleting the active project', async () => {
      const project = await projectService.createProject('Active to Delete');
      expect(useProjectStore.getState().activeProjectId).toBe(project.id);

      await projectService.deleteProject(project.id);

      expect(useProjectStore.getState().activeProjectId).toBeNull();
    });

    it('should not affect activeProjectId when deleting a non-active project', async () => {
      const first = await projectService.createProject('First');
      const second = await projectService.createProject('Second');

      // Second is active (created last)
      expect(useProjectStore.getState().activeProjectId).toBe(second.id);

      await projectService.deleteProject(first.id);

      // Active should still be second
      expect(useProjectStore.getState().activeProjectId).toBe(second.id);
    });
  });

  describe('loadProjects (hydration)', () => {
    it('should hydrate store from Dexie', async () => {
      // Create projects directly via service
      await projectService.createProject('Project A');
      await projectService.createProject('Project B');

      // Reset store (simulating app restart)
      useProjectStore.setState({ projects: [], activeProjectId: null });
      expect(useProjectStore.getState().projects).toHaveLength(0);

      // Reload from Dexie
      await projectService.loadProjects();

      const { projects } = useProjectStore.getState();
      expect(projects).toHaveLength(2);
    });

    it('should restore active project from settings', async () => {
      const project = await projectService.createProject('Persisted Active');

      // Reset store (simulating app restart)
      useProjectStore.setState({ projects: [], activeProjectId: null });

      // Reload from Dexie — should restore activeProjectId from settings
      await projectService.loadProjects();

      expect(useProjectStore.getState().activeProjectId).toBe(project.id);
    });

    it('should not restore active project if it no longer exists', async () => {
      const project = await projectService.createProject('Will Be Deleted');

      // Delete from Dexie directly (simulate external change)
      await projectRepository.remove(project.id);

      // Reset store
      useProjectStore.setState({ projects: [], activeProjectId: null });

      // Reload — settings still has old ID, but project doesn't exist
      await projectService.loadProjects();

      expect(useProjectStore.getState().activeProjectId).toBeNull();
    });
  });

  describe('setActiveProject (persistence)', () => {
    it('should persist active project to settings', async () => {
      const project = await projectService.createProject('To Activate');

      // Create a second project (which becomes active)
      const second = await projectService.createProject('Second');
      expect(useProjectStore.getState().activeProjectId).toBe(second.id);

      // Switch back to first
      await projectService.setActiveProject(project.id);
      expect(useProjectStore.getState().activeProjectId).toBe(project.id);

      // Verify it persisted by checking settings
      const persisted = await settingsRepository.get<string>('activeProjectId');
      expect(persisted).toBe(project.id);
    });
  });

  // ─── Sprint 1E: Repository Cleanup Regression ───────────────────────

  describe('repository cleanup (Sprint 1E)', () => {
    it('should fully remove project from DB after delete and reload', async () => {
      // Create a project
      const project = await projectService.createProject('Cleanup Test');
      expect(project.id).toBeTruthy();

      // Verify it exists in Dexie
      const beforeDelete = await projectRepository.findById(project.id);
      expect(beforeDelete).toBeDefined();

      // Delete through service
      await projectService.deleteProject(project.id);

      // Verify gone from store
      expect(useProjectStore.getState().projects).toHaveLength(0);

      // Reset store to simulate app restart
      useProjectStore.setState({ projects: [], activeProjectId: null });

      // Reload from Dexie — project should not reappear
      await projectService.loadProjects();

      const { projects } = useProjectStore.getState();
      expect(projects).toHaveLength(0);

      // Double-check directly in Dexie
      const afterReload = await projectRepository.findById(project.id);
      expect(afterReload).toBeUndefined();
    });
  });

  // ─── Cascade Delete Tests ───────────────────────────────────────────

  describe('cascade delete', () => {
    /** Helper: seed a note directly via repository. */
    async function seedNote(projectId: string, title: string, opts?: Partial<Note>): Promise<Note> {
      const now = new Date().toISOString();
      const note: Note = {
        id: crypto.randomUUID(),
        projectId,
        title,
        content: '',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        ...opts,
      };
      await noteRepository.upsert(note);
      return note;
    }

    /** Helper: seed a task directly via repository. */
    async function seedTask(projectId: string, title: string, opts?: Partial<Task>): Promise<Task> {
      const now = new Date().toISOString();
      const task: Task = {
        id: crypto.randomUUID(),
        projectId,
        title,
        description: '',
        status: 'todo',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        ...opts,
      };
      await taskRepository.upsert(task);
      return task;
    }

    /** Helper: seed a file entry directly via repository. */
    async function seedFile(projectId: string, name: string, opts?: Partial<FileEntry>): Promise<FileEntry> {
      const now = new Date().toISOString();
      const entry: FileEntry = {
        id: crypto.randomUUID(),
        projectId,
        parentId: null,
        name,
        type: 'file',
        content: '',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        ...opts,
      };
      await fileRepository.upsert(entry);
      return entry;
    }

    it('should cascade-delete notes, tasks, and files when deleting a project', async () => {
      const project = await projectService.createProject('Cascade Test');

      // Seed child entities
      const note = await seedNote(project.id, 'Test Note');
      const task = await seedTask(project.id, 'Test Task');
      const file = await seedFile(project.id, 'test.md');

      // Verify children exist in Dexie
      expect(await noteRepository.findById(note.id)).toBeDefined();
      expect(await taskRepository.findById(task.id)).toBeDefined();
      expect(await fileRepository.findById(file.id)).toBeDefined();

      // Delete the project
      await projectService.deleteProject(project.id);

      // Project is gone
      expect(await projectRepository.findById(project.id)).toBeUndefined();

      // All children are gone from Dexie
      expect(await noteRepository.findById(note.id)).toBeUndefined();
      expect(await taskRepository.findById(task.id)).toBeUndefined();
      expect(await fileRepository.findById(file.id)).toBeUndefined();
    });

    it('should succeed when deleting a project with no child records', async () => {
      const project = await projectService.createProject('Empty Project');

      // No children seeded — delete should not throw
      await projectService.deleteProject(project.id);

      expect(await projectRepository.findById(project.id)).toBeUndefined();
      expect(useProjectStore.getState().projects).toHaveLength(0);
    });

    it('should not affect unrelated projects or their data', async () => {
      const toDelete = await projectService.createProject('Delete Me');
      const toKeep = await projectService.createProject('Keep Me');

      // Seed children for BOTH projects
      await seedNote(toDelete.id, 'Delete Note');
      await seedTask(toDelete.id, 'Delete Task');
      await seedFile(toDelete.id, 'delete.md');

      const keepNote = await seedNote(toKeep.id, 'Keep Note');
      const keepTask = await seedTask(toKeep.id, 'Keep Task');
      const keepFile = await seedFile(toKeep.id, 'keep.md');

      // Delete only the first project
      await projectService.deleteProject(toDelete.id);

      // Kept project and its children are untouched
      expect(await projectRepository.findById(toKeep.id)).toBeDefined();
      expect(await noteRepository.findById(keepNote.id)).toBeDefined();
      expect(await taskRepository.findById(keepTask.id)).toBeDefined();
      expect(await fileRepository.findById(keepFile.id)).toBeDefined();
    });

    it('should also delete soft-deleted child records', async () => {
      const project = await projectService.createProject('Soft Delete Test');

      // Seed soft-deleted children (isDeleted = true)
      const softNote = await seedNote(project.id, 'Soft Note', { isDeleted: true });
      const softTask = await seedTask(project.id, 'Soft Task', { isDeleted: true });
      const softFile = await seedFile(project.id, 'soft.md', { isDeleted: true });

      // Also seed an active child to verify both are removed
      const activeNote = await seedNote(project.id, 'Active Note');

      // Verify soft-deleted records exist in Dexie (they are just flagged, not gone)
      expect(await noteRepository.findById(softNote.id)).toBeDefined();
      expect(await taskRepository.findById(softTask.id)).toBeDefined();
      expect(await fileRepository.findById(softFile.id)).toBeDefined();

      await projectService.deleteProject(project.id);

      // All children — soft-deleted AND active — are hard-deleted
      expect(await noteRepository.findById(softNote.id)).toBeUndefined();
      expect(await taskRepository.findById(softTask.id)).toBeUndefined();
      expect(await fileRepository.findById(softFile.id)).toBeUndefined();
      expect(await noteRepository.findById(activeNote.id)).toBeUndefined();
    });

    it('should cascade-delete files including folders and their children', async () => {
      const project = await projectService.createProject('Folder Test');

      // Seed a folder and a file inside it
      const folder = await seedFile(project.id, 'docs', { type: 'folder' });
      const childFile = await seedFile(project.id, 'readme.md', { parentId: folder.id });
      const rootFile = await seedFile(project.id, 'index.ts');

      await projectService.deleteProject(project.id);

      // All file entries are gone — folders, children, root files
      expect(await fileRepository.findById(folder.id)).toBeUndefined();
      expect(await fileRepository.findById(childFile.id)).toBeUndefined();
      expect(await fileRepository.findById(rootFile.id)).toBeUndefined();
    });

    it('should be atomic — project remains if child cleanup is simulated to fail', async () => {
      const project = await projectService.createProject('Atomic Test');
      const note = await seedNote(project.id, 'Should Survive');

      // Temporarily sabotage noteRepository.removeByProject to throw inside the transaction
      const originalRemoveByProject = noteRepository.removeByProject;
      noteRepository.removeByProject = async () => {
        throw new Error('Simulated failure');
      };

      // The delete should fail
      await expect(projectService.deleteProject(project.id)).rejects.toThrow('Simulated failure');

      // Restore original method
      noteRepository.removeByProject = originalRemoveByProject;

      // Project and note should both still exist (transaction rolled back)
      expect(await projectRepository.findById(project.id)).toBeDefined();
      expect(await noteRepository.findById(note.id)).toBeDefined();
    });
  });
});

