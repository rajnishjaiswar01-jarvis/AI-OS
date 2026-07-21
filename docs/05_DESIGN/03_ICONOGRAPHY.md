# AI OS — Iconography

> **Document Type:** Visual Design System  
> **Phase:** 4B  
> **Status:** Active  
> **Last Updated:** 2026-07-11  
> **Depends On:** [DESIGN_TOKENS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/01_DESIGN_TOKENS.md), [DESIGN_PRINCIPLES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/00_DESIGN_PRINCIPLES.md)  
> **Audience:** All engineers implementing UI components with icons

This document defines the icon system for AI OS — sources, sizing, color, and usage rules.

---

## 1. Icon Strategy

### v0.3.0: Emoji-First

AI OS v0.3.0 uses **native emoji** as the primary icon system.

| Reason | Detail |
|---|---|
| **Zero dependencies** | No icon library to install, bundle, or version. |
| **Cross-platform support** | Every browser renders emoji natively. |
| **Rapid prototyping** | Adding a new icon is one character, not a component import. |
| **Consistent with v0.1/v0.2** | Dock icons, status indicators, and chat are already emoji. |

### Migration Path: v0.4+ — Icon Library

When the design system matures and the component count exceeds 30+, evaluate migrating to a dedicated icon library:

| Candidate | Pros | Cons |
|---|---|---|
| **Lucide React** | Consistent style, tree-shakeable, MIT license, 1400+ icons | Adds bundle dependency |
| **Phosphor Icons** | Multiple weights (thin/light/regular/bold/fill), flexible | Larger bundle |
| **Custom SVG set** | Full control, pixel-perfect alignment with glass aesthetic | Expensive to create and maintain |

**Decision deferred.** Emoji serves v0.3.0. The migration should happen when emoji limitations become a real problem (inconsistent rendering, missing icons, size alignment issues), not preemptively.

---

## 2. Current Icon Inventory

Icons already in use across v0.1/v0.2 components:

| Icon | Emoji | Location | Purpose |
|---|---|---|---|
| Chat | 💬 | Dock | Open chat panel |
| Settings | ⚙️ | Dock | Open settings panel |
| Search | 🔍 | TopBar | Toggle search input |
| Light mode | ☀️ | TopBar | Switch to light theme |
| Dark mode | 🌙 | TopBar | Switch to dark theme |
| Close | ✕ | Panel title bar | Close panel (text, not emoji) |
| AI Ready | — | SystemStatus | Green dot indicator |
| AI Thinking | — | SystemStatus | Animated orb |
| AI Error | — | SystemStatus | Red indicator |

### v0.3.0 Icons Needed

| Icon | Suggested Emoji | Location | Purpose |
|---|---|---|---|
| Files | 📁 | Dock | Open files panel |
| Notes | 📝 | Dock | Open notes panel |
| Tasks | ✅ | Dock | Open tasks panel |
| Projects | 🗂️ | Dock/TopBar | Open project switcher |
| New file | ➕ | Files toolbar | Create new file |
| New folder | 📂 | Files toolbar | Create new folder |
| Folder (expanded) | 📂 | File tree | Open folder |
| Folder (collapsed) | 📁 | File tree | Closed folder |
| File (generic) | 📄 | File tree | Generic file |
| File (markdown) | 📝 | File tree | .md file |
| File (text) | 📄 | File tree | .txt file |
| Rename | ✏️ | Context menu | Rename item |
| Delete | 🗑️ | Context menu | Delete item |
| Copy path | 📋 | Context menu | Copy file path |
| Bold | **B** | Notes toolbar | Bold text (text, not emoji) |
| Italic | *I* | Notes toolbar | Italic text (text, not emoji) |
| Save status | ✓ | Notes status bar | Saved indicator (text) |
| Warning | ⚠️ | Dialogs, toasts | Warning/caution |
| Error | ❌ | Error states | Error indicator |
| Success | ✅ | Success states | Completion indicator |
| Minimize | — | Panel title | Text character (—) |
| Maximize | □ | Panel title | Text character (□) |

---

## 3. Icon Sizing

| Context | Size | CSS |
|---|---|---|
| Dock icons | 20px–24px | `font-size: 1.25rem` (within 48×48px hit area) |
| Toolbar icons | 16px | `font-size: 1rem` |
| File tree icons | 14px–16px | `font-size: 0.875rem` to `1rem` |
| Context menu icons | 14px | `font-size: 0.875rem` |
| Status bar icons | 12px–14px | `font-size: 0.75rem` to `0.875rem` |
| Panel title bar (close/min/max) | 12px–14px | Fixed size, text characters |
| Toast/alert icons | 16px | `font-size: 1rem` |

### Sizing Rules

- Icon size must be consistent within a context (all toolbar icons = same size).
- Icon hit area must meet minimum target size: 44px × 44px for primary actions, 32px × 32px for secondary actions (per [ACCESSIBILITY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/04_ACCESSIBILITY.md) Section 7).
- Emoji vertical alignment: use `display: inline-flex; align-items: center;` to center emoji with adjacent text. Browser emoji rendering varies slightly — the container handles alignment, not the emoji.

---

## 4. Icon Color

### Emoji Icons

Emoji have inherent colors that cannot be styled via CSS. This is acceptable for v0.3.0.

**When emoji color conflicts with the design:**
- Use CSS `filter: grayscale(1)` to desaturate for disabled states.
- Use CSS `opacity` to dim for muted/inactive states.
- Do not attempt to recolor emoji via CSS — it's unreliable cross-browser.

### Text-Character Icons (✕, —, □)

These follow the text color system:

| State | Color |
|---|---|
| Default | `--color-text-muted` |
| Hover | `--color-text` (full opacity) |
| Close button hover | `--color-error` (red tint for destructive hint) |
| Disabled | `--color-text-muted` at 50% opacity |

### Future: SVG/Library Icons

When migrating to an icon library, all icons will inherit `currentColor` and be styled via the text color tokens. This is why the token system is color-agnostic for icons — it's designed to work with both emoji and SVG icons.

---

## 5. File Type Icons

File tree uses specific icons based on file extension:

| Extension | Icon | Rationale |
|---|---|---|
| `.md` | 📝 | Markdown = notes |
| `.txt` | 📄 | Plain text |
| `.json` | `{ }` | JSON structure (text characters) |
| `.js`, `.ts`, `.tsx` | 📜 | Script/code |
| `.css` | 🎨 | Styling |
| `.html` | 🌐 | Web page |
| `.png`, `.jpg`, `.gif`, `.svg` | 🖼️ | Image |
| `.pdf` | 📕 | Document |
| Unknown | 📄 | Generic fallback |

**Implementation:** A utility function `getFileIcon(filename: string): string` maps extensions to emoji. This centralizes the mapping and ensures consistency.

---

## 6. Icon Accessibility

| Rule | Implementation |
|---|---|
| **Decorative icons need no alt text** | Emoji in buttons with text labels: `aria-hidden="true"` on the emoji span |
| **Standalone icons need labels** | Icon-only buttons: `aria-label="Close panel"` on the button |
| **Status icons need context** | ✅ next to "Saved" text: emoji is decorative. ✅ alone: needs `aria-label="Saved"` |
| **File type icons are decorative** | File name adjacent provides context. Icon is supplementary. |
| **Never rely on icon alone** | Every icon action must have a text label (visible or via `aria-label`) |

---

## 7. Icon Rules Summary

| Rule | Rationale |
|---|---|
| Emoji for v0.3.0, library migration in v0.4+ | Zero-dependency start, migrate when limitations appear |
| Consistent sizing within each context | Visual rhythm — all toolbar icons same size |
| Hit area ≥ 44px for primary actions | Accessibility target size requirement |
| Text-character icons follow text color tokens | Consistent with the design system |
| File type mapping is centralized | Single function, not scattered conditionals |
| Decorative icons are `aria-hidden` | Screen readers skip redundant visual cues |
| Icon-only buttons have `aria-label` | Screen readers need text for standalone icons |

---

*This document defines the icon system. For the tokens that style icon containers, see [DESIGN_TOKENS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/01_DESIGN_TOKENS.md). For the components that use these icons, see [COMPONENT_LIBRARY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/05_COMPONENT_LIBRARY.md).*
