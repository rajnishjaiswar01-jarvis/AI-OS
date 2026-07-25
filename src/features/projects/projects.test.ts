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
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AiOSDatabase } from '@core/db/database';
import { projectRepository } from './projectRepository';
import { projectService } from './projectService';
import { useProjectStore } from './projectStore';
import { settingsRepository } from '@core/db/settingsRepository';

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
});
