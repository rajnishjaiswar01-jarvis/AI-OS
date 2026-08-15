/**
 * AI OS — Tasks Panel
 *
 * Main container for the Tasks workspace module.
 * Split layout: sidebar (task list) + detail pane.
 *
 * Responsibilities:
 *   - Subscribe to projectStore for active project
 *   - Load/clear tasks when project changes
 *   - OWN all service mutations (TaskList and TaskDetail are presentational)
 *   - Handle create, select, rename, delete, status change, description update
 *   - Enforce "no project = no tasks" behavior
 *
 * Architecture (per Sprint 3 tightening):
 *   TaskList → onDelete(id) → TasksPanel → taskService.deleteTask(id)
 *   TaskDetail → onSetStatus(id, s) → TasksPanel → taskService.setTaskStatus(id, s)
 *
 * Unlike NotesPanel, there is NO autosave debounce.
 * Each mutation saves immediately via taskService.
 *
 * @see NotesPanel — same architectural pattern (but simpler)
 * @see Sprint 3 — Tasks Workspace
 */

import { useState, useEffect } from 'react';
import { useProjectStore } from '@features/projects/projectStore';
import { useTaskStore } from '../taskStore';
import { taskService } from '../taskService';
import { TaskStatus } from '@core/db/types';
import TaskList from './TaskList';
import TaskDetail from './TaskDetail';
import TaskEmptyState from './TaskEmptyState';

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Cycle status: todo → in_progress → done → todo.
 * Used by the status dot toggle in the sidebar.
 */
function cycleStatus(current: string): string {
  switch (current) {
    case TaskStatus.Todo:
      return TaskStatus.InProgress;
    case TaskStatus.InProgress:
      return TaskStatus.Done;
    case TaskStatus.Done:
      return TaskStatus.Todo;
    default:
      return TaskStatus.Todo;
  }
}

// ─── Component ───────────────────────────────────────────────────────

export default function TasksPanel() {
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const { tasks, activeTaskId } = useTaskStore();
  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;

  const [error, setError] = useState<string | null>(null);

  // ─── Project Switch: Load/Clear Tasks ──────────────────────────

  useEffect(() => {
    if (activeProjectId) {
      taskService.loadTasks(activeProjectId);
    } else {
      taskService.clearTasks();
    }
  }, [activeProjectId]);

  // ─── Auto-clear errors ─────────────────────────────────────────

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(timer);
  }, [error]);

  // ─── Handlers (TasksPanel OWNS all service mutations) ──────────

  const handleCreateTask = async () => {
    if (!activeProjectId) return;
    try {
      await taskService.createTask(activeProjectId, 'Untitled Task');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task.');
    }
  };

  const handleSelectTask = (id: string) => {
    useTaskStore.getState().setActiveTask(id);
  };

  const handleRenameTask = async (id: string, title: string) => {
    try {
      await taskService.updateTaskTitle(id, title);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename task.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await taskService.deleteTask(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task.');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const nextStatus = cycleStatus(task.status);
      await taskService.setTaskStatus(id, nextStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  const handleSetStatus = async (id: string, status: string) => {
    try {
      await taskService.setTaskStatus(id, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  const handleUpdateDescription = async (id: string, description: string) => {
    try {
      await taskService.updateTaskDescription(id, description);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update description.');
    }
  };

  // ─── Render ────────────────────────────────────────────────────

  // No project selected → full empty state, no create button
  if (!activeProjectId) {
    return <TaskEmptyState type="no-project" />;
  }

  return (
    <div className="tasks-panel">
      {/* ─── Sidebar ──────────────────────────────────────────── */}
      <div className="tasks-sidebar">
        {/* Header */}
        <div className="tasks-sidebar-header">
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">
            Tasks
          </span>
          <button
            onClick={handleCreateTask}
            className="tasks-new-btn"
            title="New Task"
          >
            +
          </button>
        </div>

        {/* Task List */}
        <TaskList
          tasks={tasks}
          activeTaskId={activeTaskId}
          onSelect={handleSelectTask}
          onRename={handleRenameTask}
          onDelete={handleDeleteTask}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      {/* ─── Divider ──────────────────────────────────────────── */}
      <div className="tasks-divider" />

      {/* ─── Detail Pane ──────────────────────────────────────── */}
      <div className="tasks-detail-pane">
        {/* Error Banner */}
        {error && (
          <div className="tasks-error">
            <span className="text-xs text-red-400">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400/60 hover:text-red-400 cursor-pointer text-xs ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {activeTask ? (
          <TaskDetail
            task={activeTask}
            onRename={handleRenameTask}
            onUpdateDescription={handleUpdateDescription}
            onSetStatus={handleSetStatus}
          />
        ) : (
          <TaskEmptyState
            type="no-task"
            taskCount={tasks.length}
            onCreateTask={handleCreateTask}
          />
        )}
      </div>
    </div>
  );
}
