# AI OS — Component Library

> **Document Type:** Visual Design System  
> **Phase:** 4B  
> **Status:** Active  
> **Last Updated:** 2026-07-11  
> **Depends On:** [DESIGN_TOKENS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/01_DESIGN_TOKENS.md), [TYPOGRAPHY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/02_TYPOGRAPHY.md), [ICONOGRAPHY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/03_ICONOGRAPHY.md), [MOTION_SYSTEM.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/04_MOTION_SYSTEM.md)  
> **Audience:** All engineers building or consuming UI components

This document inventories every UI component in AI OS — existing and planned. Each component has defined variants, states, composition rules, and token usage. New components must be added here before implementation.

---

## 1. Component Architecture

### Hierarchy

```text
Primitives (Level 0)
    │  GlassButton, Input, GlassCard, Widget
    │
    ├──▶ Shell Components (Level 1)
    │       Panel, Dock, DockIcon, TopBar, BootScreen
    │
    ├──▶ Feature Components (Level 2)
    │       FileTree, NoteEditor, TaskList, ChatMessage, SettingsPanel
    │
    └──▶ Overlay Components (Level 3)
            Modal, ContextMenu, Toast, Tooltip, Dropdown
```

**Rules:**
- Level 0 components have zero domain knowledge. They are generic.
- Level 1 components know about shell concerns (z-index, window management) but not features.
- Level 2 components are feature-specific. They import Level 0 primitives.
- Level 3 components render above everything. They manage their own positioning and focus trapping.
- Higher-level components compose lower-level ones. Never the reverse.

---

## 2. Existing Components (v0.1/v0.2)

### 2.1 GlassButton

**File:** [GlassButton.tsx](file:///c:/Users/ritik/jarvis/AI%20OS/src/components/GlassButton.tsx)

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | — | Button label |
| `onClick` | `() => void` | — | Click handler |
| `variant` | `'primary' \| 'ghost'` | `'ghost'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |
| `icon` | `ReactNode` | — | Optional leading icon |
| `className` | `string` | `''` | Additional styles |

**Variants:**

| Variant | Background | Border | Shadow |
|---|---|---|---|
| `ghost` | `.glass` (surface token) | `.glass` (border token) | None |
| `primary` | `--color-primary` at 20% | `--color-primary` at 30% | Accent glow |

**States:**

| State | Visual Change |
|---|---|
| Default | Variant styling |
| Hover | Background brightens (ghost: `surface-hover`, primary: 30% opacity) |
| Active/Press | `scale(0.97)` — 50ms ease-out |
| Focus | Focus ring per [ACCESSIBILITY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/04_ACCESSIBILITY.md) |
| Disabled | **Not yet implemented.** Should add: `opacity: 0.5`, `pointer-events: none`, `cursor: not-allowed` |

**v0.3.0 additions needed:**
- `disabled` prop
- `danger` variant (for destructive actions in confirmation dialogs)
- `aria-label` support for icon-only buttons
- `type` prop (`'button' | 'submit'`)

### 2.2 Input

**File:** [Input.tsx](file:///c:/Users/ritik/jarvis/AI%20OS/src/components/Input.tsx)

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | — | Controlled value |
| `onChange` | `(value: string) => void` | — | Change handler |
| `placeholder` | `string` | `''` | Placeholder text |
| `onSubmit` | `() => void` | — | Enter key handler |
| `autoFocus` | `boolean` | `false` | Auto-focus on mount |

**States:**

| State | Visual |
|---|---|
| Default | Glass background, border token |
| Focus | Border changes to `--color-primary` at 40%, subtle glow shadow |
| Filled | Same as default (no visual change) |
| Error | **Not yet implemented.** Should add: red border, error message slot |

**v0.3.0 additions needed:**
- `error` prop with inline error message
- `label` prop (renders `<label>` for accessibility)
- `aria-describedby` linking to error message
- `disabled` state
- `textarea` variant (multi-line)

### 2.3 GlassCard

**File:** [GlassCard.tsx](file:///c:/Users/ritik/jarvis/AI%20OS/src/components/GlassCard.tsx)

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | — | Card content |
| `glow` | `boolean` | `false` | Apply glow shadow |
| `onClick` | `() => void` | — | Makes card clickable |

**No changes needed for v0.3.0.** This is a generic container.

### 2.4 Widget

**File:** [Widget.tsx](file:///c:/Users/ritik/jarvis/AI%20OS/src/components/Widget.tsx)

A glass card with a title and optional icon. Used for desktop widgets.

**No changes needed for v0.3.0.**

### 2.5 Panel

**File:** [Panel.tsx](file:///c:/Users/ritik/jarvis/AI%20OS/src/components/Panel.tsx)

Current implementation: basic centered overlay with title bar and close button.

**v0.3.0 requires significant enhancement:**

| Feature | Current | Needed |
|---|---|---|
| Close button | ✅ | ✅ |
| Minimize button | ❌ | ✅ |
| Maximize button | ❌ | ✅ |
| Draggable (title bar) | ❌ | ✅ |
| Resizable (edges/corners) | ❌ | ✅ |
| Z-order management | ✅ (basic) | ✅ (enhanced) |
| State persistence | ❌ | ✅ |
| Backdrop click to close | ✅ | ❌ (change: backdrop click removes focus, not close) |
| Free positioning | ❌ (always centered) | ✅ |
| Panel toolbar slot | ❌ | ✅ |
| Panel status bar slot | ❌ | ✅ |
| Error boundary wrapper | ❌ | ✅ |

See [LAYOUT_SYSTEM.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/02_LAYOUT_SYSTEM.md) Section 3 for full panel specification.

### 2.6 Dock / DockIcon

**Files:** [Dock.tsx](file:///c:/Users/ritik/jarvis/AI%20OS/src/components/Dock.tsx), [DockIcon.tsx](file:///c:/Users/ritik/jarvis/AI%20OS/src/components/DockIcon.tsx)

**v0.3.0 changes:**
- Add new dock items: Files (📁), Notes (📝), Tasks (✅), Projects (🗂️)
- Active indicator (dot) already implemented
- Tooltip already implemented
- Context menu on right-click: needed

### 2.7 TopBar

**File:** [TopBar.tsx](file:///c:/Users/ritik/jarvis/AI%20OS/src/components/TopBar.tsx)

**v0.3.0 changes:**
- Left: Add workspace name (currently shows "AI OS" brand)
- Center: Search → will become Command Palette trigger (v0.3.1+)
- Right: Unchanged (theme toggle + clock)

### 2.8 Other Existing Components

| Component | File | v0.3.0 Changes |
|---|---|---|
| [BootScreen.tsx](file:///c:/Users/ritik/jarvis/AI%20OS/src/components/BootScreen.tsx) | Boot animation | No changes |
| [AiOrb.tsx](file:///c:/Users/ritik/jarvis/AI%20OS/src/components/AiOrb.tsx) | AI status indicator | No changes |
| [ClockWidget.tsx](file:///c:/Users/ritik/jarvis/AI%20OS/src/components/ClockWidget.tsx) | Desktop clock | No changes |
| [CodeBlock.tsx](file:///c:/Users/ritik/jarvis/AI%20OS/src/components/CodeBlock.tsx) | Syntax-highlighted code | No changes |
| [Desktop.tsx](file:///c:/Users/ritik/jarvis/AI%20OS/src/components/Desktop.tsx) | Desktop container | Minor: add panel rendering area |
| [SystemStatus.tsx](file:///c:/Users/ritik/jarvis/AI%20OS/src/components/SystemStatus.tsx) | System indicators | Minor: add storage usage |

---

## 3. New Components (v0.3.0)

### 3.1 Modal

Confirmation dialogs and critical overlays.

| Prop | Type | Description |
|---|---|---|
| `title` | `string` | Dialog heading |
| `message` | `string \| ReactNode` | Dialog body |
| `confirmLabel` | `string` | Confirm button text (e.g., "Delete") |
| `cancelLabel` | `string` | Cancel button text (default: "Cancel") |
| `variant` | `'default' \| 'danger'` | Danger uses error color for confirm button |
| `onConfirm` | `() => void` | — |
| `onCancel` | `() => void` | — |

**Visual:** Glass-elevated surface, backdrop dim (20% black), centered. Focus trapped.

### 3.2 ContextMenu

Right-click menu.

| Prop | Type | Description |
|---|---|---|
| `items` | `MenuItem[]` | Menu items with label, icon, shortcut, action, danger flag |
| `position` | `{x, y}` | Absolute position (from right-click event) |
| `onClose` | `() => void` | — |

**Visual:** Glass-elevated, small shadow, 7 items max, danger items at bottom with separator.

### 3.3 Toast

Non-blocking notification.

| Prop | Type | Description |
|---|---|---|
| `message` | `string` | Toast text |
| `action` | `{label, onClick}` | Optional action button (e.g., "Undo") |
| `duration` | `number` | Auto-dismiss in ms (default: 5000) |
| `variant` | `'default' \| 'success' \| 'error'` | Color treatment |

**Visual:** Glass surface, bottom-right positioning, stacked if multiple. Max 3 visible.

### 3.4 Tooltip

Hover/focus information popup.

| Prop | Type | Description |
|---|---|---|
| `content` | `string` | Tooltip text |
| `shortcut` | `string` | Optional keyboard shortcut display |
| `children` | `ReactNode` | Trigger element |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | Preferred position |

**Visual:** Small glass surface, caption-sized text, appears on hover (300ms delay) or focus. Repositions to stay within viewport.

### 3.5 FileTree

File browser tree view.

| Prop | Type | Description |
|---|---|---|
| `files` | `FileEntry[]` | File/folder tree data |
| `selectedIds` | `Set<string>` | Selected items |
| `expandedFolders` | `Set<string>` | Expanded folders |
| `onSelect` | `(id) => void` | — |
| `onOpen` | `(id) => void` | — |
| `onToggleFolder` | `(id) => void` | — |

**Visual:** Compact density, tree lines (optional), indentation per depth level (16px per level). Icons per file type from [ICONOGRAPHY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/03_ICONOGRAPHY.md).

### 3.6 TaskItem

Single task in the task list.

| Prop | Type | Description |
|---|---|---|
| `task` | `Task` | Task data |
| `onToggle` | `(id) => void` | Toggle completion |
| `onEdit` | `(id) => void` | Start inline edit |
| `onDelete` | `(id) => void` | Delete with undo |

**Visual:** Checkbox + title. Completed: strikethrough + muted color. Compact density.

### 3.7 EmptyState

Displayed when a list or panel has no content.

| Prop | Type | Description |
|---|---|---|
| `message` | `string` | Guidance text |
| `actionLabel` | `string` | Button label |
| `onAction` | `() => void` | Button click |

**Visual:** Centered in panel content area. Muted text color. Single primary action button.

### 3.8 InlineEdit

Transforms text into an editable input on trigger.

| Prop | Type | Description |
|---|---|---|
| `value` | `string` | Current text |
| `onSave` | `(newValue) => void` | — |
| `onCancel` | `() => void` | — |
| `validate` | `(value) => string \| null` | Validation function, returns error or null |

**Visual:** Text → Input crossfade. Input pre-filled, fully selected. Inline error below.

---

## 4. Component State Model

Every component follows this state pattern:

```text
Default → Hover → Focus → Active/Pressed → Disabled
                    ↓
                  Error (for inputs)
```

| State | Token Application |
|---|---|
| **Default** | `--color-surface`, `--color-border`, `--color-text` |
| **Hover** | `--color-surface-hover`, `--color-border-hover` |
| **Focus** | `--color-border-focus` (outline ring), `--color-primary` |
| **Active** | `--color-surface-active`, `transform: scale(0.97)` |
| **Disabled** | `opacity: 0.5`, `pointer-events: none` |
| **Error** | `--color-error` border, error message visible |
| **Selected** | `--color-surface-active`, accent left border (2px) |

---

## 5. Composition Rules

| Rule | Detail |
|---|---|
| **Components consume tokens, never raw values** | No hex codes, no px font sizes, no custom z-indices |
| **Components are self-contained** | No external positioning (no `position: absolute` in a reusable component — the parent positions it) |
| **Components expose className** | Every component accepts `className` for layout overrides by the parent |
| **Components handle their own loading/error/empty states** | Parent should not wrap components in conditional rendering for these states |
| **Glass utilities are applied via classes** | `.glass`, `.glass-hover`, `.glass-glow`, `.glass-dense`, `.glass-elevated` |
| **Animations use transition tokens** | `transition: all var(--transition-normal)` |
| **Focus ring via `:focus-visible`** | Never `:focus`. Mouse clicks don't show focus rings. |

---

## 6. Component Checklist

Before a new component is approved for implementation:

- [ ] Does it have a clear, single responsibility?
- [ ] Is it documented in this file with props, variants, and states?
- [ ] Does it consume design tokens only (no raw values)?
- [ ] Does it handle disabled, loading, error, and empty states where applicable?
- [ ] Does it support keyboard interaction?
- [ ] Does it have appropriate ARIA attributes?
- [ ] Does it respect `prefers-reduced-motion`?
- [ ] Does it work in both dark and light themes?
- [ ] Is its animation budget within the motion system rules?
- [ ] Does it have a corresponding test with axe-core a11y checks?

---

*This document inventories all components. For the tokens they consume, see [DESIGN_TOKENS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/01_DESIGN_TOKENS.md). For their text styling, see [TYPOGRAPHY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/02_TYPOGRAPHY.md). For their animations, see [MOTION_SYSTEM.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/04_MOTION_SYSTEM.md).*
