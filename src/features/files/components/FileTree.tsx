/**
 * AI OS — File Tree
 *
 * Left pane tree view of files and folders.
 * Renders a projection of store state — NOT a data-fetching component.
 *
 * Structure:
 *   Root entries (parentId === null)
 *   ├── Folders (expandable, show children when expanded)
 *   │   └── Files (inside folder)
 *   └── Files (at root)
 *
 * This component is PRESENTATIONAL — all mutations delegated to FilesPanel via props.
 *
 * Interactions:
 *   Click folder  → select as currentFolder + toggle expand
 *   Click file    → set as activeFile
 *   Double-click  → inline rename
 *   Right-click   → context menu (Rename / Delete)
 *
 * @see NoteList, TaskList — same architectural pattern
 * @see ADR-010 — Single-Level Folder Hierarchy
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { FileEntry } from '@core/db/types';
import { FileEntryType } from '@core/db/types';

// ─── Props ───────────────────────────────────────────────────────────

interface FileTreeProps {
  entries: FileEntry[];
  activeFileId: string | null;
  currentFolderId: string | null;
  expandedFolders: Set<string>;
  onSelectFile: (id: string) => void;
  onSelectFolder: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onToggleFolder: (id: string) => void;
}

// ─── Context Menu State ──────────────────────────────────────────────

interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  entryId: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Simple icon based on type and extension. */
function getFileIcon(entry: FileEntry, isExpanded?: boolean): string {
  if (entry.type === FileEntryType.Folder) {
    return isExpanded ? '📂' : '📁';
  }
  const ext = entry.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'md': return '📝';
    case 'ts': case 'tsx': case 'js': case 'jsx': return '📜';
    case 'json': return '📋';
    case 'css': return '🎨';
    case 'html': return '🌐';
    case 'txt': return '📄';
    default: return '📄';
  }
}

// ─── Component ───────────────────────────────────────────────────────

export default function FileTree({
  entries,
  activeFileId,
  currentFolderId,
  expandedFolders,
  onSelectFile,
  onSelectFolder,
  onRename,
  onDelete,
  onToggleFolder,
}: FileTreeProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    visible: false, x: 0, y: 0, entryId: null,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FileEntry | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // ─── Derived: split entries into root + grouped children ───────

  const rootEntries = entries.filter((e) => e.parentId === null);
  const childrenByParent = new Map<string, FileEntry[]>();
  for (const e of entries) {
    if (e.parentId !== null) {
      const arr = childrenByParent.get(e.parentId) ?? [];
      arr.push(e);
      childrenByParent.set(e.parentId, arr);
    }
  }

  // Sort: folders first, then alphabetical
  rootEntries.sort((a, b) => {
    if (a.type !== b.type) return a.type === FileEntryType.Folder ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  // ─── Context Menu ────────────────────────────────────────────────

  const handleContextMenu = useCallback((e: React.MouseEvent, entryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, entryId });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false, entryId: null }));
  }, []);

  useEffect(() => {
    if (!contextMenu.visible) return;
    const handler = () => hideContextMenu();
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu.visible, hideContextMenu]);

  // ─── Rename ──────────────────────────────────────────────────────

  const startRename = (entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (entry) {
      setEditName(entry.name);
      setEditingId(entryId);
    }
    hideContextMenu();
  };

  const finishRename = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
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

  const startDelete = (entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (entry) setDeleteTarget(entry);
    hideContextMenu();
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // ─── Click Handlers ──────────────────────────────────────────────

  const handleEntryClick = (entry: FileEntry) => {
    if (entry.type === FileEntryType.Folder) {
      onSelectFolder(entry.id);
      onToggleFolder(entry.id);
    } else {
      onSelectFile(entry.id);
    }
  };

  // ─── Render a single tree item ───────────────────────────────────

  const renderItem = (entry: FileEntry, depth: number) => {
    const isEditing = entry.id === editingId;
    const isFolder = entry.type === FileEntryType.Folder;
    const isExpanded = expandedFolders.has(entry.id);
    const isActive = entry.id === activeFileId;
    const isCurrent = entry.id === currentFolderId;

    return (
      <div key={entry.id}>
        <div
          className={`files-tree-item ${isActive ? 'files-tree-item-active' : ''} ${isCurrent && isFolder ? 'files-tree-item-current' : ''}`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => handleEntryClick(entry)}
          onDoubleClick={() => startRename(entry.id)}
          onContextMenu={(e) => handleContextMenu(e, entry.id)}
        >
          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={finishRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') finishRename();
                if (e.key === 'Escape') cancelRename();
              }}
              onClick={(e) => e.stopPropagation()}
              maxLength={200}
              className="files-tree-edit-input"
            />
          ) : (
            <>
              {isFolder && (
                <span className="files-tree-chevron">
                  {isExpanded ? '▾' : '▸'}
                </span>
              )}
              <span className="files-tree-icon">
                {getFileIcon(entry, isExpanded)}
              </span>
              <span className="files-tree-name">{entry.name}</span>
            </>
          )}
        </div>

        {/* Children (only for expanded folders) */}
        {isFolder && isExpanded && (
          <div className="files-tree-children">
            {(childrenByParent.get(entry.id) ?? [])
              .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
              .map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────

  if (entries.length === 0) {
    return (
      <div className="files-tree-empty">
        <span className="text-[var(--color-text-muted)] text-xs">No files yet</span>
      </div>
    );
  }

  return (
    <>
      <div className="files-tree">
        {rootEntries.map((entry) => renderItem(entry, 0))}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-[300] glass glass-glow rounded-lg py-1 min-w-[130px] animate-fade-in"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => contextMenu.entryId && startRename(contextMenu.entryId)}
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
            onClick={() => contextMenu.entryId && startDelete(contextMenu.entryId)}
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
            <h3 className="text-sm font-semibold mb-2">
              Delete {deleteTarget.type === FileEntryType.Folder ? 'Folder' : 'File'}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4 leading-relaxed">
              Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>?
              {deleteTarget.type === FileEntryType.Folder && (
                <span className="block mt-1 text-red-400/80">
                  All files inside this folder will also be deleted.
                </span>
              )}
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
