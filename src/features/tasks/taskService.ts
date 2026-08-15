/**
 * AI OS — Task Service
 *
 * Business logic, validation, and orchestration for tasks.
 * This is the "brain" of the tasks feature.
 *
 * Flow: Component → taskService → taskRepository → Dexie
 *                                → taskStore (on success)
 *
 * Rule: Persist first, then update store.
 *       If persistence fails, store state is unchanged.
 *
 * Sprint 3 Constraints:
 *   1. Soft-deleted tasks cannot be modified (DELETED_ENTITY error)
 *   2. No transition graph — any valid TaskStatus is allowed
 *   3. createTask(projectId, title) — title is required, no defaults
 *   4. No repository-level status filtering (in-memory only)
 *
 * @see noteService.ts — same architectural pattern
 */

import { taskRepository } from './taskRepository';
import { projectRepository } from '@features/projects/projectRepository';
import { useTaskStore } from './taskStore';
import { DomainError } from '@core/errors/DomainError';
import { TaskStatus } from '@core/db/types';
import type { Task } from '@core/db/types';

// ─── Helpers ─────────────────────────────────────────────────────────

/** All valid TaskStatus values for validation. */
const VALID_STATUSES: ReadonlySet<string> = new Set(Object.values(TaskStatus));

/**
 * Guard: reject operations on deleted tasks.
 * Used by all mutation methods (Constraint #1).
 */
function assertNotDeleted(task: Task): void {
  if (task.isDeleted) {
    throw new DomainError('DELETED_ENTITY', 'Cannot modify a deleted task.');
  }
}

/**
 * Validate task title.
 * Empty, whitespace-only, or >200 chars are rejected.
 * No default title (Constraint #3).
 */
function validateTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new DomainError('VALIDATION_ERROR', 'Task title cannot be empty.');
  }
  if (trimmed.length > 200) {
    throw new DomainError('VALIDATION_ERROR', 'Task title must be 200 characters or less.');
  }
  return trimmed;
}

// ─── Task Service ────────────────────────────────────────────────────

export const taskService = {
  /**
   * Load all tasks for a project into the store.
   * Called when a project becomes active or Tasks window opens.
   */
  async loadTasks(projectId: string): Promise<void> {
    const tasks = await taskRepository.findByProject(projectId);
    const store = useTaskStore.getState();
    store.setTasks(tasks);
    store.setActiveTask(null);
  },

  /**
   * Clear the task store. Called when no project is active.
   */
  clearTasks(): void {
    const store = useTaskStore.getState();
    store.setTasks([]);
    store.setActiveTask(null);
  },

  /**
   * Create a new task in a project.
   *
   * Title is REQUIRED (no default, Constraint #3).
   * Default status = TODO, default description = ''.
   */
  async createTask(projectId: string, title: string): Promise<Task> {
    // Validate project exists
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new DomainError('NOT_FOUND', 'Project not found.');
    }

    const trimmedTitle = validateTitle(title);

    const now = new Date().toISOString();
    const task: Task = {
      id: crypto.randomUUID(),
      projectId,
      title: trimmedTitle,
      description: '',
      status: TaskStatus.Todo,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    // Persist first
    await taskRepository.upsert(task);

    // Then update store
    const store = useTaskStore.getState();
    store.addTask(task);
    store.setActiveTask(task.id);

    return task;
  },

  /**
   * Update task title.
   * Rejects deleted tasks (Constraint #1).
   */
  async updateTaskTitle(id: string, title: string): Promise<void> {
    const trimmedTitle = validateTitle(title);

    const existing = await taskRepository.findById(id);
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Task not found.');
    }
    assertNotDeleted(existing);

    if (existing.title === trimmedTitle) return;

    const updatedAt = new Date().toISOString();
    const updated: Task = { ...existing, title: trimmedTitle, updatedAt };

    await taskRepository.upsert(updated);
    useTaskStore.getState().updateTask(id, { title: trimmedTitle, updatedAt });
  },

  /**
   * Update task description.
   * Rejects deleted tasks (Constraint #1).
   */
  async updateTaskDescription(id: string, description: string): Promise<void> {
    const existing = await taskRepository.findById(id);
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Task not found.');
    }
    assertNotDeleted(existing);

    const updatedAt = new Date().toISOString();
    const updated: Task = { ...existing, description, updatedAt };

    await taskRepository.upsert(updated);
    useTaskStore.getState().updateTask(id, { description, updatedAt });
  },

  /**
   * Set task status.
   * Any valid TaskStatus value is allowed (Constraint #2 — no transition graph).
   * Rejects deleted tasks (Constraint #1).
   */
  async setTaskStatus(id: string, status: string): Promise<void> {
    if (!VALID_STATUSES.has(status)) {
      throw new DomainError('VALIDATION_ERROR', `Invalid task status: "${status}".`);
    }

    const existing = await taskRepository.findById(id);
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Task not found.');
    }
    assertNotDeleted(existing);

    if (existing.status === status) return;

    const updatedAt = new Date().toISOString();
    const updated: Task = { ...existing, status: status as TaskStatus, updatedAt };

    await taskRepository.upsert(updated);
    useTaskStore.getState().updateTask(id, { status: status as TaskStatus, updatedAt });
  },

  /**
   * Soft-delete a task.
   * Sets isDeleted = true rather than removing from the database.
   */
  async deleteTask(id: string): Promise<void> {
    const existing = await taskRepository.findById(id);
    if (!existing) return;

    const updated: Task = {
      ...existing,
      isDeleted: true,
      updatedAt: new Date().toISOString(),
    };

    await taskRepository.upsert(updated);
    useTaskStore.getState().removeTask(id);
  },

  /**
   * Get the currently active task.
   */
  getActiveTask(): Task | null {
    const { tasks, activeTaskId } = useTaskStore.getState();
    if (!activeTaskId) return null;
    return tasks.find((t) => t.id === activeTaskId) ?? null;
  },
};
