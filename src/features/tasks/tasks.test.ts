/**
 * AI OS — Tasks Feature Tests
 *
 * Tests the full task lifecycle through the service layer.
 * Uses a fresh test database per test to avoid IndexedDB conflicts.
 *
 * Coverage:
 *
 * Repository (6 tests):
 *   - upsert + findById
 *   - findByProject (filters by projectId)
 *   - findByProject excludes soft-deleted
 *   - project isolation (only matching projectId)
 *   - remove (hard delete)
 *   - count (non-deleted only)
 *
 * Service — Validation (5 tests):
 *   - create valid task with explicit title
 *   - empty title rejected
 *   - whitespace title rejected
 *   - title over 200 chars rejected
 *   - nonexistent project rejected
 *
 * Service — Deleted Entity Guard (4 tests):
 *   - updateTaskTitle on deleted task → DELETED_ENTITY
 *   - updateTaskDescription on deleted task → DELETED_ENTITY
 *   - setTaskStatus on deleted task → DELETED_ENTITY
 *   - deleteTask on already-deleted task → idempotent no-op
 *
 * Service — Status (3 tests):
 *   - set status to any valid value freely
 *   - reject invalid status string
 *   - status persists in Dexie
 *
 * Service — CRUD (5 tests):
 *   - persist task to Dexie on create
 *   - rename task in store and Dexie
 *   - rename no-op if unchanged
 *   - update description in store and Dexie
 *   - soft-delete task
 *
 * Service — Active Task (3 tests):
 *   - new task becomes active
 *   - delete active task clears selection
 *   - getActiveTask returns correct task
 *
 * Service — Load / Project Switching (4 tests):
 *   - loadTasks hydrates store
 *   - loadTasks only loads matching project
 *   - loadTasks clears activeTaskId
 *   - project switch loads correct tasks
 *
 * Service — Edge Cases (2 tests):
 *   - clearTasks empties store
 *   - delete nonexistent task is no-op
 *
 * Store (4 tests):
 *   - addTask adds to front
 *   - updateTask by id
 *   - removeTask clears active if it was active
 *   - setActiveTask works
 *
 * @see Sprint 3 — Tasks Workspace
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AiOSDatabase } from '@core/db/database';
import { taskRepository } from './taskRepository';
import { taskService } from './taskService';
import { useTaskStore, _resetTaskStoreForTests } from './taskStore';

// ─── Test Database Setup ─────────────────────────────────────────────

const testDbs: AiOSDatabase[] = [];
let testDb: AiOSDatabase;

function createTestDb(): AiOSDatabase {
  const name = `ai-os-tasks-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

// Mock the project repository for project existence checks
vi.mock('@features/projects/projectRepository', () => ({
  projectRepository: {
    findById: vi.fn(async (id: string) => {
      // Known test project IDs are treated as existing
      if (id === TEST_PROJECT_ID || id === TEST_PROJECT_ID_2) {
        return { id, name: `Test Project ${id}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      }
      return undefined;
    }),
  },
}));

const TEST_PROJECT_ID = 'project-test-001';
const TEST_PROJECT_ID_2 = 'project-test-002';

beforeEach(() => {
  _resetTaskStoreForTests();
  testDb = createTestDb();
});

afterEach(async () => {
  for (const db of testDbs) {
    db.close();
    await db.delete();
  }
  testDbs.length = 0;
});

// ─── Repository Tests ────────────────────────────────────────────────

describe('Task Repository', () => {
  it('should upsert and findById', async () => {
    const task = {
      id: 'repo-test-1',
      projectId: TEST_PROJECT_ID,
      title: 'Repo Test',
      description: 'Some description',
      status: 'todo' as const,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await taskRepository.upsert(task);
    const found = await taskRepository.findById('repo-test-1');

    expect(found).toBeDefined();
    expect(found!.title).toBe('Repo Test');
    expect(found!.description).toBe('Some description');
    expect(found!.status).toBe('todo');
  });

  it('should findByProject and filter by projectId', async () => {
    const taskA = {
      id: 'iso-a',
      projectId: TEST_PROJECT_ID,
      title: 'A',
      description: '',
      status: 'todo' as const,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const taskB = {
      id: 'iso-b',
      projectId: TEST_PROJECT_ID_2,
      title: 'B',
      description: '',
      status: 'todo' as const,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await taskRepository.upsert(taskA);
    await taskRepository.upsert(taskB);

    const project1Tasks = await taskRepository.findByProject(TEST_PROJECT_ID);
    expect(project1Tasks).toHaveLength(1);
    expect(project1Tasks[0].id).toBe('iso-a');
  });

  it('should exclude soft-deleted tasks from findByProject', async () => {
    const task = {
      id: 'soft-del-1',
      projectId: TEST_PROJECT_ID,
      title: 'Deleted',
      description: '',
      status: 'todo' as const,
      isDeleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await taskRepository.upsert(task);
    const tasks = await taskRepository.findByProject(TEST_PROJECT_ID);

    expect(tasks).toHaveLength(0);
  });

  it('should hard-delete with remove', async () => {
    const task = {
      id: 'hard-del-1',
      projectId: TEST_PROJECT_ID,
      title: 'Will Remove',
      description: '',
      status: 'todo' as const,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await taskRepository.upsert(task);
    await taskRepository.remove('hard-del-1');

    const found = await taskRepository.findById('hard-del-1');
    expect(found).toBeUndefined();
  });

  it('should count non-deleted tasks for a project', async () => {
    const now = new Date().toISOString();
    await taskRepository.upsert({ id: 'c1', projectId: TEST_PROJECT_ID, title: 'A', description: '', status: 'todo', isDeleted: false, createdAt: now, updatedAt: now });
    await taskRepository.upsert({ id: 'c2', projectId: TEST_PROJECT_ID, title: 'B', description: '', status: 'in_progress', isDeleted: false, createdAt: now, updatedAt: now });
    await taskRepository.upsert({ id: 'c3', projectId: TEST_PROJECT_ID, title: 'C', description: '', status: 'done', isDeleted: true, createdAt: now, updatedAt: now });
    await taskRepository.upsert({ id: 'c4', projectId: TEST_PROJECT_ID_2, title: 'D', description: '', status: 'todo', isDeleted: false, createdAt: now, updatedAt: now });

    const count = await taskRepository.count(TEST_PROJECT_ID);
    expect(count).toBe(2);
  });

  it('should return tasks sorted by createdAt descending', async () => {
    const base = Date.now();
    await taskRepository.upsert({ id: 's1', projectId: TEST_PROJECT_ID, title: 'Old', description: '', status: 'todo', isDeleted: false, createdAt: new Date(base).toISOString(), updatedAt: new Date(base).toISOString() });
    await taskRepository.upsert({ id: 's2', projectId: TEST_PROJECT_ID, title: 'New', description: '', status: 'todo', isDeleted: false, createdAt: new Date(base + 1000).toISOString(), updatedAt: new Date(base + 1000).toISOString() });

    const tasks = await taskRepository.findByProject(TEST_PROJECT_ID);
    expect(tasks[0].title).toBe('New');
    expect(tasks[1].title).toBe('Old');
  });
});

// ─── Service — Validation Tests ──────────────────────────────────────

describe('Task Service — Validation', () => {
  it('should create a task with a valid title', async () => {
    const task = await taskService.createTask(TEST_PROJECT_ID, 'Valid Title');

    expect(task.title).toBe('Valid Title');
    expect(task.id).toBeTruthy();
    expect(task.projectId).toBe(TEST_PROJECT_ID);
    expect(task.description).toBe('');
    expect(task.status).toBe('todo');
    expect(task.isDeleted).toBe(false);
  });

  it('should reject empty titles', async () => {
    await expect(taskService.createTask(TEST_PROJECT_ID, '')).rejects.toThrow('empty');
  });

  it('should reject whitespace-only titles', async () => {
    await expect(taskService.createTask(TEST_PROJECT_ID, '   ')).rejects.toThrow('empty');
  });

  it('should reject titles over 200 characters', async () => {
    const longTitle = 'a'.repeat(201);
    await expect(taskService.createTask(TEST_PROJECT_ID, longTitle)).rejects.toThrow('200');
  });

  it('should reject creation for nonexistent project', async () => {
    await expect(taskService.createTask('nonexistent-project', 'Task')).rejects.toThrow('not found');
  });
});

// ─── Service — Deleted Entity Guard Tests ────────────────────────────

describe('Task Service — Deleted Entity Guard', () => {
  it('should reject updateTaskTitle on deleted task', async () => {
    const task = await taskService.createTask(TEST_PROJECT_ID, 'Will Delete');
    await taskService.deleteTask(task.id);

    await expect(taskService.updateTaskTitle(task.id, 'New Title')).rejects.toThrow('Cannot modify a deleted task');
  });

  it('should reject updateTaskDescription on deleted task', async () => {
    const task = await taskService.createTask(TEST_PROJECT_ID, 'Will Delete');
    await taskService.deleteTask(task.id);

    await expect(taskService.updateTaskDescription(task.id, 'New description')).rejects.toThrow('Cannot modify a deleted task');
  });

  it('should reject setTaskStatus on deleted task', async () => {
    const task = await taskService.createTask(TEST_PROJECT_ID, 'Will Delete');
    await taskService.deleteTask(task.id);

    await expect(taskService.setTaskStatus(task.id, 'done')).rejects.toThrow('Cannot modify a deleted task');
  });

  it('should allow deleteTask on already-deleted task (idempotent)', async () => {
    const task = await taskService.createTask(TEST_PROJECT_ID, 'Will Delete Twice');
    await taskService.deleteTask(task.id);

    // Second delete should not throw
    await taskService.deleteTask(task.id);

    const fromDb = await taskRepository.findById(task.id);
    expect(fromDb!.isDeleted).toBe(true);
  });
});

// ─── Service — Status Tests ─────────────────────────────────────────

describe('Task Service — Status', () => {
  it('should allow setting any valid status freely', async () => {
    const task = await taskService.createTask(TEST_PROJECT_ID, 'Status Test');

    // TODO → DONE (skip IN_PROGRESS)
    await taskService.setTaskStatus(task.id, 'done');
    let fromDb = await taskRepository.findById(task.id);
    expect(fromDb!.status).toBe('done');

    // DONE → TODO (reverse)
    await taskService.setTaskStatus(task.id, 'todo');
    fromDb = await taskRepository.findById(task.id);
    expect(fromDb!.status).toBe('todo');

    // TODO → IN_PROGRESS
    await taskService.setTaskStatus(task.id, 'in_progress');
    fromDb = await taskRepository.findById(task.id);
    expect(fromDb!.status).toBe('in_progress');
  });

  it('should reject invalid status string', async () => {
    const task = await taskService.createTask(TEST_PROJECT_ID, 'Invalid Status');

    await expect(taskService.setTaskStatus(task.id, 'invalid')).rejects.toThrow('Invalid task status');
    await expect(taskService.setTaskStatus(task.id, '')).rejects.toThrow('Invalid task status');
  });

  it('should persist status change in Dexie', async () => {
    const task = await taskService.createTask(TEST_PROJECT_ID, 'Persist Status');

    await taskService.setTaskStatus(task.id, 'in_progress');

    const fromDb = await taskRepository.findById(task.id);
    expect(fromDb!.status).toBe('in_progress');

    // Also verify store
    const storeTask = useTaskStore.getState().tasks.find((t) => t.id === task.id);
    expect(storeTask!.status).toBe('in_progress');
  });
});

// ─── Service — CRUD Tests ────────────────────────────────────────────

describe('Task Service — CRUD', () => {
  it('should persist task to Dexie on create', async () => {
    const task = await taskService.createTask(TEST_PROJECT_ID, 'Persisted');

    const fromDb = await taskRepository.findById(task.id);
    expect(fromDb).toBeDefined();
    expect(fromDb!.title).toBe('Persisted');
  });

  it('should rename a task in store and Dexie', async () => {
    const task = await taskService.createTask(TEST_PROJECT_ID, 'Original');

    await taskService.updateTaskTitle(task.id, 'Renamed');

    // Verify store
    const { tasks } = useTaskStore.getState();
    expect(tasks[0].title).toBe('Renamed');

    // Verify Dexie
    const fromDb = await taskRepository.findById(task.id);
    expect(fromDb!.title).toBe('Renamed');
  });

  it('should no-op rename if title unchanged', async () => {
    const task = await taskService.createTask(TEST_PROJECT_ID, 'Same');
    const originalUpdatedAt = task.updatedAt;

    await taskService.updateTaskTitle(task.id, 'Same');

    const fromDb = await taskRepository.findById(task.id);
    expect(fromDb!.updatedAt).toBe(originalUpdatedAt);
  });

  it('should update description in store and Dexie', async () => {
    const task = await taskService.createTask(TEST_PROJECT_ID, 'Desc Test');

    await taskService.updateTaskDescription(task.id, 'Updated description');

    // Verify store
    const storeTask = useTaskStore.getState().tasks.find((t) => t.id === task.id);
    expect(storeTask!.description).toBe('Updated description');

    // Verify Dexie
    const fromDb = await taskRepository.findById(task.id);
    expect(fromDb!.description).toBe('Updated description');
  });

  it('should soft-delete task (isDeleted = true, still in DB)', async () => {
    const task = await taskService.createTask(TEST_PROJECT_ID, 'To Delete');

    await taskService.deleteTask(task.id);

    // Gone from store
    expect(useTaskStore.getState().tasks).toHaveLength(0);

    // Still in Dexie but marked as deleted
    const fromDb = await taskRepository.findById(task.id);
    expect(fromDb).toBeDefined();
    expect(fromDb!.isDeleted).toBe(true);
  });
});

// ─── Service — Active Task Tests ─────────────────────────────────────

describe('Task Service — Active Task', () => {
  it('should set new task as active', async () => {
    const task = await taskService.createTask(TEST_PROJECT_ID, 'Active Task');
    expect(useTaskStore.getState().activeTaskId).toBe(task.id);
  });

  it('should clear activeTaskId when deleting the active task', async () => {
    const task = await taskService.createTask(TEST_PROJECT_ID, 'Active to Delete');
    expect(useTaskStore.getState().activeTaskId).toBe(task.id);

    await taskService.deleteTask(task.id);

    expect(useTaskStore.getState().activeTaskId).toBeNull();
  });

  it('should return active task via getActiveTask', async () => {
    const task = await taskService.createTask(TEST_PROJECT_ID, 'Get Active');

    const active = taskService.getActiveTask();
    expect(active).not.toBeNull();
    expect(active!.id).toBe(task.id);
    expect(active!.title).toBe('Get Active');
  });
});

// ─── Service — Load / Project Switching Tests ────────────────────────

describe('Task Service — Load / Project Switching', () => {
  it('should hydrate store from Dexie', async () => {
    await taskService.createTask(TEST_PROJECT_ID, 'Task A');
    await taskService.createTask(TEST_PROJECT_ID, 'Task B');

    // Reset store (simulate app restart)
    _resetTaskStoreForTests();
    expect(useTaskStore.getState().tasks).toHaveLength(0);

    // Reload from Dexie
    await taskService.loadTasks(TEST_PROJECT_ID);

    expect(useTaskStore.getState().tasks).toHaveLength(2);
  });

  it('should only load tasks for the specified project', async () => {
    await taskService.createTask(TEST_PROJECT_ID, 'Project 1 Task');
    await taskService.createTask(TEST_PROJECT_ID_2, 'Project 2 Task');

    await taskService.loadTasks(TEST_PROJECT_ID);

    const { tasks } = useTaskStore.getState();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].projectId).toBe(TEST_PROJECT_ID);
  });

  it('should clear activeTaskId on load', async () => {
    const task = await taskService.createTask(TEST_PROJECT_ID, 'Task');
    expect(useTaskStore.getState().activeTaskId).toBe(task.id);

    await taskService.loadTasks(TEST_PROJECT_ID);

    expect(useTaskStore.getState().activeTaskId).toBeNull();
  });

  it('should load correct tasks when switching projects', async () => {
    await taskService.createTask(TEST_PROJECT_ID, 'Project 1 Task');
    await taskService.createTask(TEST_PROJECT_ID_2, 'Project 2 Task A');
    await taskService.createTask(TEST_PROJECT_ID_2, 'Project 2 Task B');

    // Switch to project 2
    await taskService.loadTasks(TEST_PROJECT_ID_2);

    const { tasks } = useTaskStore.getState();
    expect(tasks).toHaveLength(2);
    expect(tasks.every((t) => t.projectId === TEST_PROJECT_ID_2)).toBe(true);

    // Switch back to project 1
    await taskService.loadTasks(TEST_PROJECT_ID);

    const { tasks: tasks1 } = useTaskStore.getState();
    expect(tasks1).toHaveLength(1);
    expect(tasks1[0].projectId).toBe(TEST_PROJECT_ID);
  });
});

// ─── Service — Edge Cases ────────────────────────────────────────────

describe('Task Service — Edge Cases', () => {
  it('should empty the store when clearTasks is called', async () => {
    await taskService.createTask(TEST_PROJECT_ID, 'Will Clear');

    taskService.clearTasks();

    const { tasks, activeTaskId } = useTaskStore.getState();
    expect(tasks).toHaveLength(0);
    expect(activeTaskId).toBeNull();
  });

  it('should no-op when deleting nonexistent task', async () => {
    // Should not throw
    await taskService.deleteTask('nonexistent-id');
    expect(useTaskStore.getState().tasks).toHaveLength(0);
  });
});

// ─── Store Tests ─────────────────────────────────────────────────────

describe('Task Store', () => {
  it('should add a task to the front of the list', () => {
    const store = useTaskStore.getState();
    const task = { id: 'store-1', projectId: 'p', title: 'First', description: '', status: 'todo' as const, isDeleted: false, createdAt: '', updatedAt: '' };

    store.addTask(task);

    expect(useTaskStore.getState().tasks).toHaveLength(1);
    expect(useTaskStore.getState().tasks[0].id).toBe('store-1');
  });

  it('should update a task by id', () => {
    const store = useTaskStore.getState();
    store.addTask({ id: 'upd-1', projectId: 'p', title: 'Before', description: '', status: 'todo', isDeleted: false, createdAt: '', updatedAt: '' });

    store.updateTask('upd-1', { title: 'After' });

    expect(useTaskStore.getState().tasks[0].title).toBe('After');
  });

  it('should remove a task and clear active if it was active', () => {
    const store = useTaskStore.getState();
    store.addTask({ id: 'rem-1', projectId: 'p', title: 'Remove', description: '', status: 'todo', isDeleted: false, createdAt: '', updatedAt: '' });
    store.setActiveTask('rem-1');

    expect(useTaskStore.getState().activeTaskId).toBe('rem-1');

    store.removeTask('rem-1');

    expect(useTaskStore.getState().tasks).toHaveLength(0);
    expect(useTaskStore.getState().activeTaskId).toBeNull();
  });

  it('should set active task', () => {
    const store = useTaskStore.getState();
    store.addTask({ id: 'active-1', projectId: 'p', title: 'Active', description: '', status: 'todo', isDeleted: false, createdAt: '', updatedAt: '' });

    store.setActiveTask('active-1');

    expect(useTaskStore.getState().activeTaskId).toBe('active-1');
  });
});
