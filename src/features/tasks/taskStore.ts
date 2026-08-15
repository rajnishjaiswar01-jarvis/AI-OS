/**
 * AI OS — Task Store
 *
 * Pure Zustand state container for task data.
 * NO side effects. NO Dexie access. NO API calls.
 * All mutations are called by taskService after successful persistence.
 *
 * Unlike noteStore, there is no isDirty/isSaving state —
 * tasks don't have autosave debounce (no rich text editing).
 *
 * @see noteStore.ts — same pattern
 */

import { create } from 'zustand';
import type { Task } from '@core/db/types';

// ─── Store Interface ─────────────────────────────────────────────────

interface TaskState {
  /** All tasks for the active project (non-deleted) */
  tasks: Task[];
  /** Currently selected task ID (null = no task selected) */
  activeTaskId: string | null;

  // Pure mutations (called by taskService, NEVER directly by components)
  setTasks: (tasks: Task[]) => void;
  setActiveTask: (id: string | null) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
}

// ─── Store ───────────────────────────────────────────────────────────

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  activeTaskId: null,

  setTasks: (tasks: Task[]) => set({ tasks }),

  setActiveTask: (id: string | null) => set({ activeTaskId: id }),

  addTask: (task: Task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
    })),

  updateTask: (id: string, updates: Partial<Task>) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  removeTask: (id: string) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      // If deleted task was active, clear active
      activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
    })),
}));

/**
 * Reset the task store to its initial state. Primarily for testing.
 * @internal
 */
export function _resetTaskStoreForTests(): void {
  useTaskStore.setState({
    tasks: [],
    activeTaskId: null,
  });
}
