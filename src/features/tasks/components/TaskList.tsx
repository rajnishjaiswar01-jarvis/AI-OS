/**
 * AI OS — Task List
 *
 * Sidebar component that renders the list of tasks.
 * Each item shows title + status indicator + relative timestamp.
 * Right-click context menu for rename / delete.
 *
 * This component is PRESENTATIONAL — it does not call taskService directly.
 * All mutations are delegated to TasksPanel via callback props.
 *
 * Status indicators:
 *   ○  Todo       — muted circle
 *   ◐  In Progress — blue half-circle
 *   ✓  Done       — green check
 *
 * @see NoteList — same architectural pattern
 * @see Sprint 3 — Tasks Workspace
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Task } from '@core/db/types';
import { TaskStatus } from '@core/db/types';

// ─── Props ───────────────────────────────────────────────────────────

interface TaskListProps {
  tasks: Task[];
  activeTaskId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

// ─── Context Menu State ──────────────────────────────────────────────

interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  taskId: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;

  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/** Status indicator config. */
function getStatusIndicator(status: string): { symbol: string; className: string; label: string } {
  switch (status) {
    case TaskStatus.InProgress:
      return { symbol: '◐', className: 'tasks-status-dot-progress', label: 'In Progress' };
    case TaskStatus.Done:
      return { symbol: '✓', className: 'tasks-status-dot-done', label: 'Done' };
    case TaskStatus.Todo:
    default:
      return { symbol: '○', className: 'tasks-status-dot-todo', label: 'Todo' };
  }
}

// ─── Component ───────────────────────────────────────────────────────

export default function TaskList({
  tasks,
  activeTaskId,
  onSelect,
  onRename,
  onDelete,
  onToggleStatus,
}: TaskListProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    taskId: null,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // ─── Context Menu ────────────────────────────────────────────────

  const handleContextMenu = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, taskId });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false, taskId: null }));
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu.visible) return;
    const handler = () => hideContextMenu();
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu.visible, hideContextMenu]);

  // ─── Rename ──────────────────────────────────────────────────────

  const startRename = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setEditTitle(task.title);
      setEditingId(taskId);
    }
    hideContextMenu();
  };

  const finishRename = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle);
    }
    setEditingId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // ─── Delete ──────────────────────────────────────────────────────

  const startDelete = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) setDeleteTarget(task);
    hideContextMenu();
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // ─── Status Toggle (click the dot) ──────────────────────────────

  const handleStatusClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    onToggleStatus(taskId);
  };

  // ─── Render ──────────────────────────────────────────────────────

  if (tasks.length === 0) {
    return (
      <div className="tasks-list-empty">
        <span className="text-[var(--color-text-muted)] text-xs">No tasks yet</span>
      </div>
    );
  }

  return (
    <>
      <div className="tasks-list">
        {tasks.map((task) => {
          const isActive = task.id === activeTaskId;
          const isEditing = task.id === editingId;
          const status = getStatusIndicator(task.status);

          return (
            <div
              key={task.id}
              className={`tasks-list-item ${isActive ? 'tasks-list-item-active' : ''} ${task.status === TaskStatus.Done ? 'tasks-list-item-done' : ''}`}
              onClick={() => onSelect(task.id)}
              onDoubleClick={() => startRename(task.id)}
              onContextMenu={(e) => handleContextMenu(e, task.id)}
            >
              {isEditing ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={finishRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishRename();
                    if (e.key === 'Escape') cancelRename();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  maxLength={200}
                  className="tasks-list-edit-input"
                />
              ) : (
                <>
                  <div className="tasks-list-item-row">
                    <button
                      className={`tasks-status-dot ${status.className}`}
                      onClick={(e) => handleStatusClick(e, task.id)}
                      title={status.label}
                    >
                      {status.symbol}
                    </button>
                    <span className="tasks-list-item-title">{task.title}</span>
                  </div>
                  <span className="tasks-list-item-time">
                    {formatRelativeTime(task.updatedAt)}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-[300] glass glass-glow rounded-lg py-1 min-w-[130px] animate-fade-in"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => contextMenu.taskId && startRename(contextMenu.taskId)}
            className="
              w-full px-3 py-2 text-left text-xs
              hover:bg-[var(--color-surface-hover)] cursor-pointer
              text-[var(--color-text)] transition-colors duration-150
              flex items-center gap-2
            "
          >
            <span>✏️</span> Rename
          </button>
          <div className="border-t border-[var(--color-border)] my-0.5" />
          <button
            onClick={() => contextMenu.taskId && startDelete(contextMenu.taskId)}
            className="
              w-full px-3 py-2 text-left text-xs
              hover:bg-red-500/10 cursor-pointer
              text-red-400 transition-colors duration-150
              flex items-center gap-2
            "
          >
            <span>🗑️</span> Delete
          </button>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center z-[450]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative glass glass-glow rounded-xl p-5 max-w-sm w-full mx-4 animate-slide-up">
            <h3 className="text-sm font-semibold mb-2">Delete Task</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4 leading-relaxed">
              Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded-lg text-xs glass glass-hover cursor-pointer transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 rounded-lg text-xs bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 cursor-pointer transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
