/**
 * AI OS — Task Detail
 *
 * Right pane for viewing and editing the selected task.
 * Shows editable title, status selector, and description textarea.
 *
 * This component is PRESENTATIONAL — it does not call taskService directly.
 * All mutations are delegated to TasksPanel via callback props.
 *
 * Save behavior (per Sprint 3 tightening):
 *   - Title: saves on blur/Enter (NOT every keystroke)
 *   - Description: saves on blur (NOT every keystroke)
 *   - Status: saves immediately on click (discrete action)
 *
 * @see NoteEditor — same architectural pattern (but simpler, no autosave debounce)
 * @see Sprint 3 — Tasks Workspace
 */

import { useState, useEffect, useRef } from 'react';
import type { Task } from '@core/db/types';
import { TaskStatus } from '@core/db/types';

// ─── Props ───────────────────────────────────────────────────────────

interface TaskDetailProps {
  task: Task;
  onRename: (id: string, title: string) => void;
  onUpdateDescription: (id: string, description: string) => void;
  onSetStatus: (id: string, status: string) => void;
}

// ─── Status Config ───────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: TaskStatus.Todo, label: 'Todo', icon: '○' },
  { value: TaskStatus.InProgress, label: 'In Progress', icon: '◐' },
  { value: TaskStatus.Done, label: 'Done', icon: '✓' },
] as const;

// ─── Component ───────────────────────────────────────────────────────

export default function TaskDetail({ task, onRename, onUpdateDescription, onSetStatus }: TaskDetailProps) {
  // Local state — controlled by this component, synced on task switch
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const prevTaskIdRef = useRef(task.id);

  // ─── Sync when task changes ────────────────────────────────────

  useEffect(() => {
    if (task.id !== prevTaskIdRef.current) {
      setTitle(task.title);
      setDescription(task.description);
      setIsEditingTitle(false);
      prevTaskIdRef.current = task.id;
    }
  }, [task.id, task.title, task.description]);

  // Sync title if it changes externally (e.g., from context menu rename)
  useEffect(() => {
    if (!isEditingTitle) {
      setTitle(task.title);
    }
  }, [task.title, isEditingTitle]);

  // Sync description if it changes externally
  useEffect(() => {
    // Only sync if not focused (user isn't actively editing)
    if (descriptionRef.current !== document.activeElement) {
      setDescription(task.description);
    }
  }, [task.description]);

  // ─── Title Editing (blur/Enter save) ───────────────────────────

  const startTitleEdit = () => {
    setIsEditingTitle(true);
    setTitle(task.title);
  };

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const finishTitleEdit = () => {
    setIsEditingTitle(false);
    if (title.trim() && title.trim() !== task.title) {
      onRename(task.id, title);
    } else {
      setTitle(task.title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishTitleEdit();
      descriptionRef.current?.focus();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTitle(task.title);
    }
  };

  // ─── Description (blur save) ───────────────────────────────────

  const handleDescriptionBlur = () => {
    if (description !== task.description) {
      onUpdateDescription(task.id, description);
    }
  };

  // ─── Status (immediate save) ───────────────────────────────────

  const handleStatusChange = (status: string) => {
    if (status !== task.status) {
      onSetStatus(task.id, status);
    }
  };

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="tasks-detail">
      {/* Title */}
      <div className="tasks-detail-title-row">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={finishTitleEdit}
            onKeyDown={handleTitleKeyDown}
            maxLength={200}
            className="tasks-detail-title-input"
          />
        ) : (
          <h2
            className="tasks-detail-title"
            onClick={startTitleEdit}
            title="Click to rename"
          >
            {task.title}
          </h2>
        )}
      </div>

      {/* Status Selector */}
      <div className="tasks-detail-status-row">
        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">
          Status
        </span>
        <div className="tasks-status-group">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              className={`tasks-status-btn ${task.status === opt.value ? 'tasks-status-btn-active' : ''}`}
              title={opt.label}
            >
              <span className="tasks-status-btn-icon">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="tasks-detail-desc-section">
        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium px-4 pt-3 block">
          Description
        </span>
        <textarea
          ref={descriptionRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          className="tasks-detail-textarea"
          placeholder="Add a description…"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
