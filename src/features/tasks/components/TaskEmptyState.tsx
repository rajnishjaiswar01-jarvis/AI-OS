/**
 * AI OS — Tasks Empty State
 *
 * Two variants:
 *   1. "no-project" — No project selected. No create button. No task loading.
 *   2. "no-task"    — Project active but no task selected (or no tasks exist).
 *
 * "No project = no tasks" is explicitly enforced here:
 * the UI does not render a create button when no project is active.
 *
 * @see EmptyState (Notes) — same pattern
 * @see Sprint 3 — Tasks Workspace
 */

// ─── Props ───────────────────────────────────────────────────────────

interface TaskEmptyStateProps {
  type: 'no-project' | 'no-task';
  taskCount?: number;
  onCreateTask?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────

export default function TaskEmptyState({ type, taskCount = 0, onCreateTask }: TaskEmptyStateProps) {
  if (type === 'no-project') {
    return (
      <div className="tasks-empty-state">
        <div className="tasks-empty-icon">📁</div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
          No project selected
        </p>
        <p className="text-xs text-[var(--color-text-muted)] max-w-[240px] leading-relaxed">
          Select a project from the sidebar to view and create tasks.
        </p>
      </div>
    );
  }

  // no-task variant
  if (taskCount === 0) {
    return (
      <div className="tasks-empty-state">
        <div className="tasks-empty-icon">✅</div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
          No tasks yet
        </p>
        <p className="text-xs text-[var(--color-text-muted)] max-w-[240px] leading-relaxed mb-4">
          Create your first task to get started.
        </p>
        {onCreateTask && (
          <button
            onClick={onCreateTask}
            className="
              px-4 py-2 rounded-lg text-xs font-medium
              bg-primary/20 border border-primary/30
              hover:bg-primary/30 cursor-pointer
              transition-all duration-200
            "
          >
            + New Task
          </button>
        )}
      </div>
    );
  }

  // Tasks exist but none selected
  return (
    <div className="tasks-empty-state">
      <div className="tasks-empty-icon" style={{ opacity: 0.5 }}>📋</div>
      <p className="text-sm text-[var(--color-text-muted)]">
        Select a task to view details
      </p>
    </div>
  );
}
