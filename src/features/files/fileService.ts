/**
 * AI OS — File Service
 *
 * Business logic, validation, and orchestration for the files feature.
 * Enforces all 9 invariants from ADR-010.
 *
 * Flow: Component → fileService → fileRepository → Dexie
 *                                → fileStore (on success)
 *
 * Rule: Persist first, then update store.
 *       If persistence fails, store state is unchanged.
 *
 * ADR-010 Invariants enforced here:
 *   1. Depth-1 maximum — parentId must reference a root-level folder
 *   2. Folders are content-less — content always ""
 *   3. Folder deletion cascades children
 *   4. Name uniqueness within scope (case-insensitive)
 *   5. parentId referential integrity (exists, not deleted, folder, root-level, same project)
 *   6. No Notes migration (architectural — not code)
 *   7. Filename validation — trimmed, non-empty, no / or \
 *   8. Case-insensitive uniqueness
 *   9. No restoration in v0.3 (no restore method)
 *
 * @see noteService.ts, taskService.ts — same architectural pattern
 * @see ADR-010 — Single-Level Folder Hierarchy
 */

import { fileRepository } from './fileRepository';
import { projectRepository } from '@features/projects/projectRepository';
import { useFileStore } from './fileStore';
import { DomainError } from '@core/errors/DomainError';
import { FileEntryType } from '@core/db/types';
import type { FileEntry } from '@core/db/types';

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Guard: reject operations on deleted entries.
 * Used by all mutation methods.
 */
function assertNotDeleted(entry: FileEntry): void {
  if (entry.isDeleted) {
    throw new DomainError('DELETED_ENTITY', 'Cannot modify a deleted file entry.');
  }
}

/**
 * Validate file/folder name.
 * Invariant #7: trimmed, non-empty, no / or \.
 */
function validateName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new DomainError('VALIDATION_ERROR', 'Name cannot be empty.');
  }
  if (trimmed.length > 200) {
    throw new DomainError('VALIDATION_ERROR', 'Name must be 200 characters or less.');
  }
  if (trimmed.includes('/') || trimmed.includes('\\')) {
    throw new DomainError('VALIDATION_ERROR', 'Name cannot contain "/" or "\\".');
  }
  return trimmed;
}

/**
 * Check name uniqueness within scope (case-insensitive).
 * Invariant #4 and #8.
 */
async function assertNameUnique(
  projectId: string,
  parentId: string | null,
  name: string,
  excludeId?: string,
): Promise<void> {
  const existing = await fileRepository.findByParentAndName(projectId, parentId, name);
  if (existing && existing.id !== excludeId) {
    throw new DomainError('DUPLICATE_NAME', `An entry named "${name}" already exists in this location.`);
  }
}

/**
 * Validate parentId referential integrity.
 * Invariant #1 and #5:
 *   - parent exists
 *   - parent is not deleted
 *   - parent is a folder
 *   - parent is at root level (parentId === null)
 *   - parent belongs to the same project
 */
async function validateParent(parentId: string, projectId: string): Promise<void> {
  const parent = await fileRepository.findById(parentId);
  if (!parent) {
    throw new DomainError('NOT_FOUND', 'Parent folder not found.');
  }
  if (parent.isDeleted) {
    throw new DomainError('DELETED_ENTITY', 'Cannot create inside a deleted folder.');
  }
  if (parent.type !== FileEntryType.Folder) {
    throw new DomainError('VALIDATION_ERROR', 'Parent must be a folder.');
  }
  if (parent.parentId !== null) {
    throw new DomainError('VALIDATION_ERROR', 'Cannot nest inside a non-root folder (max depth = 1).');
  }
  if (parent.projectId !== projectId) {
    throw new DomainError('VALIDATION_ERROR', 'Parent folder belongs to a different project.');
  }
}

// ─── File Service ────────────────────────────────────────────────────

export const fileService = {
  /**
   * Load all entries for a project into the store.
   * Called when a project becomes active or Files window opens.
   */
  async loadFiles(projectId: string): Promise<void> {
    const entries = await fileRepository.findByProject(projectId);
    const store = useFileStore.getState();
    store.setEntries(entries);
    store.setActiveFile(null);
    store.setCurrentFolder(null);
  },

  /**
   * Clear the file store. Called when no project is active.
   */
  clearFiles(): void {
    const store = useFileStore.getState();
    store.setEntries([]);
    store.setActiveFile(null);
    store.setCurrentFolder(null);
  },

  /**
   * Create a new file.
   *
   * Invariants enforced:
   *   #1: depth-1 max (parentId validation)
   *   #4/#8: name uniqueness (case-insensitive)
   *   #5: parentId referential integrity
   *   #7: filename validation
   */
  async createFile(
    projectId: string,
    name: string,
    parentId: string | null = null,
  ): Promise<FileEntry> {
    // Validate project exists
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new DomainError('NOT_FOUND', 'Project not found.');
    }

    const validName = validateName(name);

    // Validate parent if specified
    if (parentId !== null) {
      await validateParent(parentId, projectId);
    }

    // Check name uniqueness in scope
    await assertNameUnique(projectId, parentId, validName);

    const now = new Date().toISOString();
    const entry: FileEntry = {
      id: crypto.randomUUID(),
      projectId,
      parentId,
      name: validName,
      type: FileEntryType.File,
      content: '',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    // Persist first
    await fileRepository.upsert(entry);

    // Then update store
    const store = useFileStore.getState();
    store.addEntry(entry);
    store.setActiveFile(entry.id);

    return entry;
  },

  /**
   * Create a new folder at root level.
   *
   * Invariants enforced:
   *   #1: folders are always at root (parentId = null)
   *   #2: content always empty
   *   #4/#8: name uniqueness (case-insensitive)
   *   #7: filename validation
   */
  async createFolder(projectId: string, name: string): Promise<FileEntry> {
    // Validate project exists
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new DomainError('NOT_FOUND', 'Project not found.');
    }

    const validName = validateName(name);

    // Folders are always at root in v0.3
    const parentId = null;

    // Check name uniqueness at root
    await assertNameUnique(projectId, parentId, validName);

    const now = new Date().toISOString();
    const entry: FileEntry = {
      id: crypto.randomUUID(),
      projectId,
      parentId,
      name: validName,
      type: FileEntryType.Folder,
      content: '', // Invariant #2: folders are content-less
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    await fileRepository.upsert(entry);

    const store = useFileStore.getState();
    store.addEntry(entry);

    return entry;
  },

  /**
   * Rename a file or folder.
   *
   * Invariants enforced:
   *   #4/#8: name uniqueness (case-insensitive) in same scope
   *   #7: filename validation
   */
  async renameEntry(id: string, name: string): Promise<void> {
    const validName = validateName(name);

    const existing = await fileRepository.findById(id);
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'File entry not found.');
    }
    assertNotDeleted(existing);

    // Case-insensitive no-op check
    if (existing.name.toLowerCase() === validName.toLowerCase() && existing.name === validName) {
      return;
    }

    // Check uniqueness (exclude self)
    await assertNameUnique(existing.projectId, existing.parentId, validName, id);

    const updatedAt = new Date().toISOString();
    const updated: FileEntry = { ...existing, name: validName, updatedAt };

    await fileRepository.upsert(updated);
    useFileStore.getState().updateEntry(id, { name: validName, updatedAt });
  },

  /**
   * Update file content.
   * Invariant #2: rejects folders (folders cannot have content).
   */
  async updateFileContent(id: string, content: string): Promise<void> {
    const existing = await fileRepository.findById(id);
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'File not found.');
    }
    assertNotDeleted(existing);

    if (existing.type === FileEntryType.Folder) {
      throw new DomainError('VALIDATION_ERROR', 'Cannot set content on a folder.');
    }

    const updatedAt = new Date().toISOString();
    const updated: FileEntry = { ...existing, content, updatedAt };

    await fileRepository.upsert(updated);
    useFileStore.getState().updateEntry(id, { content, updatedAt });
  },

  /**
   * Soft-delete a file or folder.
   * Invariant #3: folder deletion cascades to all children.
   */
  async deleteEntry(id: string): Promise<void> {
    const existing = await fileRepository.findById(id);
    if (!existing) return;

    const now = new Date().toISOString();

    // Cascade: if folder, soft-delete all children first
    if (existing.type === FileEntryType.Folder) {
      const children = await fileRepository.findChildren(id);
      for (const child of children) {
        const deletedChild: FileEntry = {
          ...child,
          isDeleted: true,
          updatedAt: now,
        };
        await fileRepository.upsert(deletedChild);
      }
      // Remove children from store
      useFileStore.getState().removeChildren(id);
    }

    // Soft-delete the entry itself
    const updated: FileEntry = {
      ...existing,
      isDeleted: true,
      updatedAt: now,
    };

    await fileRepository.upsert(updated);
    useFileStore.getState().removeEntry(id);
  },

  /**
   * Get the currently active file entry.
   */
  getActiveFile(): FileEntry | null {
    const { entries, activeFileId } = useFileStore.getState();
    if (!activeFileId) return null;
    return entries.find((e) => e.id === activeFileId) ?? null;
  },
};
