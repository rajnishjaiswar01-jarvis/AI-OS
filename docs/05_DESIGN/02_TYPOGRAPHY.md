# AI OS — Typography

> **Document Type:** Visual Design System  
> **Phase:** 4B  
> **Status:** Active  
> **Last Updated:** 2026-07-11  
> **Depends On:** [DESIGN_TOKENS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/01_DESIGN_TOKENS.md), [DESIGN_PRINCIPLES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/00_DESIGN_PRINCIPLES.md)  
> **Audience:** All engineers building UI components  
> **Implementation:** [index.css](file:///c:/Users/ritik/jarvis/AI%20OS/src/index.css), [index.html](file:///c:/Users/ritik/jarvis/AI%20OS/index.html)

This document defines the type system for AI OS — font families, scale, weights, line heights, and usage rules. Typography creates hierarchy (Design Principle 6).

---

## 1. Font Families

| Token | Stack | Purpose |
|---|---|---|
| `--font-sans` | `'Inter', system-ui, sans-serif` | All UI text — labels, body, headings, buttons |
| `--font-mono` | `'JetBrains Mono', monospace` | Code blocks, terminal output, file paths, technical data |

### Why Inter

- Designed for screen readability at small sizes (13px–14px range used heavily in workspace UIs).
- Extensive weight range (100–900) for fine-grained hierarchy.
- Tabular numbers feature for aligned data displays.
- Open-source (SIL license). No licensing concerns.

### Why JetBrains Mono

- Designed for code with programming ligatures.
- Clear distinction between similar characters (`0` vs `O`, `1` vs `l` vs `I`).
- Monospaced — essential for code alignment.
- Aligns with the developer-builder audience.

### Loading Strategy

Both fonts are loaded via Google Fonts in [index.html](file:///c:/Users/ritik/jarvis/AI%20OS/index.html):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

**Weights loaded:**
- Inter: 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- JetBrains Mono: 400 (Regular), 500 (Medium), 600 (SemiBold)

**Fallback behavior:** If fonts fail to load, `system-ui` provides the fallback for sans-serif and `monospace` for code. The UI remains fully functional.

---

## 2. Type Scale

AI OS uses a compact type scale optimized for workspace density. All sizes are in `rem` to respect browser font size settings.

| Name | Size (rem) | Size (px at 16px base) | Weight | Line Height | Usage |
|---|---|---|---|---|---|
| `display` | `1.5rem` | 24px | 700 | 1.3 | Boot screen title, empty state headings |
| `heading-1` | `1.125rem` | 18px | 600 | 1.35 | Panel titles, major section headings |
| `heading-2` | `1rem` | 16px | 600 | 1.4 | Sub-section headings, dialog titles |
| `heading-3` | `0.875rem` | 14px | 600 | 1.4 | Card headers, settings group labels |
| `body` | `0.875rem` | 14px | 400 | 1.6 | Default body text, note content, chat messages |
| `body-small` | `0.8125rem` | 13px | 400 | 1.5 | File tree items, task items, compact lists |
| `caption` | `0.75rem` | 12px | 400 | 1.4 | Timestamps, metadata, status bar text, tooltips |
| `overline` | `0.6875rem` | 11px | 500 | 1.3 | Widget titles, section labels (uppercase, tracking wider) |
| `code` | `0.8125rem` | 13px | 400 | 1.5 | Code blocks, file paths, terminal text |

### CSS Implementation

```css
/* Example usage — these are applied via Tailwind utility classes or CSS classes */
.text-display    { font-size: 1.5rem;    font-weight: 700; line-height: 1.3; }
.text-heading-1  { font-size: 1.125rem;  font-weight: 600; line-height: 1.35; }
.text-heading-2  { font-size: 1rem;      font-weight: 600; line-height: 1.4; }
.text-heading-3  { font-size: 0.875rem;  font-weight: 600; line-height: 1.4; }
.text-body       { font-size: 0.875rem;  font-weight: 400; line-height: 1.6; }
.text-body-small { font-size: 0.8125rem; font-weight: 400; line-height: 1.5; }
.text-caption    { font-size: 0.75rem;   font-weight: 400; line-height: 1.4; }
.text-overline   { font-size: 0.6875rem; font-weight: 500; line-height: 1.3;
                   text-transform: uppercase; letter-spacing: 0.08em; }
.text-code       { font-size: 0.8125rem; font-weight: 400; line-height: 1.5;
                   font-family: var(--font-mono); }
```

---

## 3. Font Weight Usage

| Weight | Value | Name | Usage |
|---|---|---|---|
| 300 | Light | — | Sparingly: large display text, decorative headings |
| 400 | Regular | — | Default body text, list items, inputs, chat messages |
| 500 | Medium | — | Buttons, labels, selected/active items |
| 600 | SemiBold | — | Headings (H1–H3), panel titles, dialog titles |
| 700 | Bold | — | Display text, brand text ("AI OS"), emphasis |

**Rule:** Do not use bold (700) for regular UI text. If something needs emphasis in body text, use 500 (Medium) or change the text color to `--color-text` (from `--color-text-secondary`).

---

## 4. Line Height

| Context | Line Height | Rationale |
|---|---|---|
| Headings | 1.3–1.4 | Tight — headings are short, don't need breathing room |
| Body text | 1.6 | Comfortable — optimal for reading paragraphs (notes, chat) |
| Compact lists | 1.4–1.5 | Dense — file tree, task list items need compact spacing |
| Code blocks | 1.5 | Slightly tight — code benefits from compact vertical spacing |
| Overline/caption | 1.3–1.4 | Tight — small text in metadata contexts |

---

## 5. Text Color Application

From [DESIGN_TOKENS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/01_DESIGN_TOKENS.md), applied as follows:

| Token | Usage |
|---|---|
| `--color-text` | Primary content — note body, chat messages, file names, task titles |
| `--color-text-secondary` | Labels — panel subtitles, column headers, metadata, form labels |
| `--color-text-muted` | Ambient — placeholders, disabled text, timestamps, hint text |

**Semantic color on text:**
| Color | Usage |
|---|---|
| `--color-primary` | Links, active tab text, focused item text |
| `--color-success` | "Saved ✓" status, completion count |
| `--color-warning` | Quota warning text |
| `--color-error` | Error messages, validation errors |

**Rule:** Never use semantic colors on body text. They are for status indicators and interactive elements only.

---

## 6. Component-Specific Typography

### Panel Title Bar

| Element | Scale | Weight | Color |
|---|---|---|---|
| Title text | `body` (14px) | 500 | `--color-text-secondary` |
| Breadcrumb | `caption` (12px) | 400 | `--color-text-muted` |

### Dock

| Element | Scale | Weight | Color |
|---|---|---|---|
| Tooltip label | `caption` (12px) | 500 | `--color-text` |

### Top Bar

| Element | Scale | Weight | Color |
|---|---|---|---|
| Brand text ("AI OS") | `body` (14px) | 700 | Gradient (primary → accent) |
| Clock | `body` (14px) | 400 | `--color-text-secondary` |

### File Tree

| Element | Scale | Weight | Color |
|---|---|---|---|
| Folder name | `body-small` (13px) | 500 | `--color-text` |
| File name | `body-small` (13px) | 400 | `--color-text` |
| File size | `caption` (12px) | 400 | `--color-text-muted` |

### Notes Editor

| Element | Scale | Weight | Color |
|---|---|---|---|
| Note body | `body` (14px) | 400 | `--color-text` |
| H1 in note | `heading-1` (18px) | 600 | `--color-text` |
| H2 in note | `heading-2` (16px) | 600 | `--color-text` |
| H3 in note | `heading-3` (14px) | 600 | `--color-text` |

### Task List

| Element | Scale | Weight | Color |
|---|---|---|---|
| Task title | `body-small` (13px) | 400 | `--color-text` |
| Task title (completed) | `body-small` (13px) | 400 | `--color-text-muted` + strikethrough |
| Task count | `caption` (12px) | 500 | `--color-text-secondary` |

### Chat

| Element | Scale | Weight | Color |
|---|---|---|---|
| User message | `body` (14px) | 400 | `--color-text` |
| AI message (prose) | `body` (14px) | 400 | `--color-text` |
| Code block | `code` (13px) | 400 | `--color-text` on `code-block-wrapper` bg |
| Timestamp | `caption` (12px) | 400 | `--color-text-muted` |

### Settings

| Element | Scale | Weight | Color |
|---|---|---|---|
| Section heading | `heading-3` (14px) | 600 | `--color-text` |
| Setting label | `body-small` (13px) | 500 | `--color-text` |
| Setting description | `caption` (12px) | 400 | `--color-text-secondary` |

---

## 7. Typography Rules

| Rule | Rationale |
|---|---|
| All font sizes in `rem`, never `px` | Respects browser zoom and user font size preferences |
| Maximum 2 font families in the app | Visual consistency. Inter + JetBrains Mono is the complete set. |
| No font weights outside 300–700 range | Loaded weight range. Using 800/900 would trigger fallback. |
| Body text default is 14px (0.875rem) | Optimal readability for workspace content at arm's length |
| Minimum text size is 11px (0.6875rem) | Below this, text becomes unreadable on standard displays |
| `letter-spacing` only on overline text | Tracking changes are disorienting when used inconsistently |
| No `text-transform: uppercase` except overline | Uppercase hurts readability. Reserved for small labels only. |
| Truncation uses `text-overflow: ellipsis` | Long file names, task titles must truncate gracefully |

---

*This document defines typography. For the tokens it consumes, see [DESIGN_TOKENS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/01_DESIGN_TOKENS.md). For how text is styled within specific components, see [COMPONENT_LIBRARY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/05_COMPONENT_LIBRARY.md).*
