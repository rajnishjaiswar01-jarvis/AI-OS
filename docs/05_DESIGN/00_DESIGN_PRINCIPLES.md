# AI OS — Design Principles

> **Document Type:** Visual Design Framework  
> **Phase:** 4B  
> **Status:** Active  
> **Last Updated:** 2026-07-11  
> **Depends On:** [UX_PRINCIPLES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/00_UX_PRINCIPLES.md), [VISION_LOCK.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/VISION_LOCK.md)  
> **Audience:** All engineers and designers implementing visual components

These principles define the visual philosophy of AI OS. Where [UX Principles](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/00_UX_PRINCIPLES.md) define *behavior*, these define *appearance*. When two valid visual approaches exist, these principles determine which one wins.

---

## Principle 1: Glass Is the Medium

### Statement

Glass-morphism is not a decorative layer — it is the visual identity of AI OS. Every surface that contains content uses glass properties: translucency, blur, and bordered containment.

### Why

The Vision Lock (Section 7.4) establishes glass-morphism as the design language. It was introduced in v0.1 and is the primary visual differentiator from default browser UI. Abandoning it for productivity panels would fragment the visual identity.

### Practical Impact

- All panels, cards, modals, tooltips, and dropdowns use the `.glass` utility (translucent background + backdrop blur + border).
- Glass intensity varies by context: chrome elements (dock, top bar) are full-strength; information-dense panels (file tree, task list) reduce blur for readability.
- Glass surfaces never float without borders — the `var(--color-border)` token provides containment on every glass element.
- New components that break the glass aesthetic require documented justification.

### Constraint

Glass-morphism must never compromise text readability. If contrast fails on a glass surface, increase the surface opacity — do not switch to a solid background. See [ACCESSIBILITY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/04_ACCESSIBILITY.md) Section 4.2.

---

## Principle 2: Dark Is Default

### Statement

AI OS is designed dark-first. Light mode is a supported alternative, not a co-equal design target.

### Why

The developer-builder audience (primary users per [PRODUCT_SPECIFICATION.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/PRODUCT_SPECIFICATION.md) Section 3) predominantly uses dark interfaces. Glass-morphism aesthetics — glows, subtle gradients, translucent depth — are more expressive against dark backgrounds. Light mode exists for accessibility and preference, but every design decision is first validated in dark mode.

### Practical Impact

- All design tokens define dark mode values first. Light mode overrides via `[data-theme="light"]`.
- Screenshots, demos, and documentation visuals use dark mode by default.
- Color choices are optimized for dark-on-dark readability first, then tested in light mode.
- The light theme is intentionally muted — it does not attempt the same level of visual drama as dark mode. Glass effects become subtle shadows; glows become soft borders.

---

## Principle 3: Depth Through Layers

### Statement

Visual hierarchy in AI OS is communicated through stacked layers, not through flat color differentiation. Elements that are "higher" in importance are visually elevated through blur, shadow, and translucency changes.

### Why

The desktop metaphor places panels on a workspace — inherently a layered model. Traditional flat design communicates hierarchy through bold colors and size. AI OS communicates it through depth: the focused panel has more glow, the dock has stronger blur, modals dim the backdrop.

### Practical Impact

- Z-index is tied to visual intensity: higher z-index = more glow, sharper shadow, brighter border.
- Focused panels have an accent-colored border glow. Unfocused panels have a neutral border.
- Modals dim the entire backdrop (overlay at 20–40% black).
- Overlapping elements (dropdowns, context menus) are visually distinct from their parent through stronger glass effects.
- Shadows increase with elevation: panels have medium shadows, modals have heavy shadows, tooltips have light shadows.

---

## Principle 4: Motion Is Meaning

### Statement

Animations exist to communicate state changes, not to decorate. Every animation must answer: "What did this help the user understand?"

### Why

Unnecessary animations slow perceived performance and annoy power users. Meaningful animations — panel sliding open, element fading out on deletion — communicate spatial relationships and confirm actions. The [PERFORMANCE_BUDGET.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/PERFORMANCE_BUDGET.md) caps animation duration at 300ms for transitions; decorative animations that exceed this are wasteful.

### Practical Impact

- Entry animations: scale up + fade in (200–300ms). Confirms "something appeared."
- Exit animations: scale down + fade out (150–200ms). Confirms "something was removed."
- State changes: color/opacity transitions (100–200ms). Confirms "something changed."
- No animation should play purely for aesthetics in the workspace. Boot screen is the one exception.
- All animations respect `prefers-reduced-motion` (see [ACCESSIBILITY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/04_ACCESSIBILITY.md) Section 5).

---

## Principle 5: Color Is Purposeful

### Statement

Colors communicate function. Decorative color variation is minimized. The palette is intentionally narrow to maintain visual cohesion.

### Why

A workspace with many colored elements becomes visually noisy. AI OS uses a limited palette: one primary color (blue), one accent color (purple), semantic colors (success, warning, error), and a neutral grayscale for text/surfaces. This restraint ensures that when color appears, it communicates something specific.

### Practical Impact

- **Primary (blue):** Interactive elements, focus indicators, active states, links.
- **Accent (purple):** Branding, gradient endpoints, secondary emphasis.
- **Success (green):** Task completion, save confirmation.
- **Warning (amber):** Quota warnings, degraded states.
- **Error (red):** Destructive actions, errors, failures.
- **Neutral (white/black with opacity):** Text, surfaces, borders — the majority of the UI.
- No component introduces a new color outside this palette without a documented reason.

---

## Principle 6: Typography Is Hierarchy

### Statement

Type scale creates visual hierarchy. Size, weight, and opacity — not color — differentiate heading from body from caption.

### Why

Using color for text hierarchy conflicts with Principle 5 (Color Is Purposeful) and creates accessibility issues. Using size and weight alone creates a hierarchy that works in both dark and light mode, passes contrast checks, and scales predictably with browser font size changes.

### Practical Impact

- Three text tokens: `--color-text` (primary), `--color-text-secondary` (labels, metadata), `--color-text-muted` (placeholders, hints).
- Two font families: `Inter` for UI text, `JetBrains Mono` for code/data.
- Hierarchy is communicated through: font size → font weight → text opacity. In that order.
- Bold text is reserved for headings and emphasis — not for making normal text "look important."
- See [TYPOGRAPHY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/02_TYPOGRAPHY.md) for the complete type scale.

---

## Principle 7: Consistency Over Novelty

### Statement

Every component should look like it belongs to the same family. Visual consistency across the entire workspace is more important than any individual component looking impressive.

### Why

AI OS has 14+ components already, growing to 30+ in v0.3.0. If each component innovates its own visual approach, the workspace feels fragmented. Users should never notice the boundary between components — everything should feel like "one app."

### Practical Impact

- All interactive elements use the same border-radius system (`--radius-sm` through `--radius-full`).
- All surfaces use the same glass properties (surface token + blur + border).
- All hover states follow the same pattern: background changes to `--color-surface-hover`, border to `--color-border-hover`.
- All transitions use the same duration (200ms) and easing (`ease-out` or `cubic-bezier(0.4, 0, 0.2, 1)`).
- Spacing follows the 8px grid from [LAYOUT_SYSTEM.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/02_LAYOUT_SYSTEM.md) Section 7.
- New components are built from existing tokens and primitives. Custom values are prohibited unless no existing token fits.

---

## Principle Summary Table

| # | Principle | One-line Rule |
|---|---|---|
| 1 | Glass Is the Medium | Every surface uses glass-morphism |
| 2 | Dark Is Default | Design for dark mode first, adapt to light |
| 3 | Depth Through Layers | Hierarchy through elevation, not flat color |
| 4 | Motion Is Meaning | Animate to communicate, never to decorate |
| 5 | Color Is Purposeful | Narrow palette, each color has a function |
| 6 | Typography Is Hierarchy | Size and weight, not color, create hierarchy |
| 7 | Consistency Over Novelty | Same family, same patterns, no visual outliers |

---

*These principles constrain all Phase 4B documents (Tokens, Typography, Icons, Motion, Components). They do not prescribe specific values — that's what the individual design system documents do. These prescribe the philosophy behind those values.*
