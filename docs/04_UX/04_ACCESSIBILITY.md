# AI OS — Accessibility

> **Document Type:** UX Architecture  
> **Phase:** 4A  
> **Status:** Active  
> **Last Updated:** 2026-07-11  
> **Depends On:** [INTERACTION_MODEL.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/03_INTERACTION_MODEL.md), [LAYOUT_SYSTEM.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/02_LAYOUT_SYSTEM.md), [NAVIGATION_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/01_NAVIGATION_ARCHITECTURE.md)  
> **Audience:** All engineers building UI components, designers defining visual states, and QA reviewers

This document defines accessibility rules that constrain all UI decisions in AI OS. Accessibility is not a feature to be added later — it is a constraint that shapes every component from the start.

---

## 1. Target Compliance

### v0.3.0 Baseline

AI OS targets **WCAG 2.1 Level AA** compliance for all core workspace features by v1.0 (per [VERSION_ROADMAP.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/VERSION_ROADMAP.md)).

For v0.3.0, the following subset is **mandatory** — not aspirational:

| Criterion | WCAG Reference | v0.3.0 Status |
|---|---|---|
| All interactive elements are keyboard operable | 2.1.1 Keyboard | **Required** |
| No keyboard traps (except modals, which trap intentionally) | 2.1.2 No Keyboard Trap | **Required** |
| Focus order is logical and predictable | 2.4.3 Focus Order | **Required** |
| Focus is always visible | 2.4.7 Focus Visible | **Required** |
| Color is not the sole means of conveying information | 1.4.1 Use of Color | **Required** |
| Text has minimum 4.5:1 contrast ratio | 1.4.3 Contrast (Minimum) | **Required** |
| UI components have minimum 3:1 contrast ratio | 1.4.11 Non-text Contrast | **Required** |
| Content does not cause seizures (no flashing > 3/sec) | 2.3.1 Three Flashes | **Required** |
| Images of text are not used (use real text) | 1.4.5 Images of Text | **Required** |
| All form inputs have accessible labels | 1.3.1 Info and Relationships | **Required** |
| Error messages are programmatically associated with inputs | 3.3.1 Error Identification | **Required** |
| Page has a descriptive title | 2.4.2 Page Titled | **Required** |
| ARIA landmarks identify regions | 1.3.1 Info and Relationships | **Required** |
| `prefers-reduced-motion` is respected | 2.3.3 Animation from Interactions | **Required** |

### Deferred to Later Versions

| Criterion | WCAG Reference | Target Version |
|---|---|---|
| Full screen reader narration for all workflows | Multiple | v0.5+ |
| Live region announcements for all state changes | 4.1.3 Status Messages | v0.4 |
| WCAG 2.1 AAA conformance | Level AAA | Post v1.0 |
| High contrast mode (dedicated theme) | 1.4.6 Contrast Enhanced | v1.0 |

---

## 2. Focus Management

Focus management is the most critical accessibility concern in AI OS. The desktop metaphor (multiple overlapping panels, no URL routing) means the browser's default focus behavior is insufficient.

### 2.1 Focus Visibility

Every focusable element must have a visible focus indicator.

**Focus ring specification:**

| Property | Value |
|---|---|
| Style | `outline: 2px solid var(--color-primary)` |
| Offset | `outline-offset: 2px` |
| Border radius | Matches the element's border-radius |
| Visibility | Always visible when element is focused via keyboard |
| Mouse focus | Focus ring hidden for mouse clicks (use `:focus-visible` not `:focus`) |

```css
/* All interactive elements */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Hide outline for mouse clicks */
:focus:not(:focus-visible) {
  outline: none;
}
```

### 2.2 Focus Trapping

Focus traps prevent keyboard focus from leaving a specific container. Used only for:

| Component | Trap Behavior | Exit |
|---|---|---|
| **Modal dialogs** | Focus trapped inside modal. Tab cycles through modal elements only. | Escape closes modal. Focus returns to trigger element. |
| **Context menus** | Focus trapped inside menu. Arrow keys navigate items. | Escape closes menu. Click outside closes menu. Focus returns to trigger. |
| **Dropdown selectors** | Focus trapped while open. Arrow keys navigate options. | Escape/Enter closes. Focus returns to trigger. |

**Panels do NOT trap focus.** Users must be able to Tab out of a panel to the Dock, Top Bar, or other panels. Focus trapping is reserved for overlays only.

### 2.3 Focus Restoration

When a focused element is removed from the DOM (panel closes, dialog dismisses, item deleted):

| Scenario | Focus Moves To |
|---|---|
| Panel closes | Next panel in z-stack (or desktop if no panels open) |
| Modal closes | The element that triggered the modal |
| Context menu closes | The element that was right-clicked |
| Dropdown closes | The dropdown trigger button |
| List item deleted | Next item in list. If last item, previous item. If list is now empty, the list container. |
| Inline edit completes | The edited item (now in display mode) |

**Rule:** Focus must never be "lost" — pointing to a non-existent DOM node. If a component removes a focused element, it must explicitly manage where focus goes next.

### 2.4 Focus Order

Tab order within AI OS follows this global sequence:

```text
1. Top Bar (left to right)
2. Active/Focused Panel (internal tab order per LAYOUT_SYSTEM.md Section 3.2)
3. Dock (left to right)
```

Within a panel:
```text
1. Title bar close button
2. Title bar minimize button
3. Title bar maximize button
4. Toolbar buttons (left to right)
5. Sidebar content (top to bottom)
6. Main content area (top to bottom)
7. Footer / status bar elements
```

**`tabindex` rules:**
- Interactive elements use natural tab order (`tabindex` not set, or `tabindex="0"`).
- Non-interactive elements that need programmatic focus use `tabindex="-1"` (focusable but not in tab order).
- **Never use `tabindex` > 0.** It breaks the natural DOM order and creates unpredictable navigation.

---

## 3. Screen Reader Support

### 3.1 ARIA Landmarks

The desktop layout must define ARIA landmarks for screen reader navigation:

```html
<header role="banner">          <!-- Top Bar -->
<main role="main">              <!-- Content Area (active panel) -->
<nav role="navigation">         <!-- Dock -->
<aside role="complementary">    <!-- Sidebars within panels -->
<dialog role="dialog">          <!-- Modal dialogs -->
```

**Panel ARIA structure:**

```html
<section role="region" aria-label="Notes - Project Name">
  <header>
    <h2>Notes — Project Name</h2>
    <button aria-label="Minimize panel">—</button>
    <button aria-label="Maximize panel">□</button>
    <button aria-label="Close panel">✕</button>
  </header>
  <div role="toolbar" aria-label="Note formatting">
    <!-- toolbar buttons -->
  </div>
  <div role="main">
    <!-- panel content -->
  </div>
  <footer>
    <!-- status bar -->
  </footer>
</section>
```

### 3.2 ARIA Roles for Components

| Component | Role | Additional ARIA |
|---|---|---|
| Panel | `role="region"` | `aria-label="[Panel Title]"` |
| File tree | `role="tree"` | — |
| File tree item | `role="treeitem"` | `aria-expanded` (for folders), `aria-selected` |
| Task list | `role="list"` | — |
| Task item | `role="listitem"` | `aria-checked` (for completion state) |
| Note list | `role="listbox"` | — |
| Note item | `role="option"` | `aria-selected` |
| Context menu | `role="menu"` | — |
| Context menu item | `role="menuitem"` | — |
| Toolbar | `role="toolbar"` | `aria-label="[purpose]"` |
| Modal | `role="dialog"` | `aria-modal="true"`, `aria-labelledby` |
| Toast notification | `role="alert"` | `aria-live="assertive"` |
| Search input | `role="searchbox"` | `aria-label="Search [context]"` |
| Dock | `role="navigation"` | `aria-label="Application dock"` |
| Dock icon | `role="button"` | `aria-label="[app name]"`, `aria-pressed` (if active) |

### 3.3 Live Regions

Dynamic content changes must be announced to screen readers:

| Event | Live Region | Politeness |
|---|---|---|
| Toast notification | `aria-live="assertive"` | Interrupts current announcement |
| Note save status change | `aria-live="polite"` | Announced after current speech |
| Task completion toggle | `aria-live="polite"` | Announced after current speech |
| AI typing indicator | `aria-live="polite"` | — |
| Error message appearance | `aria-live="assertive"` | Interrupts for errors |
| File tree update (file added/deleted) | `aria-live="polite"` | — |
| Search results count | `aria-live="polite"` | "N results found" |

### 3.4 Screen Reader Announcements

Key state changes that must be announced:

| State Change | Announcement |
|---|---|
| Panel opened | "[Panel name] opened" |
| Panel closed | "[Panel name] closed" |
| Panel focused | "[Panel name] — [context]" |
| Workspace switched | "Switched to [workspace name]" |
| File selected | "[filename], [file type]" |
| Folder expanded | "[folder name] expanded, [N] items" |
| Folder collapsed | "[folder name] collapsed" |
| Task completed | "[task name] completed" |
| Task uncompleted | "[task name] marked incomplete" |

---

## 4. Color and Contrast

### 4.1 Contrast Requirements

| Element Type | Minimum Ratio | WCAG Criterion |
|---|---|---|
| Body text (14px regular) | 4.5:1 | 1.4.3 |
| Large text (18px regular or 14px bold) | 3:1 | 1.4.3 |
| UI component boundaries (borders, icons) | 3:1 | 1.4.11 |
| Focus indicators | 3:1 against adjacent colors | 1.4.11 |
| Placeholder text | 4.5:1 (treat as regular text) | 1.4.3 |

### 4.2 Glass-morphism and Contrast

Glass-morphism uses translucent backgrounds with backdrop blur. This creates a contrast challenge because the background behind the glass surface varies.

**Rules for glass surfaces:**

1. **Text on glass must meet contrast against the worst-case background.** Test with both the darkest and lightest wallpapers.
2. **Add a semi-opaque backing layer** behind text-heavy glass surfaces. The `var(--color-surface)` token already provides this: `rgba(255, 255, 255, 0.05)` in dark mode.
3. **Information-dense panels (file tree, task list) increase surface opacity.** Per [LAYOUT_SYSTEM.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/02_LAYOUT_SYSTEM.md) Section 7, compact/dense modes reduce blur radius and increase opacity.
4. **Never rely solely on glass translucency for visual separation.** Always add borders (`var(--color-border)`) between adjacent glass surfaces.

**Contrast check matrix:**

| Text Token | Background Token | Dark Mode Ratio | Light Mode Ratio | Pass? |
|---|---|---|---|---|
| `--color-text` | `--color-surface` | Must verify | Must verify | ✅ (by design) |
| `--color-text-secondary` | `--color-surface` | Must verify ≥ 4.5:1 | Must verify ≥ 4.5:1 | Check |
| `--color-text-muted` | `--color-surface` | Must verify ≥ 4.5:1 | Must verify ≥ 4.5:1 | Check |

> **Action item for Phase 4B:** When design tokens are finalized, run contrast checks for all text/background combinations. Adjust muted/secondary text colors if they fail 4.5:1.

### 4.3 Color Not as Sole Indicator

Color must never be the only way to convey information:

| Information | Color Indicator | Additional Indicator |
|---|---|---|
| Task complete | Green text/icon | Strikethrough text + checkmark icon |
| Error state | Red border | Error icon (⚠️) + error text message |
| Active panel | Accent border glow | Elevated z-index (visual depth) |
| Active dock icon | Dot below icon | Dot is also a shape indicator, not just a color |
| Selected file | Accent left border | Background color change + bold text |
| Unsaved changes | Dot on tab/title | "Unsaved" text in status bar |

---

## 5. Motion and Animation

> **Cross-reference:** For the complete motion specification — timing tokens, easing curves, animation categories, and implementation patterns — see [MOTION_SYSTEM.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/04_MOTION_SYSTEM.md). This section defines the accessibility constraints that the Motion System must respect.

### 5.1 `prefers-reduced-motion` Support

All animations must respect the user's OS-level motion preference:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Implementation rule:** Every CSS animation and JavaScript-driven animation must have a `prefers-reduced-motion` check. No exceptions.

### 5.2 Animation Categories

| Category | Examples | Reduced Motion Behavior |
|---|---|---|
| **Decorative** | Boot screen animation, wallpaper effects, dock icon bounce | Removed entirely. Instant state change. |
| **Transitional** | Panel open/close, minimize/maximize, fade in/out | Reduced to instant or a 50ms fade. |
| **Feedback** | Button press scale, hover glow, selection highlight | Retained but duration reduced to near-instant. |
| **Informational** | Loading spinner, typing indicator, save status pulse | Retained (these convey essential state). May simplify to a static indicator. |

### 5.3 Animation Safety

| Rule | Specification |
|---|---|
| No flashing content > 3 times per second | WCAG 2.3.1. Applies to all visual elements. |
| No auto-playing animation longer than 5 seconds | Must be pausable, stoppable, or hideable. |
| No parallax scrolling | Causes motion sickness for vestibular disorder users. |
| Maximum animation duration | 300ms for transitions. 1000ms for complex entrances (boot screen only). |

---

## 6. Keyboard-Only Operation

Per UX Principle 2 (Keyboard-First), every action must be performable without a mouse.

### 6.1 Keyboard Verification Checklist

Every feature must pass this checklist before shipping:

- [ ] Can the user reach every interactive element using Tab/Shift+Tab?
- [ ] Can the user activate every button and link using Enter or Space?
- [ ] Can the user navigate lists using Arrow keys?
- [ ] Can the user open and close context menus using Shift+F10 and Escape?
- [ ] Can the user dismiss modals using Escape?
- [ ] Can the user perform drag-and-drop operations using keyboard (Cut/Paste or Move via menu)?
- [ ] Is focus visible at every step?
- [ ] Does focus move logically (no jumps to unexpected elements)?
- [ ] Does closing a focused element move focus to a sensible target?
- [ ] Can the user complete the entire task without touching the mouse?

### 6.2 Keyboard Alternatives for Mouse-Only Interactions

| Mouse Interaction | Keyboard Alternative |
|---|---|
| Drag file to folder | Select file → Ctrl+X → Navigate to folder → Ctrl+V |
| Right-click context menu | Select item → Shift+F10 |
| Drag panel to reposition | Not applicable (panels can be maximized via keyboard but not repositioned — acceptable trade-off for v0.3.0) |
| Resize panel | Not applicable (maximize is available — acceptable trade-off for v0.3.0) |
| Hover to see tooltip | Focus the element (tooltip shows on focus, not just hover) |
| Double-click to open file | Select file → Enter |

### 6.3 Skip Links

A skip link allows keyboard users to bypass repeated content (top bar, dock) and jump directly to the main content area.

```html
<a href="#main-content" class="skip-link">
  Skip to main content
</a>
```

**Skip link behavior:**
- Visually hidden until focused (appears on first Tab press).
- Jumps focus to the content area of the focused panel (or the desktop if no panel is open).
- Styled consistently with the design system (glass surface, accent color).

---

## 7. Text Scaling

### Browser Font Size

AI OS must remain usable when the user changes their browser's default font size.

| Browser Setting | AI OS Behavior |
|---|---|
| Default (16px) | Normal layout |
| Large (20px / 125%) | Layout adapts. No overflow. No clipping. |
| Very Large (24px / 150%) | Layout adapts. Panels may need scrolling for content. Chrome (top bar, dock) remains functional. |
| Huge (32px / 200%) | Degraded but functional. Some layout compromises acceptable. |

**Implementation rule:** Use `rem` units for font sizes and spacing. Never use `px` for text content. Fixed-size chrome elements (top bar height, dock height) may use `px` since they are layout containers, not content.

### Minimum Target Sizes

| Element | Minimum Size | WCAG Reference |
|---|---|---|
| Clickable buttons | 44px × 44px | 2.5.5 Target Size |
| Clickable list items | 44px height | 2.5.5 |
| Close/minimize/maximize buttons | 32px × 32px (with adequate spacing) | — |
| Form inputs | 36px height minimum | — |
| Dock icons | 40px × 40px | — |

**Spacing between targets:** Adjacent clickable elements must have at least 8px spacing to prevent mis-taps.

---

## 8. Testing Strategy

### 8.1 Automated Testing

| Tool | Purpose | When |
|---|---|---|
| **axe-core** (via `vitest-axe`) | Automated WCAG violation detection | Run on every component test |
| **eslint-plugin-jsx-a11y** | Catch ARIA and accessibility issues at build time | Part of lint pipeline |

**axe-core integration:**

```typescript
import { axe } from 'vitest-axe';

it('should have no accessibility violations', async () => {
  const { container } = render(<FileTree />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 8.2 Manual Testing Checklist

Run before each release:

| Test | How | Pass Criteria |
|---|---|---|
| **Keyboard navigation** | Tab through entire app without mouse | All elements reachable, focus visible |
| **Screen reader walkthrough** | Use NVDA (Windows) or VoiceOver (Mac) | All content announced, landmarks navigable, live regions work |
| **Zoom to 200%** | Browser zoom to 200% | No content clipped, no overlap, all functionality accessible |
| **Reduced motion** | Enable "Reduce motion" in OS settings | No decorative animations. Transitions instant or near-instant. |
| **High contrast** | Enable Windows High Contrast Mode | All text readable, all borders visible, all interactive elements distinguishable |
| **No color dependency** | Inspect all status indicators | Every color-coded element has a non-color indicator too |

### 8.3 Screen Reader Testing Matrix

| Screen Reader | Browser | Priority |
|---|---|---|
| **NVDA** | Chrome | Primary (most common free screen reader on Windows) |
| **NVDA** | Firefox | Secondary |
| **VoiceOver** | Safari (macOS) | Secondary |
| **JAWS** | Chrome | Tertiary (commercial — test if available) |

---

## 9. Accessibility Rules Summary

| Rule | Rationale |
|---|---|
| Every interactive element is keyboard accessible | WCAG 2.1.1 — non-negotiable |
| Focus is always visible (keyboard users) | WCAG 2.4.7 — users must know where they are |
| Focus never gets "lost" | Focus restoration prevents disorientation |
| No `tabindex` > 0 | Prevents unpredictable tab order |
| Color is not sole indicator | WCAG 1.4.1 — colorblind users need alternatives |
| 4.5:1 contrast minimum for text | WCAG 1.4.3 — readability for low-vision users |
| Glass-morphism has contrast-safe backing | Glass translucency must not compromise readability |
| `prefers-reduced-motion` respected | WCAG 2.3.3 — motion-sensitive users |
| ARIA landmarks on all major regions | Screen reader navigation depends on landmarks |
| Live regions for dynamic updates | Screen readers can't detect visual changes without ARIA |
| `rem` for text sizing | Respects user browser font size settings |
| 44px minimum touch/click targets | WCAG 2.5.5 — prevents mis-clicks |
| axe-core in every component test | Catches regressions automatically |
| No flashing > 3 times per second | WCAG 2.3.1 — seizure prevention |

---

*This document defines accessibility constraints. For the interactions these constraints apply to, see [INTERACTION_MODEL.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/03_INTERACTION_MODEL.md). For layout concerns (spacing, density, responsive), see [LAYOUT_SYSTEM.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/02_LAYOUT_SYSTEM.md).*
