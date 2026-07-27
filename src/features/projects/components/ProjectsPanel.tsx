/**
 * AI OS — Projects Panel
 *
 * Full CRUD UI for managing projects.
 * Reads from projectStore, writes through projectService.
 * Never imports Dexie or projectRepository directly.
 *
 * Features:
 * - Project list sorted by updatedAt desc
 * - Create project (inline form)
 * - Rename project (double-click OR context menu)
 * - Delete project (context menu with confirmation)
 * - Select project to set as active
 *
 * @see SYSTEM_ARCHITECTURE.md §2.1 — Component Layer
 * @see Recommendation 3 — context menu for rename/delete
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useProjectStore } from '../projectStore';
import { projectService } from '../projectService';
import type { Project } from '@core/db/types';

// ─── Context Menu ────────────────────────────────────────────────────

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  projectId: string | null;
}

function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    projectId: null,
  });

  const show = useCallback((e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ visible: true, x: e.clientX, y: e.clientY, projectId });
  }, []);

  const hide = useCallback(() => {
    setMenu((prev) => ({ ...prev, visible: false, projectId: null }));
  }, []);

  // Close on any outside click
  useEffect(() => {
    if (!menu.visible) return;
    const handler = () => hide();
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [menu.visible, hide]);

  return { menu, show, hide };
}

// ─── Project List Item ───────────────────────────────────────────────

interface ProjectItemProps {
  project: Project;
  isActive: boolean;
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onFinishEdit: (id: string, name: string) => void;
  onCancelEdit: () => void;
}

function ProjectItem({
  project,
  isActive,
  onSelect,
  onContextMenu,
  editingId,
  onStartEdit,
  onFinishEdit,
  onCancelEdit,
}: ProjectItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = editingId === project.id;
  const [editName, setEditName] = useState(project.name);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setEditName(project.name);
    onStartEdit(project.id);
  };

  const handleEditSubmit = () => {
    onFinishEdit(project.id, editName);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`
        group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
        transition-all duration-200
        ${isActive
          ? 'glass glass-glow border-primary/30'
          : 'hover:bg-[var(--color-surface-hover)]'
        }
      `}
      onClick={() => onSelect(project.id)}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => onContextMenu(e, project.id)}
    >
      {/* Project icon */}
      <span className="text-lg flex-shrink-0">
        {isActive ? '📂' : '📁'}
      </span>

      {/* Name / Edit input */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={handleEditKeyDown}
            className="
              w-full px-2 py-0.5 rounded-md text-sm
              bg-[var(--color-surface-active)] border border-[var(--color-border-hover)]
              text-[var(--color-text)] outline-none
              focus:border-primary/50
            "
            maxLength={100}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <p className="text-sm font-medium truncate text-[var(--color-text)]">
              {project.name}
            </p>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              {formatDate(project.updatedAt)}
            </p>
          </>
        )}
      </div>

      {/* Active indicator */}
      {isActive && (
        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      )}
    </div>
  );
}

// ─── Delete Confirmation ─────────────────────────────────────────────

interface DeleteConfirmProps {
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirm({ projectName, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[450]">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative glass glass-glow rounded-xl p-5 max-w-sm w-full mx-4 animate-slide-up">
        <h3 className="text-sm font-semibold mb-2">Delete Project</h3>
        <p className="text-xs text-[var(--color-text-secondary)] mb-4 leading-relaxed">
          Are you sure you want to delete <strong>"{projectName}"</strong>?
          This action cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs glass glass-hover cursor-pointer transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-lg text-xs bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 cursor-pointer transition-all duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Projects Panel ──────────────────────────────────────────────────

export default function ProjectsPanel() {
  const { projects, activeProjectId } = useProjectStore();
  const { menu, show: showContextMenu, hide: hideContextMenu } = useContextMenu();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  // Focus create input when form opens
  useEffect(() => {
    if (creating && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [creating]);

  // Auto-clear errors
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(timer);
  }, [error]);

  // ─── Handlers ────────────────────────────────────────────────────

  const handleCreate = async () => {
    try {
      await projectService.createProject(newName);
      setNewName('');
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project.');
    }
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      setCreating(false);
      setNewName('');
    }
  };

  const handleSelect = (id: string) => {
    projectService.setActiveProject(id);
  };

  const handleStartEdit = (id: string) => {
    setEditingId(id);
  };

  const handleFinishEdit = async (id: string, name: string) => {
    setEditingId(null);
    try {
      await projectService.renameProject(id, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename project.');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await projectService.deleteProject(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project.');
      setDeleteTarget(null);
    }
  };

  // Context menu actions
  const handleContextRename = () => {
    if (menu.projectId) {
      setEditingId(menu.projectId);
    }
    hideContextMenu();
  };

  const handleContextDelete = () => {
    if (menu.projectId) {
      const project = projects.find((p) => p.id === menu.projectId);
      if (project) setDeleteTarget(project);
    }
    hideContextMenu();
  };

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <span className="text-xs text-[var(--color-text-muted)]">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </span>
        <button
          onClick={() => setCreating(true)}
          className="
            text-[11px] px-2.5 py-1 rounded-lg
            glass glass-hover cursor-pointer
            text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]
            transition-all duration-200
          "
        >
          + New
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 border-b border-red-500/20 bg-red-500/5 flex items-center justify-between">
          <span className="text-xs text-red-400">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400/60 hover:text-red-400 cursor-pointer text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Create Form */}
      {creating && (
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <input
              ref={createInputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              placeholder="Project name..."
              maxLength={100}
              className="
                flex-1 px-3 py-1.5 rounded-lg text-sm
                glass text-[var(--color-text)]
                placeholder:text-[var(--color-text-muted)]
                outline-none border-none
                focus:shadow-[0_0_10px_rgba(79,140,255,0.1)]
                transition-all duration-200
              "
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="
                px-3 py-1.5 rounded-lg text-xs
                bg-primary/20 border border-primary/30
                hover:bg-primary/30 cursor-pointer
                transition-all duration-200
                disabled:opacity-30 disabled:cursor-not-allowed
              "
            >
              Create
            </button>
            <button
              onClick={() => { setCreating(false); setNewName(''); }}
              className="
                px-2 py-1.5 rounded-lg text-xs
                glass glass-hover cursor-pointer
                text-[var(--color-text-muted)]
                transition-all duration-200
              "
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Project List */}
      <div className="flex-1 overflow-y-auto p-2">
        {projects.length === 0 && !creating ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <span className="text-3xl mb-3">📁</span>
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              No projects yet
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              Create your first project to get started.
            </p>
            <button
              onClick={() => setCreating(true)}
              className="
                px-4 py-2 rounded-lg text-xs font-medium
                bg-primary/20 border border-primary/30
                hover:bg-primary/30 cursor-pointer
                transition-all duration-200
              "
            >
              + Create Project
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {projects.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                isActive={activeProjectId === project.id}
                onSelect={handleSelect}
                onContextMenu={showContextMenu}
                editingId={editingId}
                onStartEdit={handleStartEdit}
                onFinishEdit={handleFinishEdit}
                onCancelEdit={handleCancelEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {menu.visible && (
        <div
          className="fixed z-[300] glass glass-glow rounded-lg py-1 min-w-[140px] animate-fade-in"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleContextRename}
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
            onClick={handleContextDelete}
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirm
          projectName={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
