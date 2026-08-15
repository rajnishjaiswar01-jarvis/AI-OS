/**
 * AI OS — Files Feature Tests
 *
 * Tests the full file lifecycle through the service layer.
 * Uses a fresh test database per test to avoid IndexedDB conflicts.
 *
 * Coverage:
 *
 * Repository (8 tests):
 *   - upsert + findById
 *   - findByProject (excludes soft-deleted, folders first)
 *   - findByParent (children of folder)
 *   - findByParentAndName (case-insensitive)
 *   - project isolation (only matching projectId)
 *   - remove (hard delete)
 *   - count (non-deleted only)
 *   - findChildren (for cascade)
 *
 * Service — Validation (7 tests):
 *   - create file at root
 *   - create file inside folder
 *   - reject empty name
 *   - reject name with /
 *   - reject name with \
 *   - reject name over 200 chars
 *   - reject nonexistent project
 *
 * Service — Depth Invariant (3 tests):
 *   - reject file inside non-folder (file as parent)
 *   - reject file inside nested folder (depth > 1)
 *   - reject parent from another project
 *
 * Service — Name Uniqueness (4 tests):
 *   - reject duplicate name at root
 *   - reject case-insensitive duplicate (README.md vs readme.md)
 *   - reject duplicate inside folder
 *   - allow same name in different scopes
 *
 * Service — Folders (4 tests):
 *   - create folder at root
 *   - folder content always empty
 *   - reject content update on folder
 *   - duplicate folder name rejected
 *
 * Service — CRUD (5 tests):
 *   - persist file to Dexie
 *   - rename file in store and Dexie
 *   - rename no-op if unchanged
 *   - update content in store and Dexie
 *   - soft-delete file
 *
 * Service — Cascade Delete (3 tests):
 *   - folder delete cascades children
 *   - cascade updates Dexie
 *   - delete folder with no children (no error)
 *
 * Service — Active File / Load (5 tests):
 *   - new file becomes active
 *   - delete active clears selection
 *   - loadFiles hydrates store
 *   - project switch loads correct files
 *   - clearFiles empties store
 *
 * Service — Deleted Entity Guard (3 tests):
 *   - rename deleted entry → DELETED_ENTITY
 *   - update content of deleted file → DELETED_ENTITY
 *   - delete already-deleted → idempotent no-op
 *
 * Store (5 tests):
 *   - addEntry adds to list
 *   - updateEntry by id
 *   - removeEntry clears active if needed
 *   - removeChildren removes matching
 *   - toggleFolder expand/collapse
 *
 * @see Sprint 4 — Files Workspace
 * @see ADR-010 — Single-Level Folder Hierarchy
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AiOSDatabase } from '@core/db/database';
import { fileRepository } from './fileRepository';
import { fileService } from './fileService';
import { useFileStore, _resetFileStoreForTests } from './fileStore';

// ─── Test Database Setup ─────────────────────────────────────────────

const testDbs: AiOSDatabase[] = [];
let testDb: AiOSDatabase;

function createTestDb(): AiOSDatabase {
  const name = `ai-os-files-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
const TEST_PROJECT_ID = 'project-files-001';
const TEST_PROJECT_ID_2 = 'project-files-002';

vi.mock('@features/projects/projectRepository', () => ({
  projectRepository: {
    findById: vi.fn(async (id: string) => {
      if (id === TEST_PROJECT_ID || id === TEST_PROJECT_ID_2) {
        return { id, name: `Test Project ${id}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      }
      return undefined;
    }),
  },
}));

beforeEach(() => {
  _resetFileStoreForTests();
  testDb = createTestDb();
});

afterEach(async () => {
  for (const db of testDbs) {
    db.close();
    await db.delete();
  }
  testDbs.length = 0;
});

// ─── Helper: create a root folder directly via repository ────────────

async function createRootFolder(projectId: string, name: string, id?: string) {
  const folder = {
    id: id ?? crypto.randomUUID(),
    projectId,
    parentId: null,
    name,
    type: 'folder' as const,
    content: '',
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await fileRepository.upsert(folder);
  return folder;
}

// ─── Repository Tests ────────────────────────────────────────────────

describe('File Repository', () => {
  it('should upsert and findById', async () => {
    const entry = {
      id: 'repo-1',
      projectId: TEST_PROJECT_ID,
      parentId: null,
      name: 'test.md',
      type: 'file' as const,
      content: 'hello',
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await fileRepository.upsert(entry);
    const found = await fileRepository.findById('repo-1');

    expect(found).toBeDefined();
    expect(found!.name).toBe('test.md');
    expect(found!.content).toBe('hello');
  });

  it('should findByProject and exclude soft-deleted, folders first', async () => {
    const now = new Date().toISOString();
    await fileRepository.upsert({ id: 'f1', projectId: TEST_PROJECT_ID, parentId: null, name: 'b-file.md', type: 'file', content: '', isDeleted: false, createdAt: now, updatedAt: now });
    await fileRepository.upsert({ id: 'f2', projectId: TEST_PROJECT_ID, parentId: null, name: 'a-folder', type: 'folder', content: '', isDeleted: false, createdAt: now, updatedAt: now });
    await fileRepository.upsert({ id: 'f3', projectId: TEST_PROJECT_ID, parentId: null, name: 'deleted.md', type: 'file', content: '', isDeleted: true, createdAt: now, updatedAt: now });

    const entries = await fileRepository.findByProject(TEST_PROJECT_ID);

    expect(entries).toHaveLength(2);
    expect(entries[0].type).toBe('folder'); // Folders first
    expect(entries[0].name).toBe('a-folder');
    expect(entries[1].name).toBe('b-file.md');
  });

  it('should findByParent for children of a folder', async () => {
    const folder = await createRootFolder(TEST_PROJECT_ID, 'Documents', 'folder-1');
    const now = new Date().toISOString();
    await fileRepository.upsert({ id: 'child-1', projectId: TEST_PROJECT_ID, parentId: folder.id, name: 'report.md', type: 'file', content: '', isDeleted: false, createdAt: now, updatedAt: now });
    await fileRepository.upsert({ id: 'root-1', projectId: TEST_PROJECT_ID, parentId: null, name: 'readme.md', type: 'file', content: '', isDeleted: false, createdAt: now, updatedAt: now });

    const children = await fileRepository.findByParent(TEST_PROJECT_ID, folder.id);

    expect(children).toHaveLength(1);
    expect(children[0].name).toBe('report.md');
  });

  it('should findByParentAndName case-insensitively', async () => {
    const now = new Date().toISOString();
    await fileRepository.upsert({ id: 'ci-1', projectId: TEST_PROJECT_ID, parentId: null, name: 'README.md', type: 'file', content: '', isDeleted: false, createdAt: now, updatedAt: now });

    const found = await fileRepository.findByParentAndName(TEST_PROJECT_ID, null, 'readme.md');
    expect(found).toBeDefined();
    expect(found!.name).toBe('README.md');
  });

  it('should isolate entries by project', async () => {
    const now = new Date().toISOString();
    await fileRepository.upsert({ id: 'iso-1', projectId: TEST_PROJECT_ID, parentId: null, name: 'a.md', type: 'file', content: '', isDeleted: false, createdAt: now, updatedAt: now });
    await fileRepository.upsert({ id: 'iso-2', projectId: TEST_PROJECT_ID_2, parentId: null, name: 'b.md', type: 'file', content: '', isDeleted: false, createdAt: now, updatedAt: now });

    const p1 = await fileRepository.findByProject(TEST_PROJECT_ID);
    expect(p1).toHaveLength(1);
    expect(p1[0].id).toBe('iso-1');
  });

  it('should hard-delete with remove', async () => {
    const now = new Date().toISOString();
    await fileRepository.upsert({ id: 'hd-1', projectId: TEST_PROJECT_ID, parentId: null, name: 'del.md', type: 'file', content: '', isDeleted: false, createdAt: now, updatedAt: now });

    await fileRepository.remove('hd-1');
    const found = await fileRepository.findById('hd-1');
    expect(found).toBeUndefined();
  });

  it('should count non-deleted entries', async () => {
    const now = new Date().toISOString();
    await fileRepository.upsert({ id: 'cnt-1', projectId: TEST_PROJECT_ID, parentId: null, name: 'a.md', type: 'file', content: '', isDeleted: false, createdAt: now, updatedAt: now });
    await fileRepository.upsert({ id: 'cnt-2', projectId: TEST_PROJECT_ID, parentId: null, name: 'b.md', type: 'file', content: '', isDeleted: true, createdAt: now, updatedAt: now });

    const count = await fileRepository.count(TEST_PROJECT_ID);
    expect(count).toBe(1);
  });

  it('should findChildren for cascade', async () => {
    await createRootFolder(TEST_PROJECT_ID, 'Docs', 'fc-folder');
    const now = new Date().toISOString();
    await fileRepository.upsert({ id: 'fc-1', projectId: TEST_PROJECT_ID, parentId: 'fc-folder', name: 'a.md', type: 'file', content: '', isDeleted: false, createdAt: now, updatedAt: now });
    await fileRepository.upsert({ id: 'fc-2', projectId: TEST_PROJECT_ID, parentId: 'fc-folder', name: 'b.md', type: 'file', content: '', isDeleted: false, createdAt: now, updatedAt: now });
    await fileRepository.upsert({ id: 'fc-3', projectId: TEST_PROJECT_ID, parentId: 'fc-folder', name: 'del.md', type: 'file', content: '', isDeleted: true, createdAt: now, updatedAt: now });

    const children = await fileRepository.findChildren('fc-folder');
    expect(children).toHaveLength(2); // Excludes soft-deleted
  });
});

// ─── Service — Validation Tests ──────────────────────────────────────

describe('File Service — Validation', () => {
  it('should create a file at root', async () => {
    const file = await fileService.createFile(TEST_PROJECT_ID, 'readme.md');

    expect(file.name).toBe('readme.md');
    expect(file.parentId).toBeNull();
    expect(file.type).toBe('file');
    expect(file.content).toBe('');
  });

  it('should create a file inside a folder', async () => {
    const folder = await fileService.createFolder(TEST_PROJECT_ID, 'Documents');
    const file = await fileService.createFile(TEST_PROJECT_ID, 'report.md', folder.id);

    expect(file.parentId).toBe(folder.id);
    expect(file.type).toBe('file');
  });

  it('should reject empty names', async () => {
    await expect(fileService.createFile(TEST_PROJECT_ID, '')).rejects.toThrow('empty');
    await expect(fileService.createFile(TEST_PROJECT_ID, '   ')).rejects.toThrow('empty');
  });

  it('should reject names containing /', async () => {
    await expect(fileService.createFile(TEST_PROJECT_ID, 'path/file.md')).rejects.toThrow('/');
  });

  it('should reject names containing \\', async () => {
    await expect(fileService.createFile(TEST_PROJECT_ID, 'path\\file.md')).rejects.toThrow('\\');
  });

  it('should reject names over 200 characters', async () => {
    const longName = 'a'.repeat(201);
    await expect(fileService.createFile(TEST_PROJECT_ID, longName)).rejects.toThrow('200');
  });

  it('should reject creation for nonexistent project', async () => {
    await expect(fileService.createFile('nonexistent', 'file.md')).rejects.toThrow('not found');
  });
});

// ─── Service — Depth Invariant Tests ─────────────────────────────────

describe('File Service — Depth Invariant', () => {
  it('should reject file inside a file (not a folder)', async () => {
    const file = await fileService.createFile(TEST_PROJECT_ID, 'notafolder.md');
    await expect(fileService.createFile(TEST_PROJECT_ID, 'child.md', file.id)).rejects.toThrow('folder');
  });

  it('should reject file inside nested folder (depth > 1)', async () => {
    // Create a root folder, then try to create a child folder manually and put a file in it
    const rootFolder = await fileService.createFolder(TEST_PROJECT_ID, 'Root');

    // Manually insert a "nested folder" to simulate depth > 1
    const nestedFolder = {
      id: 'nested-folder-hack',
      projectId: TEST_PROJECT_ID,
      parentId: rootFolder.id,
      name: 'Nested',
      type: 'folder' as const,
      content: '',
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await fileRepository.upsert(nestedFolder);

    // This should fail because nestedFolder.parentId !== null
    await expect(
      fileService.createFile(TEST_PROJECT_ID, 'deep.md', nestedFolder.id)
    ).rejects.toThrow('non-root');
  });

  it('should reject parent from another project', async () => {
    const folder = await fileService.createFolder(TEST_PROJECT_ID, 'MyFolder');

    // Try to create a file in project 2 using project 1's folder
    await expect(
      fileService.createFile(TEST_PROJECT_ID_2, 'cross.md', folder.id)
    ).rejects.toThrow('different project');
  });
});

// ─── Service — Name Uniqueness Tests ─────────────────────────────────

describe('File Service — Name Uniqueness', () => {
  it('should reject duplicate name at root', async () => {
    await fileService.createFile(TEST_PROJECT_ID, 'readme.md');
    await expect(fileService.createFile(TEST_PROJECT_ID, 'readme.md')).rejects.toThrow('already exists');
  });

  it('should reject case-insensitive duplicates (README.md vs readme.md)', async () => {
    await fileService.createFile(TEST_PROJECT_ID, 'README.md');
    await expect(fileService.createFile(TEST_PROJECT_ID, 'readme.md')).rejects.toThrow('already exists');
  });

  it('should reject duplicate name inside folder', async () => {
    const folder = await fileService.createFolder(TEST_PROJECT_ID, 'Docs');
    await fileService.createFile(TEST_PROJECT_ID, 'report.md', folder.id);
    await expect(fileService.createFile(TEST_PROJECT_ID, 'report.md', folder.id)).rejects.toThrow('already exists');
  });

  it('should allow same name in different scopes', async () => {
    const folder = await fileService.createFolder(TEST_PROJECT_ID, 'Docs');

    // Same name at root and inside folder — should be fine
    const rootFile = await fileService.createFile(TEST_PROJECT_ID, 'readme.md');
    const folderFile = await fileService.createFile(TEST_PROJECT_ID, 'readme.md', folder.id);

    expect(rootFile.id).not.toBe(folderFile.id);
    expect(rootFile.parentId).toBeNull();
    expect(folderFile.parentId).toBe(folder.id);
  });
});

// ─── Service — Folder Tests ──────────────────────────────────────────

describe('File Service — Folders', () => {
  it('should create folder at root', async () => {
    const folder = await fileService.createFolder(TEST_PROJECT_ID, 'Documents');

    expect(folder.type).toBe('folder');
    expect(folder.parentId).toBeNull();
    expect(folder.content).toBe('');
  });

  it('should always set folder content to empty', async () => {
    const folder = await fileService.createFolder(TEST_PROJECT_ID, 'Folder');
    const fromDb = await fileRepository.findById(folder.id);
    expect(fromDb!.content).toBe('');
  });

  it('should reject content update on folder', async () => {
    const folder = await fileService.createFolder(TEST_PROJECT_ID, 'Folder');
    await expect(fileService.updateFileContent(folder.id, 'some content')).rejects.toThrow('folder');
  });

  it('should reject duplicate folder name at root', async () => {
    await fileService.createFolder(TEST_PROJECT_ID, 'Documents');
    await expect(fileService.createFolder(TEST_PROJECT_ID, 'Documents')).rejects.toThrow('already exists');
  });
});

// ─── Service — CRUD Tests ────────────────────────────────────────────

describe('File Service — CRUD', () => {
  it('should persist file to Dexie on create', async () => {
    const file = await fileService.createFile(TEST_PROJECT_ID, 'persisted.md');
    const fromDb = await fileRepository.findById(file.id);

    expect(fromDb).toBeDefined();
    expect(fromDb!.name).toBe('persisted.md');
  });

  it('should rename a file in store and Dexie', async () => {
    const file = await fileService.createFile(TEST_PROJECT_ID, 'original.md');
    await fileService.renameEntry(file.id, 'renamed.md');

    // Verify store
    const storeEntry = useFileStore.getState().entries.find((e) => e.id === file.id);
    expect(storeEntry!.name).toBe('renamed.md');

    // Verify Dexie
    const fromDb = await fileRepository.findById(file.id);
    expect(fromDb!.name).toBe('renamed.md');
  });

  it('should no-op rename if name unchanged', async () => {
    const file = await fileService.createFile(TEST_PROJECT_ID, 'same.md');
    const originalUpdatedAt = file.updatedAt;

    await fileService.renameEntry(file.id, 'same.md');

    const fromDb = await fileRepository.findById(file.id);
    expect(fromDb!.updatedAt).toBe(originalUpdatedAt);
  });

  it('should update content in store and Dexie', async () => {
    const file = await fileService.createFile(TEST_PROJECT_ID, 'content.md');
    await fileService.updateFileContent(file.id, 'Hello world');

    // Verify store
    const storeEntry = useFileStore.getState().entries.find((e) => e.id === file.id);
    expect(storeEntry!.content).toBe('Hello world');

    // Verify Dexie
    const fromDb = await fileRepository.findById(file.id);
    expect(fromDb!.content).toBe('Hello world');
  });

  it('should soft-delete a file', async () => {
    const file = await fileService.createFile(TEST_PROJECT_ID, 'todelete.md');
    await fileService.deleteEntry(file.id);

    // Gone from store
    expect(useFileStore.getState().entries).toHaveLength(0);

    // Still in Dexie but marked deleted
    const fromDb = await fileRepository.findById(file.id);
    expect(fromDb).toBeDefined();
    expect(fromDb!.isDeleted).toBe(true);
  });
});

// ─── Service — Cascade Delete Tests ──────────────────────────────────

describe('File Service — Cascade Delete', () => {
  it('should cascade-delete children when deleting a folder', async () => {
    const folder = await fileService.createFolder(TEST_PROJECT_ID, 'ToDelete');
    const child1 = await fileService.createFile(TEST_PROJECT_ID, 'a.md', folder.id);
    const child2 = await fileService.createFile(TEST_PROJECT_ID, 'b.md', folder.id);

    await fileService.deleteEntry(folder.id);

    // All gone from store
    const storeEntries = useFileStore.getState().entries;
    expect(storeEntries).toHaveLength(0);

    // All soft-deleted in Dexie
    const folderDb = await fileRepository.findById(folder.id);
    const child1Db = await fileRepository.findById(child1.id);
    const child2Db = await fileRepository.findById(child2.id);

    expect(folderDb!.isDeleted).toBe(true);
    expect(child1Db!.isDeleted).toBe(true);
    expect(child2Db!.isDeleted).toBe(true);
  });

  it('should cascade in Dexie (children persist as deleted)', async () => {
    const folder = await fileService.createFolder(TEST_PROJECT_ID, 'Cascade');
    await fileService.createFile(TEST_PROJECT_ID, 'inside.md', folder.id);

    await fileService.deleteEntry(folder.id);

    // findByProject should return 0 (all soft-deleted)
    const entries = await fileRepository.findByProject(TEST_PROJECT_ID);
    expect(entries).toHaveLength(0);
  });

  it('should delete folder with no children without error', async () => {
    const folder = await fileService.createFolder(TEST_PROJECT_ID, 'EmptyFolder');
    await fileService.deleteEntry(folder.id);

    const fromDb = await fileRepository.findById(folder.id);
    expect(fromDb!.isDeleted).toBe(true);
  });
});

// ─── Service — Active File / Load Tests ──────────────────────────────

describe('File Service — Active File / Load', () => {
  it('should set new file as active', async () => {
    const file = await fileService.createFile(TEST_PROJECT_ID, 'active.md');
    expect(useFileStore.getState().activeFileId).toBe(file.id);
  });

  it('should clear activeFileId when deleting the active file', async () => {
    const file = await fileService.createFile(TEST_PROJECT_ID, 'willdelete.md');
    expect(useFileStore.getState().activeFileId).toBe(file.id);

    await fileService.deleteEntry(file.id);
    expect(useFileStore.getState().activeFileId).toBeNull();
  });

  it('should hydrate store from Dexie via loadFiles', async () => {
    await fileService.createFile(TEST_PROJECT_ID, 'a.md');
    await fileService.createFile(TEST_PROJECT_ID, 'b.md');

    _resetFileStoreForTests();
    expect(useFileStore.getState().entries).toHaveLength(0);

    await fileService.loadFiles(TEST_PROJECT_ID);
    expect(useFileStore.getState().entries).toHaveLength(2);
  });

  it('should load correct files when switching projects', async () => {
    await fileService.createFile(TEST_PROJECT_ID, 'p1.md');
    await fileService.createFile(TEST_PROJECT_ID_2, 'p2.md');

    await fileService.loadFiles(TEST_PROJECT_ID);
    expect(useFileStore.getState().entries).toHaveLength(1);
    expect(useFileStore.getState().entries[0].projectId).toBe(TEST_PROJECT_ID);

    await fileService.loadFiles(TEST_PROJECT_ID_2);
    expect(useFileStore.getState().entries).toHaveLength(1);
    expect(useFileStore.getState().entries[0].projectId).toBe(TEST_PROJECT_ID_2);
  });

  it('should empty the store when clearFiles is called', async () => {
    await fileService.createFile(TEST_PROJECT_ID, 'willclear.md');

    fileService.clearFiles();

    const { entries, activeFileId, currentFolderId } = useFileStore.getState();
    expect(entries).toHaveLength(0);
    expect(activeFileId).toBeNull();
    expect(currentFolderId).toBeNull();
  });
});

// ─── Service — Deleted Entity Guard Tests ────────────────────────────

describe('File Service — Deleted Entity Guard', () => {
  it('should reject rename on deleted entry', async () => {
    const file = await fileService.createFile(TEST_PROJECT_ID, 'willdelete.md');
    await fileService.deleteEntry(file.id);

    await expect(fileService.renameEntry(file.id, 'newname.md')).rejects.toThrow('Cannot modify a deleted');
  });

  it('should reject content update on deleted file', async () => {
    const file = await fileService.createFile(TEST_PROJECT_ID, 'willdelete.md');
    await fileService.deleteEntry(file.id);

    await expect(fileService.updateFileContent(file.id, 'new content')).rejects.toThrow('Cannot modify a deleted');
  });

  it('should allow deleteEntry on already-deleted entry (idempotent)', async () => {
    const file = await fileService.createFile(TEST_PROJECT_ID, 'deleteme.md');
    await fileService.deleteEntry(file.id);

    // Second delete should not throw
    await fileService.deleteEntry(file.id);

    const fromDb = await fileRepository.findById(file.id);
    expect(fromDb!.isDeleted).toBe(true);
  });
});

// ─── Store Tests ─────────────────────────────────────────────────────

describe('File Store', () => {
  const mockEntry = (overrides: Partial<import('@core/db/types').FileEntry> = {}) => ({
    id: crypto.randomUUID(),
    projectId: 'p',
    parentId: null,
    name: 'test.md',
    type: 'file' as const,
    content: '',
    isDeleted: false,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  });

  it('should add an entry to the list', () => {
    const store = useFileStore.getState();
    const entry = mockEntry({ id: 'add-1' });
    store.addEntry(entry);

    expect(useFileStore.getState().entries).toHaveLength(1);
    expect(useFileStore.getState().entries[0].id).toBe('add-1');
  });

  it('should update an entry by id', () => {
    const store = useFileStore.getState();
    store.addEntry(mockEntry({ id: 'upd-1', name: 'before.md' }));

    store.updateEntry('upd-1', { name: 'after.md' });

    expect(useFileStore.getState().entries[0].name).toBe('after.md');
  });

  it('should remove an entry and clear active if needed', () => {
    const store = useFileStore.getState();
    store.addEntry(mockEntry({ id: 'rem-1' }));
    store.setActiveFile('rem-1');

    store.removeEntry('rem-1');

    expect(useFileStore.getState().entries).toHaveLength(0);
    expect(useFileStore.getState().activeFileId).toBeNull();
  });

  it('should remove children by parentId', () => {
    const store = useFileStore.getState();
    store.addEntry(mockEntry({ id: 'parent', type: 'folder' }));
    store.addEntry(mockEntry({ id: 'child-1', parentId: 'parent' }));
    store.addEntry(mockEntry({ id: 'child-2', parentId: 'parent' }));
    store.addEntry(mockEntry({ id: 'other', parentId: null }));

    store.removeChildren('parent');

    const entries = useFileStore.getState().entries;
    expect(entries).toHaveLength(2); // parent + other
    expect(entries.find((e) => e.id === 'child-1')).toBeUndefined();
  });

  it('should toggle folder expand/collapse', () => {
    const store = useFileStore.getState();

    store.toggleFolder('f1');
    expect(useFileStore.getState().expandedFolders.has('f1')).toBe(true);

    store.toggleFolder('f1');
    expect(useFileStore.getState().expandedFolders.has('f1')).toBe(false);
  });
});
