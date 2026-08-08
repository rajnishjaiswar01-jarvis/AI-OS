/**
 * AI OS — Notes Feature Tests
 *
 * Tests the full note lifecycle through the service layer.
 * Uses a fresh test database per test to avoid IndexedDB conflicts.
 *
 * Coverage:
 *
 * Repository (6 tests):
 *   - upsert + findById
 *   - findByProject (filters by projectId)
 *   - findByProject excludes soft-deleted
 *   - project isolation (only matching projectId)
 *   - remove (hard delete)
 *   - count (non-deleted only)
 *
 * Service — Validation (5 tests):
 *   - create valid note
 *   - default title "Untitled"
 *   - empty title rejected
 *   - whitespace title rejected
 *   - title over 200 chars rejected
 *   - nonexistent project rejected
 *
 * Service — CRUD (6 tests):
 *   - rename note in store + Dexie
 *   - rename empty title rejected
 *   - rename no-op if unchanged
 *   - rename NOT_FOUND for nonexistent
 *   - soft-delete note
 *   - soft-deleted note excluded from queries
 *
 * Service — Content Update (4 tests):
 *   - updateNoteContent persists immediately
 *   - updateNoteContent updates store
 *   - updateNoteContent skips deleted notes
 *   - updateNoteContent clears dirty/saving state
 *
 * Service — Active Note (3 tests):
 *   - new note becomes active
 *   - delete active note clears selection
 *   - getActiveNote returns correct note
 *
 * Service — Load / Project Switching (5 tests):
 *   - loadNotes hydrates store
 *   - loadNotes only loads matching project
 *   - loadNotes returns empty for no notes
 *   - loadNotes clears activeNoteId
 *   - project switch loads correct notes
 *
 * Service — Edge Cases (3 tests):
 *   - clearNotes empties store
 *   - delete nonexistent note is no-op
 *   - multiple notes ordering
 *
 * @see Sprint 2 — Notes Workspace
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AiOSDatabase } from '@core/db/database';
import { noteRepository } from './noteRepository';
import { noteService } from './noteService';
import { useNoteStore, _resetNoteStoreForTests } from './noteStore';

// ─── Test Database Setup ─────────────────────────────────────────────

const testDbs: AiOSDatabase[] = [];
let testDb: AiOSDatabase;

function createTestDb(): AiOSDatabase {
  const name = `ai-os-notes-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const db = new AiOSDatabase(name);
  testDbs.push(db);
  return db;
}

// Mock the database module so all code uses our test DB
vi.mock('@core/db/database', async (importOriginal) => {
  const original = await importOriginal<typeof import('@core/db/database')>();
  return {
    ...original,
    get db() {
      return testDb;
    },
  };
});

// Mock the project repository for project existence checks
vi.mock('@features/projects/projectRepository', () => ({
  projectRepository: {
    findById: vi.fn(async (id: string) => {
      // Known test project IDs are treated as existing
      if (id === TEST_PROJECT_ID || id === TEST_PROJECT_ID_2) {
        return { id, name: `Test Project ${id}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      }
      return undefined;
    }),
  },
}));

const TEST_PROJECT_ID = 'project-test-001';
const TEST_PROJECT_ID_2 = 'project-test-002';

beforeEach(() => {
  _resetNoteStoreForTests();
  testDb = createTestDb();
});

afterEach(async () => {
  for (const db of testDbs) {
    db.close();
    await db.delete();
  }
  testDbs.length = 0;
});

// ─── Repository Tests ────────────────────────────────────────────────

describe('Note Repository', () => {
  it('should upsert and findById', async () => {
    const note = {
      id: 'repo-test-1',
      projectId: TEST_PROJECT_ID,
      title: 'Repo Test',
      content: 'Hello',
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await noteRepository.upsert(note);
    const found = await noteRepository.findById('repo-test-1');

    expect(found).toBeDefined();
    expect(found!.title).toBe('Repo Test');
    expect(found!.content).toBe('Hello');
  });

  it('should findByProject and filter by projectId', async () => {
    const noteA = {
      id: 'iso-a',
      projectId: TEST_PROJECT_ID,
      title: 'A',
      content: '',
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const noteB = {
      id: 'iso-b',
      projectId: TEST_PROJECT_ID_2,
      title: 'B',
      content: '',
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await noteRepository.upsert(noteA);
    await noteRepository.upsert(noteB);

    const project1Notes = await noteRepository.findByProject(TEST_PROJECT_ID);
    expect(project1Notes).toHaveLength(1);
    expect(project1Notes[0].id).toBe('iso-a');
  });

  it('should exclude soft-deleted notes from findByProject', async () => {
    const note = {
      id: 'soft-del-1',
      projectId: TEST_PROJECT_ID,
      title: 'Deleted',
      content: '',
      isDeleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await noteRepository.upsert(note);
    const notes = await noteRepository.findByProject(TEST_PROJECT_ID);

    expect(notes).toHaveLength(0);
  });

  it('should hard-delete with remove', async () => {
    const note = {
      id: 'hard-del-1',
      projectId: TEST_PROJECT_ID,
      title: 'Will Remove',
      content: '',
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await noteRepository.upsert(note);
    await noteRepository.remove('hard-del-1');

    const found = await noteRepository.findById('hard-del-1');
    expect(found).toBeUndefined();
  });

  it('should count non-deleted notes for a project', async () => {
    const now = new Date().toISOString();
    await noteRepository.upsert({ id: 'c1', projectId: TEST_PROJECT_ID, title: 'A', content: '', isDeleted: false, createdAt: now, updatedAt: now });
    await noteRepository.upsert({ id: 'c2', projectId: TEST_PROJECT_ID, title: 'B', content: '', isDeleted: false, createdAt: now, updatedAt: now });
    await noteRepository.upsert({ id: 'c3', projectId: TEST_PROJECT_ID, title: 'C', content: '', isDeleted: true, createdAt: now, updatedAt: now });
    await noteRepository.upsert({ id: 'c4', projectId: TEST_PROJECT_ID_2, title: 'D', content: '', isDeleted: false, createdAt: now, updatedAt: now });

    const count = await noteRepository.count(TEST_PROJECT_ID);
    expect(count).toBe(2);
  });

  it('should return notes sorted by updatedAt descending', async () => {
    const base = Date.now();
    await noteRepository.upsert({ id: 's1', projectId: TEST_PROJECT_ID, title: 'Old', content: '', isDeleted: false, createdAt: new Date(base).toISOString(), updatedAt: new Date(base).toISOString() });
    await noteRepository.upsert({ id: 's2', projectId: TEST_PROJECT_ID, title: 'New', content: '', isDeleted: false, createdAt: new Date(base + 1000).toISOString(), updatedAt: new Date(base + 1000).toISOString() });

    const notes = await noteRepository.findByProject(TEST_PROJECT_ID);
    expect(notes[0].title).toBe('New');
    expect(notes[1].title).toBe('Old');
  });
});

// ─── Service — Validation Tests ──────────────────────────────────────

describe('Note Service — Validation', () => {
  it('should create a note with a valid title', async () => {
    const note = await noteService.createNote(TEST_PROJECT_ID, 'Valid Title');

    expect(note.title).toBe('Valid Title');
    expect(note.id).toBeTruthy();
    expect(note.projectId).toBe(TEST_PROJECT_ID);
    expect(note.content).toBe('');
    expect(note.isDeleted).toBe(false);
  });

  it('should default title to "Untitled" when none provided', async () => {
    const note = await noteService.createNote(TEST_PROJECT_ID);
    expect(note.title).toBe('Untitled');
  });

  it('should reject empty titles', async () => {
    await expect(noteService.createNote(TEST_PROJECT_ID, '')).rejects.toThrow('empty');
  });

  it('should reject whitespace-only titles', async () => {
    await expect(noteService.createNote(TEST_PROJECT_ID, '   ')).rejects.toThrow('empty');
  });

  it('should reject titles over 200 characters', async () => {
    const longTitle = 'a'.repeat(201);
    await expect(noteService.createNote(TEST_PROJECT_ID, longTitle)).rejects.toThrow('200');
  });

  it('should reject creation for nonexistent project', async () => {
    await expect(noteService.createNote('nonexistent-project', 'Note')).rejects.toThrow('not found');
  });
});

// ─── Service — CRUD Tests ────────────────────────────────────────────

describe('Note Service — CRUD', () => {
  it('should persist note to Dexie on create', async () => {
    const note = await noteService.createNote(TEST_PROJECT_ID, 'Persisted');

    const fromDb = await noteRepository.findById(note.id);
    expect(fromDb).toBeDefined();
    expect(fromDb!.title).toBe('Persisted');
  });

  it('should rename a note in store and Dexie', async () => {
    const note = await noteService.createNote(TEST_PROJECT_ID, 'Original');

    await noteService.renameNote(note.id, 'Renamed');

    // Verify store
    const { notes } = useNoteStore.getState();
    expect(notes[0].title).toBe('Renamed');

    // Verify Dexie
    const fromDb = await noteRepository.findById(note.id);
    expect(fromDb!.title).toBe('Renamed');
  });

  it('should reject empty rename', async () => {
    const note = await noteService.createNote(TEST_PROJECT_ID, 'Original');
    await expect(noteService.renameNote(note.id, '')).rejects.toThrow('empty');
  });

  it('should no-op rename if title unchanged', async () => {
    const note = await noteService.createNote(TEST_PROJECT_ID, 'Same');
    const originalUpdatedAt = note.updatedAt;

    await noteService.renameNote(note.id, 'Same');

    const fromDb = await noteRepository.findById(note.id);
    expect(fromDb!.updatedAt).toBe(originalUpdatedAt);
  });

  it('should throw NOT_FOUND for renaming nonexistent note', async () => {
    await expect(noteService.renameNote('nonexistent-id', 'Test')).rejects.toThrow('not found');
  });

  it('should soft-delete note (isDeleted = true, still in DB)', async () => {
    const note = await noteService.createNote(TEST_PROJECT_ID, 'To Delete');

    await noteService.deleteNote(note.id);

    // Gone from store
    expect(useNoteStore.getState().notes).toHaveLength(0);

    // Still in Dexie but marked as deleted
    const fromDb = await noteRepository.findById(note.id);
    expect(fromDb).toBeDefined();
    expect(fromDb!.isDeleted).toBe(true);
  });

  it('should not return soft-deleted notes in project queries', async () => {
    const note = await noteService.createNote(TEST_PROJECT_ID, 'Will Delete');
    await noteService.deleteNote(note.id);

    const notes = await noteRepository.findByProject(TEST_PROJECT_ID);
    expect(notes).toHaveLength(0);
  });
});

// ─── Service — Content Update Tests ──────────────────────────────────

describe('Note Service — Content Update', () => {
  it('should persist content immediately via updateNoteContent', async () => {
    const note = await noteService.createNote(TEST_PROJECT_ID, 'Content Test');

    await noteService.updateNoteContent(note.id, 'Updated content');

    const fromDb = await noteRepository.findById(note.id);
    expect(fromDb!.content).toBe('Updated content');
  });

  it('should update store content after updateNoteContent', async () => {
    const note = await noteService.createNote(TEST_PROJECT_ID, 'Store Update');

    await noteService.updateNoteContent(note.id, 'New content');

    const storeNote = useNoteStore.getState().notes.find((n) => n.id === note.id);
    expect(storeNote!.content).toBe('New content');
  });

  it('should skip update for deleted notes', async () => {
    const note = await noteService.createNote(TEST_PROJECT_ID, 'Will Delete Then Update');
    await noteService.deleteNote(note.id);

    // Should not throw, just silently skip
    await noteService.updateNoteContent(note.id, 'Should not persist');

    const fromDb = await noteRepository.findById(note.id);
    expect(fromDb!.content).toBe(''); // Original empty content
  });

  it('should clear dirty and saving state after content update', async () => {
    const note = await noteService.createNote(TEST_PROJECT_ID, 'Dirty Test');

    // Simulate UI setting dirty
    useNoteStore.getState().setDirty(true);
    expect(useNoteStore.getState().isDirty).toBe(true);

    await noteService.updateNoteContent(note.id, 'Content');

    expect(useNoteStore.getState().isDirty).toBe(false);
    expect(useNoteStore.getState().isSaving).toBe(false);
  });
});

// ─── Service — Active Note Tests ─────────────────────────────────────

describe('Note Service — Active Note', () => {
  it('should set new note as active', async () => {
    const note = await noteService.createNote(TEST_PROJECT_ID, 'Active Note');
    expect(useNoteStore.getState().activeNoteId).toBe(note.id);
  });

  it('should clear activeNoteId when deleting the active note', async () => {
    const note = await noteService.createNote(TEST_PROJECT_ID, 'Active to Delete');
    expect(useNoteStore.getState().activeNoteId).toBe(note.id);

    await noteService.deleteNote(note.id);

    expect(useNoteStore.getState().activeNoteId).toBeNull();
  });

  it('should return active note via getActiveNote', async () => {
    const note = await noteService.createNote(TEST_PROJECT_ID, 'Get Active');

    const active = noteService.getActiveNote();
    expect(active).not.toBeNull();
    expect(active!.id).toBe(note.id);
    expect(active!.title).toBe('Get Active');
  });
});

// ─── Service — Load / Project Switching Tests ────────────────────────

describe('Note Service — Load / Project Switching', () => {
  it('should hydrate store from Dexie', async () => {
    await noteService.createNote(TEST_PROJECT_ID, 'Note A');
    await noteService.createNote(TEST_PROJECT_ID, 'Note B');

    // Reset store (simulate app restart)
    _resetNoteStoreForTests();
    expect(useNoteStore.getState().notes).toHaveLength(0);

    // Reload from Dexie
    await noteService.loadNotes(TEST_PROJECT_ID);

    expect(useNoteStore.getState().notes).toHaveLength(2);
  });

  it('should only load notes for the specified project', async () => {
    await noteService.createNote(TEST_PROJECT_ID, 'Project 1 Note');
    await noteService.createNote(TEST_PROJECT_ID_2, 'Project 2 Note');

    await noteService.loadNotes(TEST_PROJECT_ID);

    const { notes } = useNoteStore.getState();
    expect(notes).toHaveLength(1);
    expect(notes[0].projectId).toBe(TEST_PROJECT_ID);
  });

  it('should return empty array for project with no notes', async () => {
    // Use a known project ID that has no notes
    await noteService.loadNotes(TEST_PROJECT_ID);

    expect(useNoteStore.getState().notes).toHaveLength(0);
  });

  it('should clear activeNoteId on load', async () => {
    const note = await noteService.createNote(TEST_PROJECT_ID, 'Note');
    expect(useNoteStore.getState().activeNoteId).toBe(note.id);

    await noteService.loadNotes(TEST_PROJECT_ID);

    expect(useNoteStore.getState().activeNoteId).toBeNull();
  });

  it('should load correct notes when switching projects', async () => {
    await noteService.createNote(TEST_PROJECT_ID, 'Project 1 Note');
    await noteService.createNote(TEST_PROJECT_ID_2, 'Project 2 Note A');
    await noteService.createNote(TEST_PROJECT_ID_2, 'Project 2 Note B');

    // Switch to project 2
    await noteService.loadNotes(TEST_PROJECT_ID_2);

    const { notes } = useNoteStore.getState();
    expect(notes).toHaveLength(2);
    expect(notes.every((n) => n.projectId === TEST_PROJECT_ID_2)).toBe(true);

    // Switch back to project 1
    await noteService.loadNotes(TEST_PROJECT_ID);

    const { notes: notes1 } = useNoteStore.getState();
    expect(notes1).toHaveLength(1);
    expect(notes1[0].projectId).toBe(TEST_PROJECT_ID);
  });
});

// ─── Service — Edge Cases ────────────────────────────────────────────

describe('Note Service — Edge Cases', () => {
  it('should empty the store when clearNotes is called', async () => {
    await noteService.createNote(TEST_PROJECT_ID, 'Will Clear');

    noteService.clearNotes();

    const { notes, activeNoteId } = useNoteStore.getState();
    expect(notes).toHaveLength(0);
    expect(activeNoteId).toBeNull();
  });

  it('should no-op when deleting nonexistent note', async () => {
    // Should not throw
    await noteService.deleteNote('nonexistent-id');
    expect(useNoteStore.getState().notes).toHaveLength(0);
  });

  it('should maintain correct count after create and delete', async () => {
    await noteService.createNote(TEST_PROJECT_ID, 'Note 1');
    await noteService.createNote(TEST_PROJECT_ID, 'Note 2');
    await noteService.createNote(TEST_PROJECT_ID, 'Note 3');
    const note4 = await noteService.createNote(TEST_PROJECT_ID, 'Note 4');
    const note5 = await noteService.createNote(TEST_PROJECT_ID, 'Note 5');

    // Delete 2 notes
    await noteService.deleteNote(note4.id);
    await noteService.deleteNote(note5.id);

    const count = await noteRepository.count(TEST_PROJECT_ID);
    expect(count).toBe(3);

    // Store should also reflect 3
    expect(useNoteStore.getState().notes).toHaveLength(3);
  });
});

// ─── Store Tests ─────────────────────────────────────────────────────

describe('Note Store', () => {
  it('should add a note to the front of the list', () => {
    const store = useNoteStore.getState();
    const note = { id: 'store-1', projectId: 'p', title: 'First', content: '', isDeleted: false, createdAt: '', updatedAt: '' };

    store.addNote(note);

    expect(useNoteStore.getState().notes).toHaveLength(1);
    expect(useNoteStore.getState().notes[0].id).toBe('store-1');
  });

  it('should update a note by id', () => {
    const store = useNoteStore.getState();
    store.addNote({ id: 'upd-1', projectId: 'p', title: 'Before', content: '', isDeleted: false, createdAt: '', updatedAt: '' });

    store.updateNote('upd-1', { title: 'After' });

    expect(useNoteStore.getState().notes[0].title).toBe('After');
  });

  it('should remove a note and clear active if it was active', () => {
    const store = useNoteStore.getState();
    store.addNote({ id: 'rem-1', projectId: 'p', title: 'Remove', content: '', isDeleted: false, createdAt: '', updatedAt: '' });
    store.setActiveNote('rem-1');

    expect(useNoteStore.getState().activeNoteId).toBe('rem-1');

    store.removeNote('rem-1');

    expect(useNoteStore.getState().notes).toHaveLength(0);
    expect(useNoteStore.getState().activeNoteId).toBeNull();
  });

  it('should clear isDirty when setting active note', () => {
    const store = useNoteStore.getState();
    store.setDirty(true);
    expect(useNoteStore.getState().isDirty).toBe(true);

    store.setActiveNote('some-id');
    expect(useNoteStore.getState().isDirty).toBe(false);
  });
});
