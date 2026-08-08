/**
 * AI OS — Note Service
 *
 * Business logic, validation, and orchestration for notes.
 * This is the "brain" of the notes feature.
 *
 * Flow: Component → noteService → noteRepository → Dexie
 *                                → noteStore (on success)
 *
 * Rule: Persist first, then update store.
 *       If persistence fails, store state is unchanged.
 *
 * Autosave architecture:
 *   - UI controls the 500ms debounce (NotesPanel / NoteEditor)
 *   - Service only does immediate persistence (no debounce here)
 *   - This prevents bulk/API operations from inheriting debounce behavior
 *
 * Project ownership:
 *   - Every note belongs to a project (projectId)
 *   - createNote validates the project exists before creating
 *   - "No project = no notes" is enforced at the UI layer
 *
 * @see FOUNDATION_FREEZE.md — Service Layer
 */

import { noteRepository } from './noteRepository';
import { projectRepository } from '@features/projects/projectRepository';
import { useNoteStore } from './noteStore';
import { DomainError } from '@core/errors/DomainError';
import type { Note } from '@core/db/types';

// ─── Note Service ────────────────────────────────────────────────────

export const noteService = {
  /**
   * Load all notes for a project into the store.
   * Called when a project becomes active or Notes window opens.
   *
   * Flow: Project Store → changes active project → noteService.loadNotes()
   *       → noteRepository.findByProject() → store.setNotes()
   */
  async loadNotes(projectId: string): Promise<void> {
    const notes = await noteRepository.findByProject(projectId);
    const store = useNoteStore.getState();
    store.setNotes(notes);
    store.setActiveNote(null);
  },

  /**
   * Clear the notes store. Called when no project is active.
   */
  clearNotes(): void {
    const store = useNoteStore.getState();
    store.setNotes([]);
    store.setActiveNote(null);
  },

  /**
   * Create a new note in a project.
   *
   * 1. Validate project exists (business rule — projectId is not a Dexie FK)
   * 2. Validate title
   * 3. Generate UUID
   * 4. Persist to Dexie
   * 5. Update store
   * 6. Set as active note
   */
  async createNote(projectId: string, title?: string): Promise<Note> {
    // Validate project exists
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new DomainError('NOT_FOUND', 'Project not found.');
    }

    const trimmed = (title ?? 'Untitled').trim();
    if (!trimmed) {
      throw new DomainError('VALIDATION_ERROR', 'Note title cannot be empty.');
    }

    if (trimmed.length > 200) {
      throw new DomainError('VALIDATION_ERROR', 'Note title must be 200 characters or less.');
    }

    const now = new Date().toISOString();
    const note: Note = {
      id: crypto.randomUUID(),
      projectId,
      title: trimmed,
      content: '',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    // Persist first
    await noteRepository.upsert(note);

    // Then update store
    const store = useNoteStore.getState();
    store.addNote(note);
    store.setActiveNote(note.id);

    return note;
  },

  /**
   * Update note content immediately. No debouncing.
   *
   * Debounce is the UI's responsibility.
   * This keeps the service pure for bulk/API operations.
   *
   * Flow: UI (debounced) → noteService.updateNoteContent() → Dexie → store
   */
  async updateNoteContent(id: string, content: string): Promise<void> {
    const store = useNoteStore.getState();
    store.setSaving(true);

    try {
      const existing = await noteRepository.findById(id);
      if (!existing || existing.isDeleted) return;

      const updatedAt = new Date().toISOString();
      const updated: Note = { ...existing, content, updatedAt };

      await noteRepository.upsert(updated);
      store.updateNote(id, { content, updatedAt });
    } finally {
      store.setSaving(false);
      store.setDirty(false);
    }
  },

  /**
   * Rename a note.
   */
  async renameNote(id: string, title: string): Promise<void> {
    const trimmed = title.trim();
    if (!trimmed) {
      throw new DomainError('VALIDATION_ERROR', 'Note title cannot be empty.');
    }

    if (trimmed.length > 200) {
      throw new DomainError('VALIDATION_ERROR', 'Note title must be 200 characters or less.');
    }

    const existing = await noteRepository.findById(id);
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Note not found.');
    }

    if (existing.title === trimmed) return;

    const updatedAt = new Date().toISOString();
    const updated: Note = { ...existing, title: trimmed, updatedAt };

    await noteRepository.upsert(updated);
    useNoteStore.getState().updateNote(id, { title: trimmed, updatedAt });
  },

  /**
   * Soft-delete a note.
   * Sets isDeleted = true rather than removing from the database.
   */
  async deleteNote(id: string): Promise<void> {
    const existing = await noteRepository.findById(id);
    if (!existing) return;

    const updated: Note = {
      ...existing,
      isDeleted: true,
      updatedAt: new Date().toISOString(),
    };

    await noteRepository.upsert(updated);
    useNoteStore.getState().removeNote(id);
  },

  /**
   * Get the currently active note.
   */
  getActiveNote(): Note | null {
    const { notes, activeNoteId } = useNoteStore.getState();
    if (!activeNoteId) return null;
    return notes.find((n) => n.id === activeNoteId) ?? null;
  },
};
