/**
 * AI OS — Note Editor
 *
 * Plain textarea editor for the active note.
 * No markdown preview — Sprint 2 scope is architecture validation only.
 *
 * Features:
 *   - Inline title editing (calls onRename on blur)
 *   - Plain textarea for content (monospace font)
 *   - Save status indicator: "Saving…" / "Saved ✓"
 *   - Calls onContentChange on every keystroke (parent handles debounce)
 *
 * @see Sprint 2 — Notes Workspace
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Note } from '@core/db/types';

// ─── Props ───────────────────────────────────────────────────────────

interface NoteEditorProps {
  note: Note;
  isDirty: boolean;
  isSaving: boolean;
  onContentChange: (id: string, content: string) => void;
  onRename: (id: string, title: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────

export default function NoteEditor({ note, isDirty, isSaving, onContentChange, onRename }: NoteEditorProps) {
  // Local content state — controlled by this component, synced on note switch
  const [content, setContent] = useState(note.content);
  const [title, setTitle] = useState(note.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevNoteIdRef = useRef(note.id);

  // ─── Sync when note changes ────────────────────────────────────

  useEffect(() => {
    if (note.id !== prevNoteIdRef.current) {
      setContent(note.content);
      setTitle(note.title);
      prevNoteIdRef.current = note.id;
    }
  }, [note.id, note.content, note.title]);

  // Also sync title if it changes externally (e.g., from context menu rename)
  useEffect(() => {
    if (!isEditingTitle) {
      setTitle(note.title);
    }
  }, [note.title, isEditingTitle]);

  // ─── Content Change ────────────────────────────────────────────

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onContentChange(note.id, newContent);
  }, [note.id, onContentChange]);

  // ─── Title Editing ─────────────────────────────────────────────

  const startTitleEdit = () => {
    setIsEditingTitle(true);
    setTitle(note.title);
  };

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const finishTitleEdit = () => {
    setIsEditingTitle(false);
    if (title.trim() && title.trim() !== note.title) {
      onRename(note.id, title);
    } else {
      setTitle(note.title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishTitleEdit();
      // Focus the textarea after renaming
      textareaRef.current?.focus();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTitle(note.title);
    }
  };

  // ─── Save Status ───────────────────────────────────────────────

  const statusText = isSaving ? 'Saving…' : isDirty ? 'Saving…' : 'Saved ✓';
  const statusClass = isSaving || isDirty ? 'notes-status-saving' : 'notes-status-saved';

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="notes-editor">
      {/* Title */}
      <div className="notes-editor-title-row">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={finishTitleEdit}
            onKeyDown={handleTitleKeyDown}
            maxLength={200}
            className="notes-editor-title-input"
          />
        ) : (
          <h2
            className="notes-editor-title"
            onClick={startTitleEdit}
            title="Click to rename"
          >
            {note.title}
          </h2>
        )}

        {/* Save status */}
        <span className={`notes-status ${statusClass}`}>
          {statusText}
        </span>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        className="notes-editor-textarea"
        placeholder="Start writing…"
        spellCheck={false}
      />
    </div>
  );
}
