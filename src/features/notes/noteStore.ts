/**
 * AI OS — Note Store
 *
 * Pure Zustand state container for note data.
 * NO side effects. NO Dexie access. NO API calls.
 * All mutations are called by noteService after successful persistence.
 *
 * Includes dirty/saving state for autosave UX indicators.
 *
 * @see FOUNDATION_FREEZE.md — Service Layer
 */

import { create } from 'zustand';
import type { Note } from '@core/db/types';

// ─── Store Interface ─────────────────────────────────────────────────

interface NoteState {
  /** All notes for the active project (non-deleted) */
  notes: Note[];
  /** Currently selected note ID (null = no note selected) */
  activeNoteId: string | null;

  /** Whether the active note has unsaved changes */
  isDirty: boolean;
  /** Whether an autosave is in progress */
  isSaving: boolean;

  // Pure mutations (called by noteService, NEVER directly by components)
  setNotes: (notes: Note[]) => void;
  setActiveNote: (id: string | null) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  removeNote: (id: string) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
}

// ─── Store ───────────────────────────────────────────────────────────

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  activeNoteId: null,
  isDirty: false,
  isSaving: false,

  setNotes: (notes: Note[]) => set({ notes }),

  setActiveNote: (id: string | null) => set({ activeNoteId: id, isDirty: false }),

  addNote: (note: Note) =>
    set((state) => ({
      notes: [note, ...state.notes],
    })),

  updateNote: (id: string, updates: Partial<Note>) =>
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, ...updates } : n
      ),
    })),

  removeNote: (id: string) =>
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      // If deleted note was active, clear active
      activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
      isDirty: state.activeNoteId === id ? false : state.isDirty,
    })),

  setDirty: (dirty: boolean) => set({ isDirty: dirty }),
  setSaving: (saving: boolean) => set({ isSaving: saving }),
}));

/**
 * Reset the note store to its initial state. Primarily for testing.
 * @internal
 */
export function _resetNoteStoreForTests(): void {
  useNoteStore.setState({
    notes: [],
    activeNoteId: null,
    isDirty: false,
    isSaving: false,
  });
}
