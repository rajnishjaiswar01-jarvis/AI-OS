/**
 * AI OS — File Store
 *
 * Pure Zustand state container for file data.
 * NO side effects. NO Dexie access. NO API calls.
 * All mutations are called by fileService after successful persistence.
 *
 * Three distinct pieces of state:
 *   - activeFileId:    what am I editing?
 *   - currentFolderId: where am I creating/viewing?
 *   - expandedFolders: what is visually expanded in the tree?
 *
 * @see noteStore.ts, taskStore.ts — same pattern
 * @see ADR-010 — Single-Level Folder Hierarchy
 */

import { create } from 'zustand';
import type { FileEntry } from '@core/db/types';

// ─── Store Interface ─────────────────────────────────────────────────

interface FileState {
  /** All entries for the active project (non-deleted) */
  entries: FileEntry[];
  /** Currently selected file ID for editing (null = no file selected) */
  activeFileId: string | null;
  /** Current folder context for creation (null = root) */
  currentFolderId: string | null;
  /** Set of folder IDs that are visually expanded in the tree */
  expandedFolders: Set<string>;

  // Pure mutations (called by fileService, NEVER directly by components)
  setEntries: (entries: FileEntry[]) => void;
  setActiveFile: (id: string | null) => void;
  setCurrentFolder: (id: string | null) => void;
  addEntry: (entry: FileEntry) => void;
  updateEntry: (id: string, updates: Partial<FileEntry>) => void;
  removeEntry: (id: string) => void;
  removeChildren: (parentId: string) => void;
  toggleFolder: (id: string) => void;
}

// ─── Store ───────────────────────────────────────────────────────────

export const useFileStore = create<FileState>((set) => ({
  entries: [],
  activeFileId: null,
  currentFolderId: null,
  expandedFolders: new Set(),

  setEntries: (entries: FileEntry[]) => set({ entries }),

  setActiveFile: (id: string | null) => set({ activeFileId: id }),

  setCurrentFolder: (id: string | null) => set({ currentFolderId: id }),

  addEntry: (entry: FileEntry) =>
    set((state) => ({
      entries: [...state.entries, entry],
    })),

  updateEntry: (id: string, updates: Partial<FileEntry>) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),

  removeEntry: (id: string) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
      activeFileId: state.activeFileId === id ? null : state.activeFileId,
      currentFolderId: state.currentFolderId === id ? null : state.currentFolderId,
    })),

  removeChildren: (parentId: string) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.parentId !== parentId),
      // If the active file was a child, clear it
      activeFileId:
        state.entries.find((e) => e.id === state.activeFileId)?.parentId === parentId
          ? null
          : state.activeFileId,
    })),

  toggleFolder: (id: string) =>
    set((state) => {
      const next = new Set(state.expandedFolders);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { expandedFolders: next };
    }),
}));

/**
 * Reset the file store to its initial state. Primarily for testing.
 * @internal
 */
export function _resetFileStoreForTests(): void {
  useFileStore.setState({
    entries: [],
    activeFileId: null,
    currentFolderId: null,
    expandedFolders: new Set(),
  });
}
