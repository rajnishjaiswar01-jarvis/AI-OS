/**
 * AI OS — Note List
 *
 * Sidebar component that renders the list of notes.
 * Each item shows title + relative timestamp.
 * Right-click context menu for rename / delete.
 *
 * @see Sprint 2 — Notes Workspace
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Note } from '@core/db/types';

// ─── Props ───────────────────────────────────────────────────────────

interface NoteListProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

// ─── Context Menu State ──────────────────────────────────────────────

interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  noteId: string | null;
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

// ─── Component ───────────────────────────────────────────────────────

export default function NoteList({ notes, activeNoteId, onSelect, onRename, onDelete }: NoteListProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    noteId: null,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // ─── Context Menu ────────────────────────────────────────────────

  const handleContextMenu = useCallback((e: React.MouseEvent, noteId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, noteId });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false, noteId: null }));
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu.visible) return;
    const handler = () => hideContextMenu();
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu.visible, hideContextMenu]);

  // ─── Rename ──────────────────────────────────────────────────────

  const startRename = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      setEditTitle(note.title);
      setEditingId(noteId);
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

  const startDelete = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) setDeleteTarget(note);
    hideContextMenu();
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────

  if (notes.length === 0) {
    return (
      <div className="notes-list-empty">
        <span className="text-[var(--color-text-muted)] text-xs">No notes yet</span>
      </div>
    );
  }

  return (
    <>
      <div className="notes-list">
        {notes.map((note) => {
          const isActive = note.id === activeNoteId;
          const isEditing = note.id === editingId;

          return (
            <div
              key={note.id}
              className={`notes-list-item ${isActive ? 'notes-list-item-active' : ''}`}
              onClick={() => onSelect(note.id)}
              onDoubleClick={() => startRename(note.id)}
              onContextMenu={(e) => handleContextMenu(e, note.id)}
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
                  className="notes-list-edit-input"
                />
              ) : (
                <>
                  <span className="notes-list-item-title">{note.title}</span>
                  <span className="notes-list-item-time">
                    {formatRelativeTime(note.updatedAt)}
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
            onClick={() => contextMenu.noteId && startRename(contextMenu.noteId)}
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
            onClick={() => contextMenu.noteId && startDelete(contextMenu.noteId)}
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
            <h3 className="text-sm font-semibold mb-2">Delete Note</h3>
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
