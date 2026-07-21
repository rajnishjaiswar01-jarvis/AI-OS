# AI OS — Motion System

> **Document Type:** Visual Design System  
> **Phase:** 4B  
> **Status:** Active  
> **Last Updated:** 2026-07-11  
> **Depends On:** [DESIGN_TOKENS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/01_DESIGN_TOKENS.md), [DESIGN_PRINCIPLES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/00_DESIGN_PRINCIPLES.md), [PERFORMANCE_BUDGET.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/PERFORMANCE_BUDGET.md), [ACCESSIBILITY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/04_ACCESSIBILITY.md)  
> **Audience:** All engineers implementing animations and transitions

This document defines when, how, and how fast things move in AI OS. Motion communicates state changes (Design Principle 4: Motion Is Meaning). It never decorates.

---

## 1. Motion Philosophy

```text
                   Does this animation help the user
                   understand what just happened?
                            │
                     ┌──────┴──────┐
                     │             │
                    YES           NO
                     │             │
               Keep it.      Remove it.
```

Every animation in AI OS must answer "yes" to the question above. If the animation is purely aesthetic, it belongs only in the boot screen — nowhere else in the workspace.

---

## 2. Timing Tokens

From [DESIGN_TOKENS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/01_DESIGN_TOKENS.md):

| Token | Duration | Usage |
|---|---|---|
| `--transition-fast` | `100ms` | Micro-interactions: hover states, active press, toggle |
| `--transition-normal` | `200ms` | Default: panel focus, button hover, border change, selection |
| `--transition-slow` | `300ms` | Panel open/close, maximize/restore, major state changes |

### Why These Durations

- **100ms:** Feels instant but visible. User's muscle memory registers the change.
- **200ms:** Comfortable transition. Fast enough to not feel slow, slow enough to track.
- **300ms:** Maximum for workspace transitions. Beyond 300ms, users perceive waiting.
- **>300ms:** Only for boot screen. Never in the active workspace.

---

## 3. Easing Functions

| Name | CSS Value | Usage |
|---|---|---|
| `ease-out` | `ease-out` | Default for most transitions. Element decelerates into its final position — feels natural. |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Panel open/close. Smooth entry and exit. |
| `ease-in` | `ease-in` | Exit animations only (element leaving the screen). Never for entries. |
| `spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Dock icon bounce on hover. Slight overshoot for playful feedback. |

### Easing Rules

- **Entering elements use `ease-out`** — they decelerate into place.
- **Exiting elements use `ease-in`** — they accelerate away.
- **Bidirectional transitions (hover in/out) use `ease-out`** — same feel in both directions.
- **Never use `linear`** for UI transitions — it feels robotic. Linear is only for progress bars and loading indicators.

---

## 4. Animation Inventory

### 4.1 Existing Animations (from index.css)

| Animation | Keyframes | Duration | Current Usage |
|---|---|---|---|
| `fadeIn` | 0→1 opacity | 300ms | General fade entrance |
| `fadeOut` | 1→0 opacity | — | General fade exit |
| `slideUp` | +30px/0.95 → 0/1.0 | 300ms | Panel open |
| `slideDown` | 0/1.0 → +30px/0.95 | 200ms | Panel close |
| `breathe` | 1.0→1.05→1.0 scale + opacity | 4s infinite | Boot screen AI orb |
| `float` | 0→-6px→0 translateY | 3s infinite | Boot screen elements |
| `shimmer` | Background position sweep | — | Loading placeholder |
| `pulseFast` | 1.0→1.12→1.0 scale + opacity | 1.2s infinite | AI thinking state |
| `shake` | ±3px translateX | 0.5s | AI error state |
| `rotateGradient` | 0→360deg rotate | — | Boot screen gradient |
| `pulse-dot` | 1→0.5→1 opacity + scale | — | Typing indicator |
| `orbParticle` | 360deg orbit | — | Boot screen particles |
| `ripple` | 0.8→2.5 scale, 0.6→0 opacity | — | Boot screen effect |
| `progressBar` | 0→100% width | — | Boot screen loading |
| `auroraShift` | Background position loop | — | Boot screen aurora |
| `bootFadeOut` | 1→0 opacity, 1→1.05 scale | — | Boot screen exit |
| `typewriter` | 0→100% width | — | Boot screen text |
| `blink` | 1→0→1 opacity | — | Boot screen cursor |

### 4.2 Workspace Animations (v0.3.0)

These are the animations needed for workspace panels and interactions:

| Animation | Trigger | Properties | Duration | Easing |
|---|---|---|---|---|
| **Panel open** | Dock click (open new) | `opacity: 0→1, scale: 0.95→1, translateY: 20px→0` | 200ms | ease-in-out |
| **Panel close** | Close button, Ctrl+W | `opacity: 1→0, scale: 1→0.95, translateY: 0→20px` | 150ms | ease-in |
| **Panel minimize** | Minimize button | `opacity: 1→0, scale: 1→0.5` (toward dock position) | 200ms | ease-in |
| **Panel restore** | Dock click (restore minimized) | `opacity: 0→1, scale: 0.5→1` (from dock position) | 200ms | ease-out |
| **Panel maximize** | Maximize button | `width/height/position` transition to fill content area | 200ms | ease-in-out |
| **Panel unmaximize** | Maximize button (while max) | `width/height/position` transition to previous size | 200ms | ease-in-out |
| **Panel focus** | Click inside panel | `border-color` transition, `box-shadow` glow appear | 100ms | ease-out |
| **Button hover** | Mouse enter | `background-color`, `border-color` | 100ms | ease-out |
| **Button press** | Mouse down | `scale: 1→0.97` | 50ms | ease-out |
| **Button release** | Mouse up | `scale: 0.97→1` | 100ms | ease-out |
| **List item hover** | Mouse enter | `background-color` to `--color-surface-hover` | 100ms | ease-out |
| **Selection change** | Click/keyboard | `background-color` to `--color-surface-active` + accent border | 100ms | ease-out |
| **File creation** | New file added to tree | Brief highlight flash (green tint, 200ms) | 400ms total | ease-out |
| **Task completion** | Toggle complete | Checkmark appear + text strikethrough | 200ms | ease-out |
| **Task deletion (undo)** | Delete task | Slide out + collapse height | 200ms | ease-in |
| **Toast enter** | Notification triggered | Slide up + fade in from bottom-right | 200ms | ease-out |
| **Toast exit** | Auto-dismiss or manual | Fade out + slide right | 150ms | ease-in |
| **Context menu open** | Right-click | `opacity: 0→1, scale: 0.95→1` | 100ms | ease-out |
| **Context menu close** | Click/Escape | `opacity: 1→0` | 75ms | ease-in |
| **Tooltip show** | Hover (300ms delay) | `opacity: 0→1` | 100ms | ease-out |
| **Tooltip hide** | Mouse leave | `opacity: 1→0` | 75ms | ease-in |
| **Modal open** | Confirmation triggered | Backdrop fade in + dialog scale up | 200ms | ease-in-out |
| **Modal close** | Cancel/confirm | Backdrop fade out + dialog scale down | 150ms | ease-in |
| **Theme switch** | Toggle theme | CSS custom property change (instant) | 0ms | — |
| **Inline edit enter** | F2 / double-click | Text → input crossfade | 100ms | ease-out |
| **Search bar expand** | Ctrl+F | Height expand + fade in input | 150ms | ease-out |

---

## 5. Animation Categories

From [ACCESSIBILITY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/04_ACCESSIBILITY.md) Section 5:

| Category | `prefers-reduced-motion` Behavior |
|---|---|
| **Decorative** (boot screen only) | Removed entirely. Instant state change. |
| **Transitional** (panel open/close, maximize) | Reduced to instant or 50ms fade. |
| **Feedback** (hover, press, selection) | Retained but near-instant. |
| **Informational** (loading spinner, typing indicator) | Retained (essential state). May simplify to static. |

### Reduced Motion Implementation

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

---

## 6. Boot Screen vs. Workspace

The boot screen is the **one exception** to the "motion is meaning" rule. It is a cinematic moment — the only place in AI OS where decorative animation is permitted.

| Property | Boot Screen | Workspace |
|---|---|---|
| Decorative animation | ✅ Allowed | ❌ Prohibited |
| Animation duration > 300ms | ✅ Allowed (up to seconds) | ❌ Prohibited |
| Infinite animations | ✅ Allowed (orb, particles) | ❌ Only for loading/status indicators |
| Complex multi-step sequences | ✅ Allowed | ❌ Prohibited |

Once the boot screen fades out, all remaining animations follow workspace rules.

---

## 7. Performance Constraints

From [PERFORMANCE_BUDGET.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/PERFORMANCE_BUDGET.md):

| Constraint | Value |
|---|---|
| Target frame rate | 60fps (16.67ms per frame) |
| Maximum animation duration (workspace) | 300ms |
| Maximum simultaneous CSS animations | 3 (avoid compounding GPU load) |
| GPU-composited properties only | `transform`, `opacity`. Never animate `width`, `height`, `top`, `left` (causes layout thrash). |
| `backdrop-filter: blur()` during animation | Reduce blur radius or disable blur during panel transitions on integrated GPUs |

### GPU-Friendly Properties

| ✅ Animate | ❌ Never Animate |
|---|---|
| `transform` (translate, scale, rotate) | `width`, `height` |
| `opacity` | `top`, `left`, `right`, `bottom` |
| `box-shadow` (with caution) | `margin`, `padding` |
| `border-color` | `font-size` |
| `background-color` (solid) | `backdrop-filter` (during transition) |

**Exception:** Panel maximize/unmaximize animates `width`/`height`/`position`. This is acceptable because it's a single element transitioning, not a layout-affecting change to many elements. Use `will-change: width, height` to hint the browser.

---

## 8. Motion Rules Summary

| Rule | Rationale |
|---|---|
| Every animation answers "what changed?" | Motion is meaning, not decoration |
| Maximum 300ms for workspace transitions | Beyond 300ms, users perceive delay |
| `ease-out` is the default easing | Natural deceleration feels right for most transitions |
| Never use `linear` for UI transitions | Feels robotic and unnatural |
| Animate `transform` and `opacity` only | GPU-composited; no layout thrash |
| `prefers-reduced-motion` is mandatory | Accessibility requirement, not optional |
| Boot screen is the only decorative exception | One cinematic moment, then workspace rules apply |
| Tooltip hover delay: 300ms | Prevents flicker on accidental hover |
| No animation plays purely to look cool | If you can't explain what it communicates, remove it |

---

*This document defines motion behavior. For the timing tokens it uses, see [DESIGN_TOKENS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/01_DESIGN_TOKENS.md). For how animations interact with components, see [COMPONENT_LIBRARY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/05_COMPONENT_LIBRARY.md). For accessibility constraints, see [ACCESSIBILITY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/04_ACCESSIBILITY.md) Section 5.*
