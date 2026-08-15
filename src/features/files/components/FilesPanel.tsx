/**
 * AI OS — Files Panel
 *
 * Main container for the Files workspace module.
 * Split layout: tree sidebar + editor pane.
 *
 * Responsibilities:
 *   - Subscribe to projectStore for active project
 *   - Load/clear files when project changes
 *   - OWN all service mutations (FileTree and FileEditor are presentational)
 *   - OWN the 500ms autosave debounce for file content
 *   - Flush pending saves on unmount / project switch / file switch / minimize
 *   - Handle create file, create folder, rename, delete, select
 *   - Enforce "no project = no files" behavior
 *   - Use currentFolderId for new file creation context
 *
 * Architecture:
 *   User types → FileEditor → FilesPanel (debounce) → fileService.updateFileContent()
 *   User clicks → FileTree → FilesPanel → fileService.*()
 *
 * @see NotesPanel — same autosave pattern
 * @see ADR-010 — Single-Level Folder Hierarchy
 * @see Sprint 4 — Files Workspace
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useProjectStore } from '@features/projects/projectStore';
import { useFileStore } from '../fileStore';
import { fileService } from '../fileService';
import { useWindowStore } from '@shell/windowStore';
import { FileEntryType } from '@core/db/types';
import FileTree from './FileTree';
import FileEditor from './FileEditor';
import FileEmptyState from './FileEmptyState';

// ─── Constants ───────────────────────────────────────────────────────

const AUTOSAVE_DELAY = 500;

// ─── Component ───────────────────────────────────────────────────────

export default function FilesPanel() {
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const { entries, activeFileId, currentFolderId, expandedFolders } = useFileStore();
  const activeFile = entries.find((e) => e.id === activeFileId && e.type === FileEntryType.File) ?? null;
  const parentFolder = activeFile?.parentId
    ? entries.find((e) => e.id === activeFile.parentId) ?? null
    : null;

  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      setIsSaving(true);
      try {
        await fileService.updateFileContent(id, content);
      } finally {
        setIsSaving(false);
        setIsDirty(false);
      }
    }
  }, []);

  /** Schedule a debounced content save. Called by FileEditor on every keystroke. */
  const scheduleContentSave = useCallback((id: string, content: string) => {
    pendingSaveRef.current = { id, content };
    setIsDirty(true);

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      autosaveTimerRef.current = null;
      if (pendingSaveRef.current) {
        const pending = pendingSaveRef.current;
        pendingSaveRef.current = null;
        setIsSaving(true);
        try {
          await fileService.updateFileContent(pending.id, pending.content);
        } finally {
          setIsSaving(false);
          setIsDirty(false);
        }
      }
    }, AUTOSAVE_DELAY);
  }, []);

  // ─── Project Switch: Load/Clear Files ──────────────────────────

  useEffect(() => {
    flushPendingSave();

    if (activeProjectId) {
      fileService.loadFiles(activeProjectId);
    } else {
      fileService.clearFiles();
    }
  }, [activeProjectId, flushPendingSave]);

  // ─── Lifecycle Guards: flush on tab close / visibility change ──

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingSaveRef.current) {
        const { id, content } = pendingSaveRef.current;
        pendingSaveRef.current = null;
        fileService.updateFileContent(id, content);
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

  // ─── Window Minimize Detection ─────────────────────────────────

  const windowsRef = useRef(useWindowStore.getState().windows);

  useEffect(() => {
    const unsub = useWindowStore.subscribe((state) => {
      const prevWindows = windowsRef.current;
      windowsRef.current = state.windows;

      for (const win of state.windows) {
        if (win.appId !== 'files') continue;
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
        fileService.updateFileContent(id, content);
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

  // ─── Handlers (FilesPanel OWNS all service mutations) ──────────

  const handleCreateFile = async () => {
    if (!activeProjectId) return;
    try {
      await fileService.createFile(activeProjectId, 'Untitled', currentFolderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create file.');
    }
  };

  const handleCreateFolder = async () => {
    if (!activeProjectId) return;
    try {
      await fileService.createFolder(activeProjectId, 'New Folder');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder.');
    }
  };

  const handleSelectFile = async (id: string) => {
    await flushPendingSave();
    useFileStore.getState().setActiveFile(id);
  };

  const handleSelectFolder = (id: string) => {
    const store = useFileStore.getState();
    // Toggle currentFolderId: if clicking the already-current folder, go back to root
    store.setCurrentFolder(store.currentFolderId === id ? null : id);
  };

  const handleToggleFolder = (id: string) => {
    useFileStore.getState().toggleFolder(id);
  };

  const handleRenameEntry = async (id: string, name: string) => {
    try {
      await fileService.renameEntry(id, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename.');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      // Clear pending save if deleting the file being edited
      if (pendingSaveRef.current?.id === id) {
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
          autosaveTimerRef.current = null;
        }
        pendingSaveRef.current = null;
        setIsDirty(false);
      }
      await fileService.deleteEntry(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  // ─── Render ────────────────────────────────────────────────────

  if (!activeProjectId) {
    return <FileEmptyState type="no-project" />;
  }

  return (
    <div className="files-panel">
      {/* ─── Sidebar ──────────────────────────────────────────── */}
      <div className="files-sidebar">
        {/* Header / Toolbar */}
        <div className="files-sidebar-header">
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">
            Files
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCreateFile}
              className="files-toolbar-btn"
              title="New File"
            >
              📄
            </button>
            <button
              onClick={handleCreateFolder}
              className="files-toolbar-btn"
              title="New Folder"
            >
              📁
            </button>
          </div>
        </div>

        {/* File Tree */}
        <FileTree
          entries={entries}
          activeFileId={activeFileId}
          currentFolderId={currentFolderId}
          expandedFolders={expandedFolders}
          onSelectFile={handleSelectFile}
          onSelectFolder={handleSelectFolder}
          onRename={handleRenameEntry}
          onDelete={handleDeleteEntry}
          onToggleFolder={handleToggleFolder}
        />
      </div>

      {/* ─── Divider ──────────────────────────────────────────── */}
      <div className="files-divider" />

      {/* ─── Editor Pane ──────────────────────────────────────── */}
      <div className="files-editor-pane">
        {/* Error Banner */}
        {error && (
          <div className="files-error">
            <span className="text-xs text-red-400">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400/60 hover:text-red-400 cursor-pointer text-xs ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {activeFile ? (
          <FileEditor
            file={activeFile}
            parentFolder={parentFolder}
            isDirty={isDirty}
            isSaving={isSaving}
            onContentChange={scheduleContentSave}
            onRename={handleRenameEntry}
          />
        ) : (
          <FileEmptyState
            type="no-file"
            entryCount={entries.length}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
          />
        )}
      </div>
    </div>
  );
}
