# AI OS — Interaction Model

> **Document Type:** UX Architecture  
> **Phase:** 4A  
> **Status:** Active  
> **Last Updated:** 2026-07-11  
> **Depends On:** [NAVIGATION_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/01_NAVIGATION_ARCHITECTURE.md), [LAYOUT_SYSTEM.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/02_LAYOUT_SYSTEM.md)  
> **Audience:** Engineers implementing UI components, interactions, and feedback systems

This document defines how users interact with UI elements in AI OS — what happens when they click, type, drag, and select. It bridges the gap between navigation (where users go) and components (what users see).

---

## 1. Input Methods

AI OS supports three input methods, in priority order:

| Method | Priority | Status |
|---|---|---|
| **Mouse** | Primary | Full support. All interactions optimized for mouse. |
| **Keyboard** | Primary | Full support. Every mouse action has a keyboard equivalent (UX Principle 2). |
| **Touch** | Tertiary | Degraded support. Basic tap/scroll works. No gestures. |

### Mouse Capabilities Assumed

- Hover (for tooltips, hover states, previews)
- Left click
- Right click (context menus)
- Double click
- Scroll wheel
- Drag (mousedown → mousemove → mouseup)

### Touch Limitations

Touch devices lack hover. Interactions designed for hover discovery (tooltips, hover previews, hover-reveal actions) must have alternative access paths:

| Hover Interaction | Touch Alternative |
|---|---|
| Tooltip on hover | Long press shows tooltip |
| Actions revealed on hover | Actions always visible (compact), or accessible via context menu |
| Hover preview | Tap to select, preview in detail pane |

---

## 2. Click Behavior

### Single Click

| Context | Behavior |
|---|---|
| Dock icon | Open app or bring to front (see [NAVIGATION_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/01_NAVIGATION_ARCHITECTURE.md) Section 2) |
| File in file tree | Select the file (highlight). Does not open. |
| Folder in file tree | Toggle expand/collapse |
| Note in note list | Open note in editor |
| Task in task list | Toggle complete/incomplete |
| Button | Trigger the button's action |
| Input field | Focus the input. Place cursor. |
| Panel background | Focus the panel (bring to front) |
| Desktop background | Remove panel focus |

### Double Click

| Context | Behavior |
|---|---|
| File in file tree | Open the file (in Notes for `.md`/`.txt`, preview for others) |
| Panel title bar | Toggle maximize/restore |
| Text in input/editor | Select word |
| All other contexts | No action (do not assign double-click to anything else — users double-click accidentally) |

### Right Click (Context Menu)

Right-click opens a context menu appropriate to the clicked element.

| Context | Menu Items |
|---|---|
| File in file tree | Open, Rename, Delete, Copy Path |
| Folder in file tree | New File, New Folder, Rename, Delete |
| Note in note list | Open, Rename, Delete |
| Task in task list | Edit, Delete, Toggle Complete |
| Panel title bar | Minimize, Maximize, Close |
| Dock icon (open app) | Close, Minimize |
| Dock icon (closed app) | Open |
| Desktop background | (No menu for v0.3.0. Future: New File, Change Wallpaper.) |

**Context menu design rules:**
- Maximum 7 items per menu. If more are needed, use submenus or reconsider the grouping.
- Destructive actions (Delete) are last, visually separated, and in a warning color.
- Keyboard shortcuts are shown next to their menu items.
- Context menus close on: click outside, Escape key, selecting an item.

---

## 3. Drag & Drop

### What Is Draggable

| Element | Drag Behavior | Drop Target |
|---|---|---|
| **Panels** (via title bar) | Move panel on desktop | Content area (free position) |
| **Files** (in file tree) | Rearrange file position in tree | Folder in file tree |
| **Folders** (in file tree) | Move folder (and children) | Another folder, or root |

### What Is NOT Draggable in v0.3.0

| Element | Reason |
|---|---|
| Tasks | Task ordering is by creation date / status. Manual ordering is v0.4+. |
| Notes | Notes are files — drag the file, not the note entry. |
| Dock icons | Fixed app order for v0.3.0. Reorderable dock is v0.4+. |
| Chat messages | No use case. |

### Drag Visual Feedback

| Phase | Visual |
|---|---|
| **Drag start** (mousedown + 5px movement) | Ghost preview of the dragged element at 50% opacity, attached to cursor |
| **Dragging** | Ghost follows cursor. Valid drop targets highlight (blue/accent border). |
| **Over valid drop target** | Drop target shows insertion indicator (line above/below for lists, border highlight for folders) |
| **Over invalid drop target** | Cursor shows `not-allowed`. No visual change on target. |
| **Drop** | Ghost disappears. Element moves to new position with a brief settle animation (100ms). |
| **Cancel** (Escape or drop outside) | Ghost returns to original position with a snap-back animation (150ms). |

### Drag Constraints

- **Minimum drag distance:** 5px from mousedown position before drag activates. Prevents accidental drags when clicking.
- **Scroll during drag:** File tree auto-scrolls when dragging near its edges (top/bottom 40px).
- **Cross-panel drag:** Not supported in v0.3.0. Files cannot be dragged from one panel to another. Interactions stay within a single panel.
- **Accessibility:** All drag operations must have a keyboard alternative (Cut/Paste via keyboard, or Move via context menu).

---

## 4. Selection Model

### Single Selection (Default)

Most contexts use single selection:

| Context | Selection Behavior |
|---|---|
| File tree | Click selects one file/folder. Previous selection deselects. |
| Note list | Click selects one note. Previous selection deselects. |
| Task list | Click toggles the clicked task. No persistent selection. |

### Multi-Selection

Multi-selection is available in the file tree and task list:

| Modifier | Behavior |
|---|---|
| `Ctrl+Click` | Toggle selection on the clicked item without deselecting others |
| `Shift+Click` | Select range from last selected item to clicked item |
| `Ctrl+A` | Select all visible items in the current list |

### Selection Visual

| State | Visual |
|---|---|
| **Unselected** | Default background |
| **Hovered** | `var(--color-surface-hover)` background |
| **Selected** | `var(--color-surface-active)` background with accent left border (2px) |
| **Selected + Focused** | Same as selected, with focus ring |
| **Multi-selected** | Each selected item shows the selected state. Count badge shown near toolbar. |

### Selection Actions

When one or more items are selected, available actions appear in:
1. **Toolbar:** Bulk actions (Delete Selected, Move Selected) appear/enable.
2. **Context menu:** Actions apply to all selected items.
3. **Keyboard:** `Delete` key triggers delete for selection. `Enter` opens/activates selection.

---

## 5. Editing Model

AI OS uses three editing patterns. Each has a defined use case.

### 5.1 Inline Editing

**Use case:** Renaming files, folders, tasks, and workspaces.

**Trigger:** Double-click on the name text, or press `F2` with item selected.

**Behavior:**
```text
Name text → transforms into input field
    → Input pre-filled with current name, text fully selected
    → Enter: save + exit edit mode
    → Escape: cancel + exit edit mode (restore original)
    → Click outside: save + exit edit mode
    → Tab: save + move to next editable item (if in a list)
```

**Rules:**
- Inline edit does not change the item's position in the list during editing.
- Validation happens on save (not on each keystroke). Invalid names show an inline error below the input.
- Empty names are not allowed. Submitting empty reverts to the original name.

### 5.2 Dedicated Editor

**Use case:** Note content editing.

**Trigger:** Opening a note (click in note list or double-click in file tree).

**Behavior:**
- Note opens in the Notes panel's editor area.
- Full editing interface with formatting toolbar.
- Auto-save with debounce (500ms after last keystroke).
- Manual save via `Ctrl+S` (saves immediately, resets debounce).
- Save status indicator in status bar: "Saved" / "Saving..." / "Unsaved changes."

### 5.3 Form Editing

**Use case:** Settings, workspace configuration, AI provider setup.

**Trigger:** Opening the relevant settings panel/section.

**Behavior:**
- Settings changes apply immediately (no "Save" button for individual settings).
- Toggle switches, dropdowns, and text inputs update the setting on change.
- Dangerous settings (clear data, reset workspace) require explicit confirmation.

---

## 6. Confirmation & Destructive Actions

### What Requires Confirmation

| Action | Confirmation | Type |
|---|---|---|
| Delete file | Yes | Modal dialog |
| Delete folder (with children) | Yes — shows count of affected files | Modal dialog |
| Delete workspace | Yes — requires typing workspace name | Modal dialog with text input |
| Delete task | No — task deletion is undoable (within session) | Immediate with undo toast |
| Clear chat history | Yes | Modal dialog |
| Change AI provider | No — settings are reversible | Immediate |
| Theme toggle | No — instant, reversible | Immediate |

### Confirmation Dialog Structure

```text
┌──────────────────────────────────────┐
│  ⚠️  Delete "filename.md"?           │
│                                       │
│  This action cannot be undone.        │
│  The file and its contents will be    │
│  permanently removed.                 │
│                                       │
│           [Cancel]  [Delete]          │
│                                       │
└──────────────────────────────────────┘
```

**Rules:**
- Cancel is on the left. Destructive action is on the right.
- Destructive button uses warning/danger styling (red tint).
- Cancel is the default focused button (pressing Enter = Cancel, not Delete).
- Escape dismisses the dialog (same as Cancel).
- No checkbox "Don't ask again." Each confirmation is shown every time.

### Undo Pattern (Non-Destructive Deletion)

For lightweight deletions (tasks), use an undo toast instead of a confirmation dialog:

```text
┌─────────────────────────────────────────┐
│  ✓ Task deleted            [Undo]       │
└─────────────────────────────────────────┘
```

- Toast visible for 5 seconds.
- Undo reverts the deletion.
- After 5 seconds, deletion is permanent.
- Maximum 1 undo toast visible at a time.

---

## 7. Feedback Model

Every user action must produce visible feedback. Silent actions are disorienting.

### 7.1 Loading States

| Context | Loading Indicator |
|---|---|
| Panel opening | Skeleton placeholder in content area |
| File tree loading | Skeleton lines (3–5 placeholder items) |
| Note loading | Skeleton block in editor area |
| AI response pending | Typing indicator (animated dots) in chat |
| Workspace switching | Brief overlay with spinner (< 100ms target, so rarely seen) |

**Rule:** If an operation is expected to complete within 100ms (per performance budget), no loading indicator is shown. Indicators appear only for operations that may exceed 200ms.

### 7.2 Success States

| Context | Success Indicator |
|---|---|
| File created | File appears in tree with brief highlight animation (200ms green flash) |
| Note saved | Status bar shows "Saved ✓" (fades after 2s) |
| Task completed | Strikethrough + checkmark animation (200ms) |
| Settings changed | Immediate visual feedback (theme switches, input updates) |
| Workspace created | Switches to new workspace, clean desktop |

### 7.3 Error States

| Context | Error Indicator |
|---|---|
| File operation failed | Toast notification: "Failed to create file. [Retry]" |
| Note save failed | Status bar shows "Save failed ✗" in error color. Persists until resolved. |
| AI request failed | Error message in chat with [Retry] button |
| IndexedDB quota exceeded | Modal warning: "Storage is full. Delete files or clear data." |
| Invalid input | Inline error below the input field. Red border on the input. |

**Error rules:**
- Never show raw error messages or stack traces to the user.
- Every error has a human-readable message explaining what happened.
- Recoverable errors show a retry action.
- Critical errors (data corruption, quota exceeded) use modal dialogs.
- Non-critical errors use toast notifications (auto-dismiss after 5s) or inline messages.

### 7.4 Empty States

Every list and content area must have a meaningful empty state.

| Context | Empty State Content |
|---|---|
| No workspaces | "Create your first workspace to get started." + [Create Workspace] button |
| No files in workspace | "This workspace is empty. Create a file to begin." + [New File] button |
| No notes | "No notes yet. Create a note to start writing." + [New Note] button |
| No tasks | "No tasks. Add a task to track your work." + [Add Task] button |
| No chat messages | "Start a conversation." (with AI provider status indicator) |
| Search with no results | "No results for '{query}'." (no action button — the user should refine their query) |

**Empty state rules:**
- Always include one actionable button (except search no-results).
- Empty state text is helpful, not condescending.
- Use muted text color. Do not show sad face icons or illustrations for v0.3.0.

---

## 8. Context Menus

### Triggering

| Trigger | Platform |
|---|---|
| Right-click | All platforms |
| `Shift+F10` | Keyboard alternative |
| Long press (500ms) | Touch devices |

### Design

```text
┌───────────────────────────┐
│  📂 Open                   │
│  ✏️  Rename            F2  │
│  📋 Copy Path              │
│  ─────────────────────────│
│  🗑️  Delete         Delete │
└───────────────────────────┘
```

**Rules:**
- Maximum 7 items per menu.
- Keyboard shortcuts displayed right-aligned.
- Destructive items after a separator, at the bottom.
- Icons on the left (emoji for v0.3.0; custom icons in Phase 4B).
- Menus close on: item click, click outside, Escape, scroll.
- Menus are positioned to stay within viewport bounds. If near the right edge, open to the left. If near the bottom edge, open upward.

### Nested Menus

Not supported in v0.3.0. Keep context menus flat. If more than 7 actions are needed, reconsider which actions belong in the context menu vs. the toolbar.

---

## 9. Search Behavior

### Search Types

| Type | Scope | Trigger |
|---|---|---|
| **Global search** | All items in current workspace | `Ctrl+K` (Command Palette, v0.3.1+) |
| **Panel search** | Items within the current panel | `Ctrl+F` while panel is focused |

### Panel Search (v0.3.0)

Available in: Files panel, Tasks panel.

**Behavior:**
- A search input appears at the top of the panel's content area.
- Filtering is instant (as-you-type, no submit button).
- Results filter the existing list (non-matching items are hidden, not dimmed).
- Empty results show "No results for '{query}'" inline.
- `Escape` closes the search bar and restores the full list.
- Search is case-insensitive.
- Search matches against: file name (Files), task title (Tasks).

### Global Search / Command Palette (v0.3.1+)

Deferred. When implemented:
- `Ctrl+K` opens a centered command palette.
- Search across files, notes, tasks, settings, and commands.
- Results grouped by type.
- Arrow keys to navigate results, Enter to select.

---

## 10. Keyboard Shortcuts

For the complete keyboard shortcut reference — global, panel-level, inline edit, selection, context menu, and conflict resolution — see [KEYBOARD_SHORTCUTS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/05_KEYBOARD_SHORTCUTS.md). That document is the single source of truth for all shortcuts.

---

## 11. Interaction Rules Summary

| Rule | Rationale |
|---|---|
| Single click selects, double click opens | Desktop convention. Reduces accidental actions. |
| Right-click always shows a context menu | Predictable. Users expect right-click to work. |
| Inline editing over modals for rename | Minimize Modals principle. Faster, less disruptive. |
| Auto-save for notes | Prevents data loss. No "forgot to save" scenarios. |
| Confirmation for destructive actions only | Non-destructive actions should be instant. |
| Every action has visible feedback | Silent actions are confusing. |
| Empty states guide the user | Empty is an opportunity, not an error. |
| Context menus are flat (no submenus) | Simplicity. Submenus are hard on touch and slow with a mouse. |
| Search is instant, as-you-type | Fast feedback. No submit barrier. |
| 5px drag threshold | Prevents accidental drags from clicks. |

---

*This document defines user interactions. For where those interactions happen spatially, see [LAYOUT_SYSTEM.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/02_LAYOUT_SYSTEM.md). For accessibility constraints on these interactions, see [ACCESSIBILITY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/04_ACCESSIBILITY.md).*
