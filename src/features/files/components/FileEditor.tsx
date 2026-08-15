/**
 * AI OS — File Editor
 *
 * Right pane for viewing and editing the selected file.
 * Shows filename breadcrumb + plain text editor.
 *
 * This component is PRESENTATIONAL — it does not call fileService directly.
 * Content changes are reported to FilesPanel via onContentChange callback.
 *
 * Autosave:
 *   - Content changes are reported to the parent on every keystroke.
 *   - The parent (FilesPanel) owns the 500ms debounce timer.
 *   - This component does NOT debounce or throttle.
 *
 * Rename:
 *   - Click filename → edit → blur/Enter → onRename callback.
 *   - Same pattern as TaskDetail.
 *
 * @see NoteEditor — same architectural pattern
 * @see Sprint 4 — Files Workspace
 */

import { useState, useEffect, useRef } from 'react';
import type { FileEntry } from '@core/db/types';

// ─── Props ───────────────────────────────────────────────────────────

interface FileEditorProps {
  file: FileEntry;
  parentFolder: FileEntry | null;
  isDirty: boolean;
  isSaving: boolean;
  onContentChange: (id: string, content: string) => void;
  onRename: (id: string, name: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────

export default function FileEditor({
  file,
  parentFolder,
  isDirty,
  isSaving,
  onContentChange,
  onRename,
}: FileEditorProps) {
  // Local state — controlled by this component, synced on file switch
  const [content, setContent] = useState(file.content);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(file.name);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevFileIdRef = useRef(file.id);

  // ─── Sync when file changes ────────────────────────────────────

  useEffect(() => {
    if (file.id !== prevFileIdRef.current) {
      setContent(file.content);
      setIsEditingName(false);
      prevFileIdRef.current = file.id;
    }
  }, [file.id, file.content]);

  // Sync content if it changes externally (not while user is editing)
  useEffect(() => {
    if (textareaRef.current !== document.activeElement) {
      setContent(file.content);
    }
  }, [file.content]);

  // Sync name if it changes externally (e.g., from context menu rename)
  useEffect(() => {
    if (!isEditingName) {
      setEditName(file.name);
    }
  }, [file.name, isEditingName]);

  // ─── Content Editing ──────────────────────────────────────────

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onContentChange(file.id, newContent);
  };

  // ─── Name Editing (blur/Enter save) ───────────────────────────

  const startNameEdit = () => {
    setIsEditingName(true);
    setEditName(file.name);
  };

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const finishNameEdit = () => {
    setIsEditingName(false);
    if (editName.trim() && editName.trim() !== file.name) {
      onRename(file.id, editName.trim());
    } else {
      setEditName(file.name);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishNameEdit();
      textareaRef.current?.focus();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      setEditName(file.name);
    }
  };

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="files-editor">
      {/* Header: breadcrumb + save status */}
      <div className="files-editor-header">
        <div className="files-editor-breadcrumb">
          {parentFolder && (
            <>
              <span className="files-editor-breadcrumb-parent">
                {parentFolder.name}
              </span>
              <span className="files-editor-breadcrumb-sep">/</span>
            </>
          )}
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={finishNameEdit}
              onKeyDown={handleNameKeyDown}
              maxLength={200}
              className="files-editor-name-input"
            />
          ) : (
            <span
              className="files-editor-name"
              onClick={startNameEdit}
              title="Click to rename"
            >
              {file.name}
            </span>
          )}
        </div>

        {/* Save status */}
        <span className="files-editor-status">
          {isSaving ? 'Saving…' : isDirty ? 'Unsaved' : 'Saved'}
        </span>
      </div>

      {/* Text Editor */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        className="files-editor-textarea"
        placeholder="Start typing…"
        spellCheck={false}
      />
    </div>
  );
}
