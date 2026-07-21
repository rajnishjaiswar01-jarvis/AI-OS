# AI OS — Keyboard Shortcuts

> **Document Type:** UX Reference  
> **Phase:** 4A  
> **Status:** Active  
> **Last Updated:** 2026-07-11  
> **Depends On:** [NAVIGATION_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/01_NAVIGATION_ARCHITECTURE.md), [INTERACTION_MODEL.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/03_INTERACTION_MODEL.md)  
> **Audience:** All engineers implementing keyboard interactions

This is the **single source of truth** for all keyboard shortcuts in AI OS. No other document should define shortcuts — they should reference this one.

---

## 1. Global Shortcuts

These work regardless of which panel is focused. Intercepted at the desktop (shell) level.

| Shortcut | Action | Notes |
|---|---|---|
| `Ctrl+1` through `Ctrl+6` | Open/focus app by dock position | Position 1 = leftmost dock icon |
| `Ctrl+W` | Close the focused panel | No effect if no panel is focused |
| `Ctrl+,` | Open Settings | Standard settings shortcut |
| `Ctrl+K` | Open Command Palette | v0.3.1+ — deferred |
| `Ctrl+Tab` | Cycle focus to next open panel | Z-order (bottom to top) |
| `Ctrl+Shift+Tab` | Cycle focus to previous open panel | Reverse z-order |
| `Escape` | Dismiss topmost dismissible element | Priority: modal → dropdown → context menu → panel search → defocus panel |
| `Ctrl+Shift+D` | Toggle Dev Panel | Development builds only |

---

## 2. Panel-Level Shortcuts

These work only when the specific panel is focused.

### Files Panel

| Shortcut | Action | Condition |
|---|---|---|
| `Ctrl+N` | New file | — |
| `Ctrl+Shift+N` | New folder | — |
| `F2` | Rename selected item | Item must be selected |
| `Delete` | Delete selected item | Shows confirmation dialog |
| `Ctrl+A` | Select all visible items | — |
| `Ctrl+F` | Open panel search | — |
| `Enter` | Open selected file | File must be selected |
| `Arrow Up/Down` | Navigate file list | — |
| `Arrow Right` | Expand selected folder | Folder must be collapsed |
| `Arrow Left` | Collapse selected folder | Folder must be expanded |
| `Arrow Left` (on file) | Move focus to parent folder | File is inside a folder |
| `Ctrl+X` | Cut selected item(s) | Keyboard alternative to drag |
| `Ctrl+V` | Paste cut item(s) into current folder | After Ctrl+X |

### Notes Panel

| Shortcut | Action | Condition |
|---|---|---|
| `Ctrl+S` | Force save | Auto-save is default; this saves immediately |
| `Ctrl+B` | Bold | Editor must be focused |
| `Ctrl+I` | Italic | Editor must be focused |
| `Ctrl+Shift+X` | Strikethrough | Editor must be focused |
| `Ctrl+Shift+1` through `Ctrl+Shift+3` | Heading 1–3 | Editor must be focused |
| `Ctrl+Z` | Undo | Editor must be focused |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo | Editor must be focused |
| `Tab` | Indent (in list) | Cursor at start of list item |
| `Shift+Tab` | Outdent (in list) | Cursor at start of list item |

### Tasks Panel

| Shortcut | Action | Condition |
|---|---|---|
| `Ctrl+N` | New task | — |
| `Space` | Toggle task complete/incomplete | Task must be selected |
| `F2` | Edit task title (inline) | Task must be selected |
| `Delete` | Delete task | Undo toast (5 seconds) |
| `Ctrl+A` | Select all tasks | — |
| `Ctrl+F` | Open panel search | — |
| `Arrow Up/Down` | Navigate task list | — |

### Chat Panel

| Shortcut | Action | Condition |
|---|---|---|
| `Enter` | Send message | Input must be focused |
| `Shift+Enter` | New line in message | Input must be focused |
| `Ctrl+Shift+Backspace` | Clear chat history | Shows confirmation |
| `Escape` | Stop AI generation | Only while AI is generating |

### Settings Panel

| Shortcut | Action | Condition |
|---|---|---|
| `Arrow Up/Down` | Navigate settings sections | — |
| `Enter/Space` | Toggle setting / open section | Setting focused |

---

## 3. Context Menu & Dialog Shortcuts

| Shortcut | Action | Context |
|---|---|---|
| `Shift+F10` | Open context menu | Any selected item (keyboard alternative to right-click) |
| `Arrow Up/Down` | Navigate menu items | Context menu open |
| `Enter` | Activate menu item | Menu item focused |
| `Escape` | Close context menu | Context menu open |
| `Escape` | Close modal (same as Cancel) | Modal open |
| `Tab` | Navigate dialog buttons | Modal open |

---

## 4. Inline Edit Shortcuts

| Shortcut | Action | Context |
|---|---|---|
| `F2` | Start inline edit | Item selected in file tree or task list |
| `Enter` | Save and exit edit mode | Inline edit active |
| `Escape` | Cancel and exit edit mode | Inline edit active |
| `Tab` | Save and move to next editable | Inline edit active (if applicable) |

---

## 5. Selection Shortcuts

| Shortcut | Action | Context |
|---|---|---|
| `Ctrl+Click` | Toggle item in multi-selection | File tree, task list |
| `Shift+Click` | Range select | File tree, task list |
| `Ctrl+A` | Select all visible items | File tree, task list |

---

## 6. Conflict Resolution Rules

When the same shortcut could mean different things:

1. **Global shortcuts always win** when no text input has focus.
2. **Panel shortcuts win** when the panel has focus and the shortcut is panel-specific.
3. **Browser defaults win** inside text inputs (e.g., `Ctrl+A` selects all text in an input, not all items in a list).
4. `Escape` follows a dismissal stack — always closes the topmost layer first: modal → dropdown → context menu → search bar → panel.

### Specific Conflicts

| Shortcut | Without Input Focus | With Input Focus |
|---|---|---|
| `Ctrl+A` | Select all items in list | Select all text in input |
| `Ctrl+N` | New file/task (panel-specific) | Browser default (new window) — intercepted and overridden |
| `Enter` | Open selected file / activate item | Submit form / send message |
| `Delete` | Delete selected item | Delete character in input |

---

## 7. Shortcut Discovery

Users must be able to discover shortcuts without reading documentation:

| Discovery Method | Implementation |
|---|---|
| **Tooltips** | Hover over any button → tooltip shows shortcut (e.g., "Close (Ctrl+W)") |
| **Context menus** | Shortcut displayed right-aligned next to each menu item |
| **Shortcut reference** | `Ctrl+/` or Help menu → shows all shortcuts (v0.3.1+) |

---

## 8. Reserved Shortcuts

These browser shortcuts must NOT be overridden:

| Shortcut | Browser Function | Reason |
|---|---|---|
| `Ctrl+T` | New tab | Core browser navigation |
| `Ctrl+L` | Focus address bar | Core browser navigation |
| `Ctrl+R` / `F5` | Reload page | Users expect this to work |
| `Ctrl+Shift+I` / `F12` | Dev tools | Development access |
| `Alt+F4` | Close window | OS-level shortcut |
| `Ctrl+P` | Print | Browser standard |

---

*This is the single source of truth for all keyboard shortcuts. [NAVIGATION_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/01_NAVIGATION_ARCHITECTURE.md) and [INTERACTION_MODEL.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/03_INTERACTION_MODEL.md) reference this document for shortcut details.*
