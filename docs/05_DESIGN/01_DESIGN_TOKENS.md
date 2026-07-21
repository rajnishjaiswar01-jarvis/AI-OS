# AI OS — Design Tokens

> **Document Type:** Visual Design System  
> **Phase:** 4B  
> **Status:** Active  
> **Last Updated:** 2026-07-11  
> **Depends On:** [DESIGN_PRINCIPLES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/00_DESIGN_PRINCIPLES.md), [LAYOUT_SYSTEM.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/02_LAYOUT_SYSTEM.md)  
> **Audience:** All engineers building UI components  
> **Implementation:** [index.css](file:///c:/Users/ritik/jarvis/AI%20OS/src/index.css)

Design tokens are the atomic values of the visual system — colors, spacing, radii, shadows, and z-indices. Every component in AI OS consumes these tokens. No component defines its own raw values.

This document is the specification. The implementation lives in [index.css](file:///c:/Users/ritik/jarvis/AI%20OS/src/index.css) inside the `@theme` block.

---

## 1. Color Tokens

### 1.1 Brand Colors

| Token | Dark Mode Value | Purpose |
|---|---|---|
| `--color-primary` | `hsl(220, 80%, 55%)` | Interactive elements, focus, links, active states |
| `--color-primary-light` | `hsl(220, 80%, 65%)` | Hover variants of primary |
| `--color-primary-dark` | `hsl(220, 80%, 45%)` | Pressed/active variants of primary |
| `--color-accent` | `hsl(270, 70%, 60%)` | Branding, gradient endpoints, secondary emphasis |
| `--color-accent-light` | `hsl(270, 70%, 70%)` | Hover variants of accent |
| `--color-glow` | `hsl(220, 100%, 70%)` | Focus rings, glass glow effects |

### 1.2 Surface Colors

Surfaces use alpha values for translucency — critical for glass-morphism.

| Token | Dark Mode | Light Mode | Purpose |
|---|---|---|---|
| `--color-surface` | `rgba(255,255,255, 0.05)` | `rgba(255,255,255, 0.6)` | Default glass background |
| `--color-surface-hover` | `rgba(255,255,255, 0.08)` | `rgba(255,255,255, 0.7)` | Hovered element background |
| `--color-surface-active` | `rgba(255,255,255, 0.12)` | `rgba(255,255,255, 0.8)` | Selected/active element background |
| `--color-surface-elevated` | `rgba(255,255,255, 0.10)` | `rgba(255,255,255, 0.75)` | **New.** Modals, dropdowns — higher elevation surfaces |

### 1.3 Border Colors

| Token | Dark Mode | Light Mode | Purpose |
|---|---|---|---|
| `--color-border` | `rgba(255,255,255, 0.1)` | `rgba(0,0,0, 0.1)` | Default border on glass surfaces |
| `--color-border-hover` | `rgba(255,255,255, 0.2)` | `rgba(0,0,0, 0.2)` | Hovered element border |
| `--color-border-focus` | `var(--color-primary)` | `var(--color-primary)` | **New.** Focused element border |

### 1.4 Text Colors

| Token | Dark Mode | Light Mode | Purpose |
|---|---|---|---|
| `--color-text` | `rgba(255,255,255, 0.9)` | `rgba(0,0,0, 0.85)` | Primary body text |
| `--color-text-secondary` | `rgba(255,255,255, 0.5)` | `rgba(0,0,0, 0.5)` | Labels, metadata, secondary info |
| `--color-text-muted` | `rgba(255,255,255, 0.3)` | `rgba(0,0,0, 0.3)` | Placeholders, hints, disabled text |

**Contrast verification required:** `--color-text-secondary` and `--color-text-muted` must achieve ≥ 4.5:1 contrast against `--color-surface` on the darkest and lightest wallpapers. See [ACCESSIBILITY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/04_ACCESSIBILITY.md) Section 4.

### 1.5 Semantic Colors

| Token | Value | Purpose |
|---|---|---|
| `--color-success` | `hsl(145, 65%, 42%)` | **New.** Task completion, save confirmed, positive actions |
| `--color-warning` | `hsl(38, 92%, 50%)` | **New.** Quota warnings, degraded states |
| `--color-error` | `hsl(0, 72%, 51%)` | **New.** Errors, destructive actions, failures |
| `--color-info` | `var(--color-primary)` | **New.** Informational highlights (aliases primary) |

### 1.6 Wallpaper Colors

| Class | Dark Mode | Light Mode |
|---|---|---|
| `.wallpaper-space` | `#0a0a1a → #0f0f2e → #1a0a2e → #0d0d20` | `#e8eaf6 → #c5cae9 → #d1c4e9 → #e8eaf6` |
| `.wallpaper-aurora` | `#0a1628 → #0d2137 → #0a2e3d → #162040` | `#e0f2f1 → #b2dfdb → #b2ebf2 → #c8e6c9` |

**Rule:** New wallpapers must be tested for contrast against all text tokens on glass surfaces.

---

## 2. Spacing Tokens

All spacing follows an 8px base grid (per [LAYOUT_SYSTEM.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/02_LAYOUT_SYSTEM.md) Section 7).

| Token | Value | Usage |
|---|---|---|
| `--space-1` | `4px` | Tight gaps: icon-to-label, stacked elements |
| `--space-2` | `8px` | Default gap: list items, button groups |
| `--space-3` | `12px` | Comfortable: section spacing within a panel |
| `--space-4` | `16px` | Panel internal padding |
| `--space-5` | `24px` | Large section separation |
| `--space-6` | `32px` | Major dividers, panel-to-panel conceptual gap |
| `--space-8` | `48px` | Top bar height, large structural spacing |

**Rule:** Custom pixel values are not allowed in components. If no spacing token fits, add a new token to this table — do not use magic numbers.

---

## 3. Border Radius Tokens

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `8px` | Buttons, inputs, small cards |
| `--radius-md` | `12px` | Panels, dropdowns, context menus |
| `--radius-lg` | `16px` | Large cards, modals |
| `--radius-xl` | `20px` | Dock, major containers |
| `--radius-full` | `9999px` | Avatars, badges, pill shapes |

---

## 4. Shadow Tokens

Shadows create depth. Intensity increases with elevation (Design Principle 3: Depth Through Layers).

| Token | Dark Mode | Light Mode | Usage |
|---|---|---|---|
| `--shadow-sm` | `0 2px 8px rgba(0,0,0, 0.3)` | `0 1px 4px rgba(0,0,0, 0.08)` | **New.** Tooltips, small dropdowns |
| `--shadow-md` | `0 4px 16px rgba(0,0,0, 0.4)` | `0 4px 12px rgba(0,0,0, 0.1)` | **New.** Panels (floating) |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0, 0.5)` | `0 8px 24px rgba(0,0,0, 0.15)` | **New.** Modals, critical overlays |
| `--shadow-glow` | `0 0 20px rgba(79,140,255, 0.1), 0 0 60px rgba(79,140,255, 0.05)` | `0 4px 20px rgba(0,0,0, 0.08), 0 1px 4px rgba(0,0,0, 0.04)` | Existing `.glass-glow`. Focused panels, dock. |

---

## 5. Glass Tokens

Glass-morphism properties as tokens for consistent application.

| Token | Value | Usage |
|---|---|---|
| `--glass-blur` | `20px` | Default backdrop blur for all glass surfaces |
| `--glass-blur-dense` | `8px` | **New.** Reduced blur for information-dense panels (file tree, task list) |
| `--glass-blur-heavy` | `30px` | **New.** Modals, boot screen — stronger blur |

### Glass Utility Classes

| Class | Properties |
|---|---|
| `.glass` | `background: var(--color-surface); backdrop-filter: blur(var(--glass-blur)); border: 1px solid var(--color-border);` |
| `.glass-hover:hover` | `background: var(--color-surface-hover); border-color: var(--color-border-hover);` |
| `.glass-glow` | `box-shadow: var(--shadow-glow);` |
| `.glass-dense` | **New.** Same as `.glass` but with `--glass-blur-dense`. For compact/dense views. |
| `.glass-elevated` | **New.** `background: var(--color-surface-elevated); backdrop-filter: blur(var(--glass-blur-heavy));` For modals, dropdowns. |

---

## 6. Z-Index Tokens

From [LAYOUT_SYSTEM.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/02_LAYOUT_SYSTEM.md) Section 2 — formalized as tokens.

| Token | Value | Layer |
|---|---|---|
| `--z-wallpaper` | `0` | Desktop background |
| `--z-widgets` | `10` | Desktop widgets |
| `--z-chrome` | `50` | Top bar, Dock |
| `--z-panels` | `100` | Base z for application panels |
| `--z-dropdowns` | `300` | Context menus, dropdowns, tooltips |
| `--z-modals` | `400` | Confirmation dialogs, critical alerts |
| `--z-toasts` | `500` | Toast notifications |
| `--z-boot` | `1000` | Boot screen animation |

---

## 7. Transition Tokens

| Token | Value | Usage |
|---|---|---|
| `--transition-fast` | `100ms ease-out` | Micro-interactions: hover color, active press |
| `--transition-normal` | `200ms ease-out` | Default: button hover, panel focus, border change |
| `--transition-slow` | `300ms cubic-bezier(0.4, 0, 0.2, 1)` | Panel open/close, maximize/restore |

**Rule:** All `transition-duration` values in components must use these tokens. Custom durations are prohibited.

---

## 8. Token Addition Rules

When adding a new token:

1. **Check existing tokens first.** Does an existing token serve the purpose? If yes, use it.
2. **Name follows the pattern.** `--category-variant` (e.g., `--color-surface-hover`, `--shadow-lg`, `--space-4`).
3. **Define both themes.** Every color token must have dark mode and light mode values.
4. **Document the purpose.** Add it to this document with its usage description.
5. **Update index.css.** The `@theme` block is the implementation of this document.

### Prohibited Practices

| Practice | Why It's Banned |
|---|---|
| Raw hex/rgb values in components | Breaks theming. Must use tokens. |
| `px` values for text font-size | Breaks browser zoom. Use `rem`. |
| Custom `px` spacing outside the grid | Breaks visual rhythm. Use spacing tokens. |
| `z-index` outside defined ranges | Causes z-fighting. Use z-index tokens. |
| `transition` with custom durations | Breaks motion consistency. Use transition tokens. |

---

## 9. New Tokens (Implementation Required)

The following tokens are **new** — not yet in [index.css](file:///c:/Users/ritik/jarvis/AI%20OS/src/index.css). They must be added during implementation.

| Token | Status |
|---|---|
| `--color-surface-elevated` | New |
| `--color-border-focus` | New |
| `--color-success` | New |
| `--color-warning` | New |
| `--color-error` | New |
| `--color-info` | New |
| `--shadow-sm` | New |
| `--shadow-md` | New |
| `--shadow-lg` | New |
| `--glass-blur` (as token, not raw value) | New |
| `--glass-blur-dense` | New |
| `--glass-blur-heavy` | New |
| `--transition-fast` | New |
| `--transition-normal` | New |
| `--transition-slow` | New |
| All `--space-*` tokens | New (currently inline values) |
| All `--z-*` tokens | New (currently raw numbers) |

Existing tokens (`--color-primary`, `--color-surface`, `--color-text`, `--radius-*`) are already implemented and remain unchanged.

---

*This document defines every design token. For how typography tokens are applied, see [TYPOGRAPHY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/02_TYPOGRAPHY.md). For how animation tokens are used, see [MOTION_SYSTEM.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/04_MOTION_SYSTEM.md).*
