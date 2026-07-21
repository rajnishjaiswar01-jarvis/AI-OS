# AI OS — UX Principles

> **Document Type:** UX Decision Framework  
> **Phase:** 4A  
> **Status:** Active  
> **Last Updated:** 2026-07-11  
> **Depends On:** [VISION_LOCK.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/VISION_LOCK.md), [PRODUCT_PRINCIPLES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/PRODUCT_PRINCIPLES.md)  
> **Audience:** All engineers, designers, and UX contributors

These principles define the UX philosophy of AI OS. When two valid interaction approaches exist, these principles determine which one wins. They are ordered by priority — if two principles conflict, the higher-ranked principle takes precedence.

Every UX document in `04_UX/` must trace its decisions back to these principles.

---

## Principle 1: Desktop-First

### Statement

AI OS is a desktop workspace. Every interaction is designed for a mouse, keyboard, and a screen width ≥ 1024px.

### Why

The Vision Lock (Section 3) defines AI OS as **desktop-first**. The desktop metaphor — panels, dock, top bar, drag-and-drop — is the product's core interaction paradigm. Designing for mobile and then adapting upward would compromise the workspace experience for the primary audience (developer-builders on desktop machines).

### Practical Impact

- All primary interactions assume a mouse with hover capability.
- Touch is not a primary input — it is a degraded experience, not an equal one.
- Responsive breakpoints exist for smaller viewports, but content density and interaction complexity reduce at smaller sizes rather than reflowing to a mobile layout.
- No hamburger menus, no bottom sheets, no swipe gestures in the core desktop experience.

---

## Principle 2: Keyboard-First

### Statement

Every action that a user can perform with a mouse must also be performable via keyboard alone. Keyboard users must never hit a dead end.

### Why

Keyboard navigation is both an accessibility requirement (WCAG 2.1 AA) and a power-user expectation. Developer-builders — the primary audience — live on their keyboards. An interface that requires constant mouse usage for common operations feels slow to this audience.

### Practical Impact

- All interactive elements are focusable and operable via keyboard.
- Tab order follows a logical, predictable flow (left-to-right, top-to-bottom within a panel).
- Focus is always visible — never invisible.
- Keyboard shortcuts exist for frequent actions. Shortcuts are discoverable (shown in tooltips, menus, and a shortcut reference).
- Modal dialogs trap focus. Closing a modal returns focus to the trigger element.

---

## Principle 3: Progressive Disclosure

### Statement

Show what the user needs right now. Hide everything else behind a deliberate action.

### Why

The Vision Lock (Section 7.2) establishes progressive disclosure as a design philosophy. AI OS has a large feature surface (projects, files, notes, tasks, chat, settings, memory). Showing everything at once overwhelms new users and clutters the workspace for experienced ones.

### Practical Impact

- First-time users see a clean desktop with the dock and top bar. Nothing else is open.
- Advanced features (settings, memory, debug panel) are accessible but not visible by default.
- Contextual actions appear on hover, selection, or right-click — not permanently displayed.
- Panels open on demand (dock click). The desktop is the neutral state, not a dashboard.
- Empty states guide users toward their first action rather than showing empty lists.
- Nested settings or configurations use drill-down or expandable sections, not all-at-once forms.

---

## Principle 4: Minimize Modal Usage

### Statement

Prefer inline, contextual interactions over modal dialogs. Reserve modals for irreversible or high-stakes actions only.

### Why

Modals interrupt flow. They force the user to stop what they're doing, deal with the modal, and then re-orient. In a workspace where users switch between files, notes, and tasks frequently, modal interruptions compound into friction.

### Practical Impact

- **Use modals for:** Destructive confirmations (delete project, delete file), critical warnings, first-run setup.
- **Do not use modals for:** Renaming files (inline edit), creating tasks (inline input), editing settings (dedicated panel), switching projects (dock or command palette).
- Rename operations use inline editing — click the name, it becomes an input, press Enter or Escape.
- New item creation uses inline fields at the top of a list, not a "Create New" modal.
- The maximum modal stack depth is 1. Never open a modal from within a modal.

---

## Principle 5: Context Preservation

### Statement

Switching between tasks, panels, or workspaces must never lose the user's place or state.

### Why

AI OS is a workspace — users work across multiple panels simultaneously. If switching from the file browser to chat and back loses the file browser's scroll position, expanded folders, or selected file, the user must re-navigate every time. This breaks the flow that a workspace is supposed to provide.

### Practical Impact

- Panel state (scroll position, selections, expanded sections) persists when the panel loses focus.
- Minimized panels retain their internal state. Restoring a minimized panel returns it exactly as it was.
- Workspace switch preserves the layout and open panels of the previous workspace (restored on return).
- The "back" mental model is not a browser back button — it's "restore what I was looking at." This is handled by workspace state management, not URL history.
- Note editor preserves cursor position and scroll when the user switches away and returns.

---

## Principle 6: One Primary Action Per View

### Statement

Every panel, dialog, or view should have one obvious primary action. Secondary actions exist but are visually subordinate.

### Why

When everything is equally prominent, nothing is prominent. Users should be able to glance at any view and immediately know what the main thing they can do is. This reduces decision fatigue and speeds up common workflows.

### Practical Impact

- Each panel has a clear primary action (Notes: write/edit, Tasks: add task, Files: open file, Chat: send message).
- Primary actions use the accent color and prominent positioning (bottom-right for forms, top-right for creation, inline for editing).
- Secondary actions (filter, sort, bulk operations) are available but visually subordinate — smaller buttons, muted colors, overflow menus.
- Destructive actions (delete) never look like the primary action. They use muted styling with a confirmation step.

---

## Principle 7: Predictable Navigation

### Statement

Users must always know where they are, how they got there, and how to get back.

### Why

The desktop metaphor provides spatial orientation — panels are "places" on the desktop. But unlike a filesystem or a web app with URLs, AI OS panels don't have an address bar or breadcrumb trail by default. Without deliberate wayfinding, users get lost: "Which note is open? Which project am I in? Where did that settings panel go?"

### Practical Impact

- The top bar always shows the active workspace/project name.
- Each panel's title bar shows what it contains (not just "Notes" but "Notes — Project Name" when relevant).
- The dock shows active panels with visual indicators (dot, highlight, badge).
- Panel focus changes are animated subtly (z-order shift, border glow) to confirm which panel is active.
- Breadcrumbs appear in panels with hierarchical content (file browser: `Project > Folder > Subfolder`).
- There is no "mystery navigation" — clicking something always has a visible, predictable result.

---

## Principle Summary Table

| # | Principle | One-line Rule |
|---|---|---|
| 1 | Desktop-First | Design for mouse + keyboard + wide screen |
| 2 | Keyboard-First | Every mouse action has a keyboard equivalent |
| 3 | Progressive Disclosure | Show what's needed now, hide the rest |
| 4 | Minimize Modals | Inline over modal, always |
| 5 | Context Preservation | Never lose the user's place |
| 6 | One Primary Action | Every view has one obvious thing to do |
| 7 | Predictable Navigation | Always know where you are and how to go back |

---

## How to Use This Document

When designing a new feature or interaction:

1. Check each principle against your design.
2. If your design violates a principle, you need a documented justification in the relevant UX architecture doc.
3. If two principles conflict (e.g., "one primary action" vs. "progressive disclosure" for a dense panel), the higher-numbered principle yields to the lower-numbered one.
4. These principles do not prescribe specific visual styles — that's Phase 4B (Visual Design System). These prescribe *behavior*.

---

*These principles are the UX constitution. They constrain everything in Phase 4A (Navigation, Layout, Interaction, Accessibility) and Phase 4B (Visual Design System). They do not change unless the Vision Lock changes.*
