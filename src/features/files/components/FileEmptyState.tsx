/**
 * AI OS — File Empty State
 *
 * Two variants:
 *   1. "no-project" — No project selected. No create button.
 *   2. "no-file"    — Project active but no file selected (or no files exist).
 *
 * @see EmptyState (Notes) — same pattern
 * @see Sprint 4 — Files Workspace
 */

// ─── Props ───────────────────────────────────────────────────────────

interface FileEmptyStateProps {
  type: 'no-project' | 'no-file';
  entryCount?: number;
  onCreateFile?: () => void;
  onCreateFolder?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────

export default function FileEmptyState({
  type,
  entryCount = 0,
  onCreateFile,
  onCreateFolder,
}: FileEmptyStateProps) {
  if (type === 'no-project') {
    return (
      <div className="files-empty-state">
        <div className="files-empty-icon">📁</div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
          No project selected
        </p>
        <p className="text-xs text-[var(--color-text-muted)] max-w-[240px] leading-relaxed">
          Select a project from the sidebar to view and create files.
        </p>
      </div>
    );
  }

  // no-file variant
  if (entryCount === 0) {
    return (
      <div className="files-empty-state">
        <div className="files-empty-icon">📂</div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
          No files yet
        </p>
        <p className="text-xs text-[var(--color-text-muted)] max-w-[240px] leading-relaxed mb-4">
          Create your first file or folder to get started.
        </p>
        <div className="flex items-center gap-2">
          {onCreateFile && (
            <button
              onClick={onCreateFile}
              className="
                px-4 py-2 rounded-lg text-xs font-medium
                bg-primary/20 border border-primary/30
                hover:bg-primary/30 cursor-pointer
                transition-all duration-200
              "
            >
              + New File
            </button>
          )}
          {onCreateFolder && (
            <button
              onClick={onCreateFolder}
              className="
                px-4 py-2 rounded-lg text-xs font-medium
                glass glass-hover cursor-pointer
                transition-all duration-200
              "
            >
              + New Folder
            </button>
          )}
        </div>
      </div>
    );
  }

  // Files exist but none selected
  return (
    <div className="files-empty-state">
      <div className="files-empty-icon" style={{ opacity: 0.5 }}>📄</div>
      <p className="text-sm text-[var(--color-text-muted)]">
        Select a file to edit
      </p>
    </div>
  );
}
