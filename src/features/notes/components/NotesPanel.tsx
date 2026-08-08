/**
 * AI OS — Notes Panel
 *
 * Main container for the Notes workspace module.
 * Split layout: sidebar (note list) + editor pane.
 *
 * Responsibilities:
 *   - Subscribe to projectStore for active project
 *   - Load/clear notes when project changes
 *   - Own the 500ms autosave debounce (NOT the service)
 *   - Flush pending saves on unmount / project switch
 *   - Register beforeunload + visibilitychange guards
 *   - Enforce "no project = no notes" behavior
 *
 * Architecture:
 *   User types → NoteEditor → NotesPanel (debounce) → noteService.updateNoteContent()
 *
 * @see FOUNDATION_FREEZE.md — Service Layer
 * @see Sprint 2 — Notes Workspace
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useProjectStore } from '@features/projects/projectStore';
import { useNoteStore } from '../noteStore';
import { noteService } from '../noteService';
import { useWindowStore } from '@shell/windowStore';
import NoteList from './NoteList';
import NoteEditor from './NoteEditor';
import EmptyState from './EmptyState';

// ─── Constants ───────────────────────────────────────────────────────

const AUTOSAVE_DELAY = 500;

// ─── Component ───────────────────────────────────────────────────────

export default function NotesPanel() {
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const { notes, activeNoteId, isDirty, isSaving } = useNoteStore();
  const activeNote = notes.find((n) => n.id === activeNoteId) ?? null;

  const [error, setError] = useState<string | null>(null);

  // ─── Autosave Debounce (owned by UI, not service) ──────────────

  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{ id: string; content: string } | null>(null);

  /** Flush any pending autosave immediately. */
  const flushPendingSave = useCallback(async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    if (pendingSaveRef.current) {
      const { id, content } = pendingSaveRef.current;
      pendingSaveRef.current = null;
      await noteService.updateNoteContent(id, content);
    }
  }, []);

  /** Schedule a debounced content save. Called by NoteEditor on every keystroke. */
  const scheduleContentSave = useCallback((id: string, content: string) => {
    pendingSaveRef.current = { id, content };
    useNoteStore.getState().setDirty(true);

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      autosaveTimerRef.current = null;
      if (pendingSaveRef.current) {
        const pending = pendingSaveRef.current;
        pendingSaveRef.current = null;
        await noteService.updateNoteContent(pending.id, pending.content);
      }
    }, AUTOSAVE_DELAY);
  }, []);

  // ─── Project Switch: Load/Clear Notes ──────────────────────────

  useEffect(() => {
    // Flush any pending save from the previous project
    flushPendingSave();

    if (activeProjectId) {
      noteService.loadNotes(activeProjectId);
    } else {
      noteService.clearNotes();
    }
  }, [activeProjectId, flushPendingSave]);

  // ─── Lifecycle Guards: flush on tab close / visibility change ──

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Synchronous: can't await, but we clear the timer and attempt save
      if (pendingSaveRef.current) {
        const { id, content } = pendingSaveRef.current;
        pendingSaveRef.current = null;
        // Fire-and-forget — best effort on tab close
        noteService.updateNoteContent(id, content);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushPendingSave]);

  // ─── Window Minimize Detection (Option 2 from plan) ────────────
  // Subscribe to window store to detect when THIS window is minimized.
  // Flush pending save so no data is lost.

  const windowsRef = useRef(useWindowStore.getState().windows);

  useEffect(() => {
    const unsub = useWindowStore.subscribe((state) => {
      const prevWindows = windowsRef.current;
      windowsRef.current = state.windows;

      // Find notes windows that transitioned to minimized
      for (const win of state.windows) {
        if (win.appId !== 'notes') continue;
        const prev = prevWindows.find((w) => w.id === win.id);
        if (prev && prev.state !== 'minimized' && win.state === 'minimized') {
          flushPendingSave();
        }
      }
    });

    return unsub;
  }, [flushPendingSave]);

  // ─── Unmount: flush pending save ───────────────────────────────

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (pendingSaveRef.current) {
        const { id, content } = pendingSaveRef.current;
        pendingSaveRef.current = null;
        noteService.updateNoteContent(id, content);
      }
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  // ─── Auto-clear errors ─────────────────────────────────────────

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(timer);
  }, [error]);

  // ─── Handlers ──────────────────────────────────────────────────

  const handleCreateNote = async () => {
    if (!activeProjectId) return;
    try {
      await noteService.createNote(activeProjectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note.');
    }
  };

  const handleSelectNote = async (id: string) => {
    // Flush any pending save for the current note before switching
    await flushPendingSave();
    useNoteStore.getState().setActiveNote(id);
  };

  const handleRenameNote = async (id: string, title: string) => {
    try {
      await noteService.renameNote(id, title);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename note.');
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      // Clear pending save if deleting the note being edited
      if (pendingSaveRef.current?.id === id) {
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
          autosaveTimerRef.current = null;
        }
        pendingSaveRef.current = null;
      }
      await noteService.deleteNote(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note.');
    }
  };

  // ─── Render ────────────────────────────────────────────────────

  // No project selected → full empty state, no create button
  if (!activeProjectId) {
    return <EmptyState type="no-project" />;
  }

  return (
    <div className="notes-panel">
      {/* ─── Sidebar ──────────────────────────────────────────── */}
      <div className="notes-sidebar">
        {/* Header */}
        <div className="notes-sidebar-header">
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">
            Notes
          </span>
          <button
            onClick={handleCreateNote}
            className="notes-new-btn"
            title="New Note"
          >
            +
          </button>
        </div>

        {/* Note List */}
        <NoteList
          notes={notes}
          activeNoteId={activeNoteId}
          onSelect={handleSelectNote}
          onRename={handleRenameNote}
          onDelete={handleDeleteNote}
        />
      </div>

      {/* ─── Divider ──────────────────────────────────────────── */}
      <div className="notes-divider" />

      {/* ─── Editor Pane ──────────────────────────────────────── */}
      <div className="notes-editor-pane">
        {/* Error Banner */}
        {error && (
          <div className="notes-error">
            <span className="text-xs text-red-400">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400/60 hover:text-red-400 cursor-pointer text-xs ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {activeNote ? (
          <NoteEditor
            note={activeNote}
            isDirty={isDirty}
            isSaving={isSaving}
            onContentChange={scheduleContentSave}
            onRename={handleRenameNote}
          />
        ) : (
          <EmptyState
            type="no-note"
            noteCount={notes.length}
            onCreateNote={handleCreateNote}
          />
        )}
      </div>
    </div>
  );
}
