/**
 * AI OS — Notes Empty State
 *
 * Two variants:
 *   1. "no-project" — No project selected. No create button. No note loading.
 *   2. "no-note"    — Project active but no note selected (or no notes exist).
 *
 * "No project = no notes" is explicitly enforced here:
 * the UI does not render a create button when no project is active.
 *
 * @see Sprint 2 — Notes Workspace
 */

// ─── Props ───────────────────────────────────────────────────────────

interface EmptyStateProps {
  type: 'no-project' | 'no-note';
  noteCount?: number;
  onCreateNote?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────

export default function EmptyState({ type, noteCount = 0, onCreateNote }: EmptyStateProps) {
  if (type === 'no-project') {
    return (
      <div className="notes-empty-state">
        <div className="notes-empty-icon">📁</div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
          No project selected
        </p>
        <p className="text-xs text-[var(--color-text-muted)] max-w-[240px] leading-relaxed">
          Select a project from the sidebar to view and create notes.
        </p>
      </div>
    );
  }

  // no-note variant
  if (noteCount === 0) {
    return (
      <div className="notes-empty-state">
        <div className="notes-empty-icon">📝</div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
          No notes yet
        </p>
        <p className="text-xs text-[var(--color-text-muted)] max-w-[240px] leading-relaxed mb-4">
          Create your first note to get started.
        </p>
        {onCreateNote && (
          <button
            onClick={onCreateNote}
            className="
              px-4 py-2 rounded-lg text-xs font-medium
              bg-primary/20 border border-primary/30
              hover:bg-primary/30 cursor-pointer
              transition-all duration-200
            "
          >
            + New Note
          </button>
        )}
      </div>
    );
  }

  // Notes exist but none selected
  return (
    <div className="notes-empty-state">
      <div className="notes-empty-icon" style={{ opacity: 0.5 }}>📄</div>
      <p className="text-sm text-[var(--color-text-muted)]">
        Select a note to start editing
      </p>
    </div>
  );
}
