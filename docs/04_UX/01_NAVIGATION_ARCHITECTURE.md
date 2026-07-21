# AI OS — Navigation Architecture

> **Document Type:** UX Architecture  
> **Phase:** 4A  
> **Status:** Active  
> **Last Updated:** 2026-07-11  
> **Depends On:** [UX_PRINCIPLES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/00_UX_PRINCIPLES.md), [SYSTEM_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/SYSTEM_ARCHITECTURE.md)  
> **Audience:** Engineers and designers implementing navigation, panels, and workspace switching

This document defines how users move through AI OS — how they get to features, switch contexts, and find their way back. It answers: "Where am I? How do I get where I want to go? How do I get back?"

---

## 1. Navigation Philosophy

AI OS does not use traditional web navigation (pages, URLs, browser back/forward). It uses a **spatial desktop metaphor** where:

- **Apps are panels on a desktop.** Opening an app places a window on the screen. Closing it removes it.
- **Navigation is spatial, not sequential.** Users don't go "forward" and "backward" — they open, close, and switch between panels.
- **The Dock is the primary launcher.** All apps are accessed from the Dock. The Dock is always visible.
- **The Desktop is the neutral state.** No panels open = empty desktop. This is not an error state; it's the starting point.

### No URL Routing

AI OS does not use URL-based routing (`/notes`, `/tasks`, `/settings`). Reasons:

1. The desktop metaphor doesn't map to URL paths. Multiple panels can be open simultaneously — a URL can only represent one page.
2. Browser back/forward would conflict with the spatial model (closing a panel ≠ going "back").
3. Deep linking is handled internally via cross-references (Section 6), not browser URLs.

**The URL is always the application root** (`/` or `/index.html`). All state is managed by Zustand stores and persisted in IndexedDB.

---

## 2. Navigation Hierarchy

Navigation has three levels, each with a defined scope and trigger.

```text
Level 1: Primary (Dock)
    │
    ├── Launch apps: Chat, Files, Notes, Tasks, Settings
    ├── Visual indicator: active app dot
    └── Always visible, fixed at bottom
    
Level 2: Secondary (Panel Header / Tab Bar)
    │
    ├── Navigate within an app: file tree, note list, task filters
    ├── Panel-specific tabs or section selectors
    └── Visible when a panel is open
    
Level 3: Tertiary (In-Panel Content)
    │
    ├── Drill into content: expand folder, open note, view task detail
    ├── Breadcrumbs for hierarchical content
    └── Visible within panel content area
```

### Level 1: Primary Navigation — The Dock

| Property | Value |
|---|---|
| **Location** | Fixed, bottom center of viewport |
| **Visibility** | Always visible (z-index above all panels) |
| **Behavior** | Click to open/focus app. If already open, bring to front. |
| **Active indicator** | Dot below icon for open apps |
| **Apps** | Projects, Files, Notes, Tasks, Chat, Settings |
| **Overflow** | Not applicable for v0.3.0 (fixed app set). Plugin apps in v0.6 may introduce overflow. |

**Dock Interaction Rules:**

1. **First click on inactive app:** Opens the panel (or restores from minimized state).
2. **Click on already-open app:** Brings the panel to front (highest z-index).
3. **Click on focused app:** No action. (Do not toggle close — this violates Predictable Navigation.)
4. **Right-click on dock icon:** Context menu with: "Close," "Minimize" (if open).

### Level 2: Secondary Navigation — Panel Headers

Each panel may have secondary navigation within its header area. This is panel-specific:

| Panel | Secondary Navigation |
|---|---|
| Files | File tree sidebar (always visible within panel) |
| Notes | Note list sidebar + editor area (split view) |
| Tasks | Filter tabs (All / Active / Completed) |
| Chat | Conversation selector (future — v0.4+). Single conversation for v0.3.0. |
| Settings | Section list (Appearance, AI Providers, Storage, About) |

### Level 3: Tertiary Navigation — In-Panel Content

Tertiary navigation happens within the content area of a panel:

| Panel | Tertiary Navigation |
|---|---|
| Files | Expand/collapse folder, select file, breadcrumb trail |
| Notes | Click note in sidebar → loads in editor |
| Tasks | Click task → expands inline detail view |
| Chat | Scroll through messages (not navigation per se) |
| Settings | Expand/collapse settings sections |

---

## 3. Navigation State

### What Is "Active"?

At any moment, AI OS has:

- **Active workspace:** The currently loaded project. Shown in the top bar.
- **Active (focused) panel:** The frontmost panel that receives keyboard input. Shown with elevated z-index and a subtle visual emphasis (brighter border or glow).
- **Open panels:** All panels currently on the desktop (including those behind the focused panel).
- **Active item within panel:** The selected file, open note, highlighted task. Panel-specific.

### Focus Model

```text
Desktop (root focus)
    │
    ├── Panel A (focused) ← receives keyboard events
    │     └── Content focus (input, list item, etc.)
    │
    ├── Panel B (open, unfocused)
    │
    └── Panel C (minimized — not in focus chain)
```

**Focus rules:**

1. Only one panel is focused at a time.
2. Clicking inside a panel focuses it (and brings it to front).
3. Clicking the desktop background (not on any panel) removes panel focus. Keyboard events go to the desktop (for global shortcuts only).
4. Minimized panels are not in the focus chain. They cannot receive keyboard events.
5. Opening a new panel automatically focuses it.
6. Closing the focused panel moves focus to the next panel in the z-stack (the panel that was behind it). If no panels remain, focus returns to the desktop.

### Background Panels

Panels behind the focused panel:

- **Continue to render.** They are not unmounted. (Context Preservation principle.)
- **Do not receive keyboard events.** Only the focused panel does.
- **Are visually dimmed.** Slightly reduced opacity or desaturated border — enough to indicate "not active" without looking broken.
- **Retain their internal state.** Scroll position, selections, expanded folders — all preserved.

---

## 4. Navigation Flows

### 4.1 App Launch → First Interaction

```text
Desktop loads
    → Top bar shows workspace name (or "No Project" if none exists)
    → Dock is visible at bottom
    → Desktop is empty (no panels open)
    → User clicks Files icon in Dock
    → Files panel opens, centered on desktop, focused
    → If workspace has files: file tree renders
    → If workspace is empty: empty state with "Create your first file" action
```

### 4.2 Switch Workspace

```text
User opens Project Switcher (via dock or top bar dropdown)
    → Modal or panel shows list of workspaces
    → User selects a different workspace
    → Current workspace state is saved:
        - Open panels and their positions
        - Active panel
        - Per-panel state (scroll, selection)
    → New workspace loads:
        - Stores rehydrate with new workspace data
        - Previous workspace's panel layout is restored (if it was open before)
        - If first time opening this workspace: clean desktop
    → Top bar updates to show new workspace name
    → Dock indicators reset to reflect new workspace's open panels
```

**Performance target:** Workspace switch < 100 ms (see [PERFORMANCE_BUDGET.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/PERFORMANCE_BUDGET.md)).

### 4.3 Open Note from File Browser

```text
Files panel is open, focused
    → User clicks a .md file in the file tree
    → Notes panel opens (if not already open)
    → Notes panel loads the selected file in the editor
    → Notes panel receives focus
    → Files panel remains open, moves behind Notes panel
```

**Alternative if Notes panel is already open:**
```text
    → Notes panel brings to front
    → Selected file loads in the editor (replaces previous note)
    → Previous note auto-saves before replacement
```

### 4.4 Navigate from Task to Linked Note

```text
Tasks panel is open
    → User clicks a task that references a note (via note ID)
    → Notes panel opens (or brings to front)
    → Referenced note loads in the editor
    → Tasks panel remains open behind Notes panel
```

**Note:** Task-to-note linking is a v0.4+ feature. The navigation architecture supports it now so the panel interaction model doesn't need to change later.

### 4.5 Open Settings from Any Context

```text
Any panel is focused (or no panel is focused)
    → User clicks Settings icon in Dock
    → Settings panel opens, centered, focused
    → All other panels remain open behind it
    → User changes settings and closes the Settings panel
    → Focus returns to the previously focused panel
```

---

## 5. Keyboard Navigation

Keyboard navigation follows the UX Principles (Keyboard-First). Every mouse interaction has a keyboard equivalent.

For the complete keyboard shortcut reference — global shortcuts, panel-level shortcuts, conflict resolution rules, and reserved shortcuts — see [KEYBOARD_SHORTCUTS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/05_KEYBOARD_SHORTCUTS.md). That document is the single source of truth for all shortcuts.

### Tab Order Within a Panel

```text
Panel Title Bar
    → Close button (first focusable in title bar)
    → Panel toolbar (if present)
    → Panel sidebar (if present — e.g., file tree)
    → Panel main content area
    → Panel footer (if present — e.g., chat input)
```

Within each section, tab order follows DOM order (left-to-right, top-to-bottom).

---

## 6. Internal Cross-Referencing (Deep Linking)

AI OS does not use browser URLs for deep linking. Instead, it uses internal references — structured identifiers that link one entity to another.

### Reference Format

```text
aios://<entity-type>/<entity-id>
```

Examples:
```text
aios://file/550e8400-e29b-41d4-a716-446655440000
aios://note/6ba7b810-9dad-11d1-80b4-00c04fd430c8
aios://task/f47ac10b-58cc-4372-a567-0e02b2c3d479
```

### How References Are Used

| Context | Behavior |
|---|---|
| Task description contains `aios://note/<id>` | Renders as a clickable link. Click opens the note in Notes panel. |
| Note content contains `aios://task/<id>` | Renders as a clickable inline reference. Click opens/focuses Tasks panel with that task highlighted. |
| Search result references a file | Click opens the file in the appropriate panel. |

### Reference Resolution

When a reference is activated:

1. **Determine the target type** (file, note, task).
2. **Open or focus the appropriate panel** (Files, Notes, Tasks).
3. **Navigate to the specific item** within that panel.
4. **Verify the item exists.** If the referenced item has been deleted, show an inline error: "This item no longer exists." Do not show a modal.

### Cross-Workspace References

For v0.3.0, references are scoped to the active workspace. Cross-workspace references are not supported. If a reference points to an item in a different workspace, it is treated as "not found" with a hint: "This item belongs to a different workspace."

---

## 7. Navigation History

### Decision: No Explicit Navigation History in v0.3.0

AI OS does not maintain a "back" / "forward" navigation history. Reasons:

1. The desktop metaphor is spatial, not sequential. "Back" doesn't have a clear meaning when multiple panels are open simultaneously.
2. Browser back/forward would navigate away from AI OS entirely (single-page app).
3. Implementing undo-style navigation history across multiple panels is complex and premature for v0.3.0.

### What Replaces History

- **Panel state persistence:** Panels remember their state when unfocused or minimized (Context Preservation principle).
- **Workspace state persistence:** Switching workspaces saves and restores the entire panel layout.
- **Recent items:** The Memory module tracks recently opened files, notes, and tasks — providing quick access without a history stack.

### Future Consideration (v0.4+)

A **Command Palette** (`Ctrl+K`) with "Recent Files" and "Recent Notes" would provide history-like navigation without the complexity of a full back/forward system. This is a better fit for the desktop metaphor than browser-style history.

---

## 8. Project Switcher

The Project Switcher is the mechanism for changing the active workspace.

### Access Points

| Method | Behavior |
|---|---|
| Click workspace name in top bar | Opens project switcher dropdown |
| Keyboard shortcut (to be defined) | Opens project switcher |
| Dock icon (if Projects has a dock position) | Opens Projects panel |

### Switcher Behavior

```text
User triggers project switcher
    → Dropdown or panel shows:
        - List of all workspaces, sorted by last accessed
        - "New Workspace" action at the bottom
        - Search/filter input (if > 5 workspaces)
    → User selects a workspace
    → Workspace switch executes (Section 4.2)
    → Switcher closes
```

### Data Shown Per Workspace

| Field | Source |
|---|---|
| Workspace name | `Project.name` |
| Last accessed | `Project.updatedAt` |
| File count (optional) | Derived from file store |
| Active indicator | Highlight for current workspace |

---

## 9. Navigation Rules Summary

| Rule | Rationale |
|---|---|
| Dock is always visible | Primary navigation must never be hidden (Predictable Navigation) |
| Clicking a dock icon never hides the app | Opening = predictable. Toggling = confusing. |
| Only one panel is focused at a time | Clear input routing. No ambiguous keyboard targets. |
| Closing focused panel moves focus down the z-stack | User is never left with no focus target (unless desktop is empty) |
| Panel state survives focus loss | Context Preservation principle |
| No URL routing | Desktop metaphor doesn't map to URL paths |
| No browser back/forward integration | Spatial navigation, not sequential |
| Cross-references resolve to panel + item | Internal linking without URL dependency |
| Workspace switch saves and restores panel layout | Context Preservation across workspaces |

---

*This document defines navigation behavior. For spatial layout (panel positions, sizes, z-ordering), see [LAYOUT_SYSTEM.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/02_LAYOUT_SYSTEM.md). For input interactions (click, drag, select), see [INTERACTION_MODEL.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/03_INTERACTION_MODEL.md).*
