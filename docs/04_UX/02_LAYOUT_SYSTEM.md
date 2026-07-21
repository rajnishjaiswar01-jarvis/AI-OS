# AI OS — Layout System

> **Document Type:** UX Architecture  
> **Phase:** 4A  
> **Status:** Active  
> **Last Updated:** 2026-07-11  
> **Depends On:** [NAVIGATION_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/01_NAVIGATION_ARCHITECTURE.md), [SYSTEM_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/SYSTEM_ARCHITECTURE.md)  
> **Audience:** Engineers implementing the shell, panel system, and responsive behavior

This document defines the spatial organization of AI OS — where things live on screen, how panels behave, and how layout responds to different viewport sizes.

---

## 1. Desktop Layout

The desktop is composed of three fixed chrome zones and one dynamic content zone.

```text
┌─────────────────────────────────────────────────────────────┐
│                         Top Bar                              │  ← Fixed, z-50
│  [Workspace Name]              [Clock] [Theme] [Status]      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                                                              │
│                     Content Area                             │  ← Dynamic
│                                                              │
│                  (Panels render here)                         │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                          Dock                                │  ← Fixed, z-50
│              [📁] [📝] [✅] [💬] [⚙️]                       │
└─────────────────────────────────────────────────────────────┘
```

### Chrome Zones

| Zone | Position | Height | Width | Z-Index | Behavior |
|---|---|---|---|---|---|
| **Top Bar** | Top, full width | 48px | 100vw | 50 | Fixed. Never hidden. Never scrollable. |
| **Dock** | Bottom, centered | 56px (including padding) | Auto (content-fit) | 50 | Fixed. Never hidden. Horizontally centered. |
| **Wallpaper** | Full viewport, behind all content | 100vh | 100vw | 0 | Fixed background. CSS-driven (gradient, image). |

### Content Area

| Property | Value |
|---|---|
| **Position** | Below top bar, above dock |
| **Dimensions** | `width: 100vw`, `height: calc(100vh - 48px - 56px)` |
| **Overflow** | Hidden (panels manage their own overflow) |
| **Z-Index range** | 100–200 (panels) |
| **Background** | Transparent (wallpaper shows through) |

---

## 2. Z-Index Architecture

Z-index is managed in defined layers. No component may use an arbitrary z-index outside these ranges.

| Layer | Z-Index Range | Contents |
|---|---|---|
| **Wallpaper** | 0 | Desktop background |
| **Desktop widgets** | 10–20 | Clock widget, future desktop widgets |
| **Panels** | 100–199 | All application panels. Order within range managed by `bringToFront()`. |
| **Chrome** | 50 | Top bar, Dock. Always above desktop widgets, always below modals. |
| **Dropdowns / Tooltips** | 300–399 | Context menus, dropdown selectors, tooltips |
| **Modals** | 400–499 | Confirmation dialogs, critical alerts |
| **Toast / Notifications** | 500 | Toast notifications (always topmost) |
| **Boot Screen** | 1000 | Boot animation (only during initial load) |

### Panel Z-Order Management

Panels within the 100–199 range are ordered dynamically:

```typescript
// Each panel's z-index = 100 + position in openApps array
const zIndex = 100 + openApps.indexOf(appId);
```

**`bringToFront(appId)`:** Moves the app to the end of the `openApps` array, giving it the highest z-index in the panel range.

**Maximum simultaneous panels:** The z-index range supports 100 panels. In practice, the performance budget limits this to ~5 panels (DOM node budget < 5,000).

---

## 3. Panel System

Panels are the primary UI container. Every app renders inside a panel.

### 3.1 Panel Types

| Type | Description | When Used |
|---|---|---|
| **Floating** | Default. Panel is positioned freely on the content area. Can be dragged, resized. | Most apps |
| **Maximized** | Panel fills the entire content area. No other panels visible behind it. | When user maximizes. Good for Notes editing, code work. |
| **Minimized** | Panel is hidden from the content area. Indicated by a dot on its dock icon. Not removed from state. | When user minimizes. Restores to previous position/size. |

**Note:** Docked/tiled panel layout (split-screen, snap-to-half) is deferred to v0.4+. v0.3.0 uses floating panels only (with maximize support).

### 3.2 Panel Anatomy

Every panel has a consistent structure:

```text
┌─────────────────────────────────────────────────┐
│  Title Bar                           [—] [□] [✕] │  ← 40px height
│  ─────────────────────────────────────────────── │
│                                                   │
│  Toolbar (optional)                               │  ← 36px if present
│  ─────────────────────────────────────────────── │
│                                                   │
│                                                   │
│  Content Area                                     │  ← flex-1, overflow-auto
│                                                   │
│                                                   │
│                                                   │
│  ─────────────────────────────────────────────── │
│  Status Bar / Footer (optional)                   │  ← 32px if present
└─────────────────────────────────────────────────┘
```

#### Title Bar

| Element | Behavior |
|---|---|
| **Title text** | Panel name. Left-aligned. Shows context (e.g., "Notes — Project Name"). |
| **Minimize button** `[—]` | Minimizes the panel. Panel state preserved. |
| **Maximize button** `[□]` | Toggles between maximized and previous floating size/position. |
| **Close button** `[✕]` | Closes the panel. Panel state is discarded (except for workspace-level persistence). |
| **Drag handle** | The entire title bar is draggable (except button areas). |

#### Toolbar (Optional)

Panel-specific toolbar for actions relevant to the panel's content:
- Files: "New File," "New Folder," view toggle
- Notes: Formatting toolbar (bold, italic, heading)
- Tasks: Filter buttons (All / Active / Completed)
- Chat: No toolbar
- Settings: No toolbar

#### Content Area

- `flex: 1` — fills remaining vertical space.
- `overflow: auto` — content scrolls independently of the panel frame.
- Each panel manages its own scroll position (Context Preservation).

#### Status Bar (Optional)

- Files: File count, storage usage
- Notes: Word count, character count, save status
- Tasks: Task count (completed / total)
- Chat: AI status (Ready / Thinking / Error)

### 3.3 Panel Dimensions

| Property | Default | Minimum | Maximum |
|---|---|---|---|
| **Width** | 480px | 320px | 100% of content area |
| **Height** | 560px | 300px | 100% of content area |
| **Position (initial)** | Centered in content area | — | — |

**Large panels** (Files with sidebar, Notes with split view):

| Property | Default |
|---|---|
| Width | 720px |
| Height | 600px |

### 3.4 Panel Positioning

#### Initial Position

When a panel opens, it is placed at the center of the content area. If another panel is already centered, the new panel offsets by `(24px, 24px)` — cascading like traditional desktop windows.

```text
First panel:  center
Second panel: center + (24, 24)
Third panel:  center + (48, 48)
```

#### Drag Behavior

- **Drag handle:** Title bar (excluding buttons).
- **Constraints:** Panel cannot be dragged fully off-screen. At least 100px of the title bar must remain visible.
- **Snap (v0.3.0):** No snapping. Free-form dragging only. Snap-to-edge/half is deferred.
- **Drag feedback:** Panel moves smoothly with cursor. No ghosting, no placeholder.

#### Resize Behavior

- **Resize handles:** All four edges and all four corners.
- **Resize cursor:** Standard resize cursors (`e-resize`, `se-resize`, etc.).
- **Minimum size enforced:** Cannot resize below minimum width/height (Section 3.3).
- **Performance:** Resize must not cause layout thrashing. Use `requestAnimationFrame` for smooth resizing.

### 3.5 Panel Lifecycle

```text
    Open
      │
      ▼
  Floating (default state)
      │
      ├──▶ Maximize ──▶ Floating (restore)
      │
      ├──▶ Minimize ──▶ Restore ──▶ Floating (previous position/size)
      │
      └──▶ Close
```

| Transition | Trigger | Animation | State Change |
|---|---|---|---|
| **Open** | Dock click | Scale up + fade in (200ms) | Added to `openApps`, focused |
| **Close** | Close button, `Ctrl+W`, Escape | Scale down + fade out (200ms) | Removed from `openApps`, state discarded |
| **Minimize** | Minimize button | Scale down toward dock icon (200ms) | Removed from content area, retained in `openApps` with `minimized: true` |
| **Restore** | Dock click on minimized app | Scale up from dock position (200ms) | `minimized: false`, restored to previous position/size |
| **Maximize** | Maximize button, double-click title bar | Expand to fill content area (200ms) | `maximized: true`, previous position/size saved |
| **Unmaximize** | Maximize button (while maximized) | Shrink to previous position/size (200ms) | `maximized: false`, restored |
| **Focus** | Click inside panel, dock click | Z-index change (instant), subtle border glow | Moved to top of z-stack |

### 3.6 Panel State Persistence

Per-workspace, the following panel state persists across sessions:

| State | Persisted? | Where |
|---|---|---|
| Which panels are open | Yes | `memoryRepository` (workspace memory) |
| Panel positions (x, y) | Yes | `memoryRepository` |
| Panel sizes (w, h) | Yes | `memoryRepository` |
| Panel z-order | Yes | `memoryRepository` (openApps array order) |
| Minimized/maximized state | Yes | `memoryRepository` |
| Panel internal state (scroll, selection) | Partial | In Zustand store (survives within session, not across sessions for v0.3.0) |

---

## 4. Multi-Panel Layout

### Rules for Multiple Open Panels

1. **Panels can overlap.** This is the default behavior. The focused panel is on top.
2. **Panels render independently.** No panel's layout affects another's.
3. **The desktop is always accessible.** Clicking empty desktop space removes panel focus.
4. **"Show Desktop"** (future): A shortcut to minimize all panels. Not in v0.3.0 scope.

### Visual Depth Cues

To help users distinguish overlapping panels:

| Cue | Applied To | Effect |
|---|---|---|
| **Drop shadow** | All floating panels | Gives depth. Shadow intensity increases for higher z-index. |
| **Border glow** | Focused panel only | Subtle blue/accent glow on border. 1px accent-colored outline. |
| **Backdrop dim** | Unfocused panels | Very subtle opacity reduction (0.98 vs 1.0). Not enough to impair readability. |

### Panel Conflict: Same Panel Opened Twice

Not allowed. Each app has exactly one panel instance. If the user clicks a dock icon for an already-open app, the existing panel is brought to front — a second instance is not created.

---

## 5. Responsive Behavior

AI OS is **desktop-first** (UX Principle 1). Responsive behavior exists but is a degraded experience, not an equal one.

### Viewport Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| **Desktop (default)** | ≥ 1024px | Full experience. Floating panels, dock, top bar. |
| **Small Desktop** | 768px – 1023px | Panels auto-maximize on open. No free floating. |
| **Tablet** | 600px – 767px | Single panel at a time (full content area). Dock icons reduce. |
| **Mobile** | < 600px | Warning: "AI OS is designed for desktop. Use a wider screen for the full experience." Functional but compromised. |

### Small Desktop (768px – 1023px)

- Panels open maximized by default (they can still be unmaximized).
- Dock remains at bottom.
- Top bar condenses (workspace name may truncate).
- Panel resize is disabled (maximized mode only).

### Tablet (600px – 767px)

- Only one panel visible at a time (full content area).
- Switching panels replaces the current view entirely.
- Dock remains visible with smaller icons.
- No drag, no resize, no floating.

### Mobile (< 600px)

- Full-screen warning recommending desktop use.
- If the user dismisses the warning, single-panel mode with minimal chrome.
- This is not a supported experience — it's a courtesy fallback.

---

## 6. Workspace Layout State

### What Gets Saved

When the user switches workspaces (or closes the browser), the current workspace's layout state is persisted:

```typescript
interface WorkspaceLayout {
  openPanels: PanelState[];       // Which panels are open
  focusedPanelId: string | null;  // Which panel was focused
}

interface PanelState {
  appId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zOrder: number;
}
```

### When Layout Is Restored

| Trigger | Behavior |
|---|---|
| Open AI OS (returning user) | Last active workspace loads with its saved layout |
| Switch to a previously opened workspace | Saved layout restores (panels open in saved positions) |
| Switch to a never-opened workspace | Clean desktop (no panels open) |
| Create new workspace | Clean desktop |

---

## 7. Content Density

### Spacing Grid

All spacing in AI OS follows an 8px base grid. This ensures visual consistency across all panels and components.

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Tight spacing within grouped elements (icon + label) |
| `space-2` | 8px | Default internal padding, gap between list items |
| `space-3` | 12px | Comfortable spacing between sections |
| `space-4` | 16px | Panel internal padding |
| `space-5` | 24px | Large section separation |
| `space-6` | 32px | Major section dividers, panel-to-panel gap |

### Information Density Variants

Glass-morphism panels have different density modes for different content types:

| Mode | Use Case | Line Height | Padding | Font Size |
|---|---|---|---|---|
| **Comfortable** | Notes, Chat, Settings | 1.6 | `space-4` | 14px |
| **Compact** | File tree, Task list | 1.4 | `space-2` | 13px |
| **Dense** | Debug panel, log viewer | 1.2 | `space-1` | 12px (mono) |

**Glass-morphism in dense views:** In Compact and Dense modes, glass-morphism translucency is reduced. Background blur radius decreases from 20px → 8px. This improves text readability in information-dense panels (addressing Architecture Review concern 2.1).

---

## 8. Layout Rules Summary

| Rule | Rationale |
|---|---|
| Top bar and Dock are always visible | Primary navigation must be accessible at all times |
| Panels are floating by default | Desktop metaphor — windows on a workspace |
| Only one panel instance per app | Prevents confusion and state management complexity |
| Panel minimum size is enforced | Prevents unusable micro-panels |
| Content area manages its own scroll | Each panel is an independent scroll context |
| Z-index ranges are fixed by layer | Prevents z-fighting and unpredictable overlap |
| 8px spacing grid everywhere | Visual consistency without designer intervention |
| Glass-morphism reduces in dense views | Readability over aesthetics when information density is high |
| Layout state persists per workspace | Context Preservation across sessions |

---

*This document defines spatial layout. For navigation behavior, see [NAVIGATION_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/01_NAVIGATION_ARCHITECTURE.md). For user interactions within these layouts, see [INTERACTION_MODEL.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/03_INTERACTION_MODEL.md).*
