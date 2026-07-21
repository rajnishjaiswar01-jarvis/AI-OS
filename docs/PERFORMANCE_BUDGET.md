# AI OS — Performance Budget

> **Document Type:** Performance Specification  
> **Phase:** 4A (Supporting Document)  
> **Status:** Active  
> **Last Updated:** 2026-07-11  
> **Depends On:** [SYSTEM_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/SYSTEM_ARCHITECTURE.md), [ENGINEERING_DECISIONS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md)  
> **Audience:** All engineers, UX architects, and designers

This document defines performance targets that constrain both design and implementation decisions. Every target here is a contract — if a feature cannot meet its budget, the feature ships later, not broken.

**Scope:** This document defines *what* the targets are. *How* to achieve them (lazy loading, code splitting, virtualization, caching) is deferred to Phase 6 ([PERFORMANCE_GUIDELINES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/DOCUMENTATION_PHASES.md)).

---

## 1. Core Interaction Metrics

These are the perceived performance targets. Every user-facing operation must meet its budget on a mid-range device (Intel i5 / Ryzen 5, 8GB RAM, integrated GPU, Chrome latest stable).

| Metric | Target | Measurement |
|---|---|---|
| Initial load (cold start) | < 2 s | Time from URL entry to interactive desktop |
| Initial load (warm, cached) | < 800 ms | Time from URL entry to interactive desktop with service worker cache |
| Workspace switch | < 100 ms | Time from switch action to new workspace content rendered |
| Panel open | < 80 ms | Time from dock click to panel visible with content |
| Panel close | < 50 ms | Time from close action to panel removed from DOM |
| Note open | < 50 ms | Time from file tree click to note content rendered in editor |
| Note save (auto) | < 30 ms | Time from debounced save trigger to IndexedDB write confirmed |
| File tree expand | < 30 ms | Time from folder click to children rendered |
| Task list render | < 50 ms | Time to render up to 100 tasks in a project |
| Search (local) | < 200 ms | Time from query input to results displayed |
| Chat message send | < 100 ms | Time from send action to message in UI (not AI response) |
| Chat UI render | < 100 ms | Time to render up to 50 messages in conversation |
| Settings toggle | < 16 ms | Time from toggle to visual change (single frame) |
| Theme switch | < 50 ms | Time from theme toggle to full repaint complete |

### Why These Specific Numbers

- **< 100 ms:** Feels instant. User perceives no delay. (Jakob Nielsen's response time thresholds)
- **< 200 ms:** Feels fast. User notices it's not instant but doesn't feel waited.
- **< 2 s:** Acceptable for initial load. Above 3 s, bounce rates increase significantly.
- **< 16 ms:** Single frame at 60fps. Required for operations that must feel synchronous.

---

## 2. Rendering Budget

| Metric | Target |
|---|---|
| Target frame rate | 60 fps (16.67 ms per frame) |
| Maximum long task | 50 ms (Web Vitals threshold) |
| First Contentful Paint (FCP) | < 1.2 s |
| Largest Contentful Paint (LCP) | < 2.0 s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Interaction to Next Paint (INP) | < 200 ms |

### Panel Rendering

Every panel (app window) must render its initial content within its budget. If a panel has expensive initialization (e.g., loading a large file tree), it must:

1. Show a skeleton/placeholder immediately (< 16 ms).
2. Load content progressively.
3. Never block the main thread during loading.

---

## 3. Memory Budget

| Metric | Target |
|---|---|
| Peak JS heap (typical workspace) | < 80 MB |
| Peak JS heap (heavy workspace: 5+ panels open) | < 150 MB |
| DOM nodes (desktop with 3 panels open) | < 3,000 |
| DOM nodes (maximum) | < 5,000 |

### What Counts as "Typical"

A typical workspace has:
- 1 project with 20–50 files
- 2–3 panels open simultaneously
- 1 active note in editor
- 30–50 tasks
- Chat with up to 50 messages visible

---

## 4. Storage Budget

| Metric | Target |
|---|---|
| IndexedDB read (single record) | < 5 ms |
| IndexedDB write (single record) | < 20 ms |
| IndexedDB bulk read (50 records) | < 50 ms |
| IndexedDB bulk write (50 records) | < 100 ms |
| Storage quota warning threshold | 80% of available quota |
| Maximum single file size | 10 MB |
| Maximum total storage per workspace | 500 MB |

### Dexie Transaction Rules

- Reads are expected to be fast (IndexedDB + Dexie optimizes reads heavily).
- Writes should use Dexie transactions for bulk operations.
- No synchronous `localStorage` access on the hot path. All persistence flows through `async` repositories.

---

## 5. Design Implications

Each performance target directly constrains UX and architectural decisions.

| Target | Design Constraint |
|---|---|
| Workspace switch < 100 ms | Panel state must be cached in memory, not reconstructed from IndexedDB on every switch. Zustand stores hydrate once; subsequent switches read from cache. |
| Panel open < 80 ms | Panel content must render with data already in the store. No synchronous DB reads during panel open. Store hydration happens at workspace load, not panel open. |
| Note open < 50 ms | Note content (Blob) should be pre-fetched or fetched on file tree hover, not on click. Editor must initialize without blocking render. |
| File tree expand < 30 ms | File tree children must be in memory. Deep folder structures may require virtualized rendering if they exceed 200 items at one level. |
| Task list render < 50 ms | Lists with 100+ items need virtualization (only render visible rows). React window or similar. |
| Search < 200 ms | In-memory search for v0.3.0. Full-text index (Dexie `where` or dedicated search index) for v0.4+. |
| DOM nodes < 3,000 | Virtualize long lists. Collapse off-screen panel content. Don't render minimized panels to DOM. |
| Theme switch < 50 ms | CSS custom properties only. No JavaScript-driven style recalculation. Theme change = update `data-theme` attribute. CSS handles the rest. |

---

## 6. Virtualization Thresholds

Virtualization (rendering only visible items) is required when a list exceeds these counts:

| List Type | Virtualization Threshold |
|---|---|
| File tree items (flat count in expanded view) | > 200 items |
| Task list | > 100 items |
| Chat messages | > 100 messages |
| Search results | > 50 results |

Below these thresholds, standard DOM rendering is acceptable.

---

## 7. Anti-Patterns

These patterns violate the performance budget and must not appear in the codebase.

| Anti-Pattern | Why It's Banned | Alternative |
|---|---|---|
| Synchronous IndexedDB read during render | Blocks main thread, causes visible jank | Hydrate store at workspace load; components read from store |
| Re-rendering entire panel on any state change | Wastes render cycles | Use Zustand selectors — `useStore(state => state.specificField)` |
| Unbounded DOM list rendering | DOM node count explodes; layout/paint becomes expensive | Virtualize at threshold (Section 6) |
| Storing large Blobs in Zustand | JS heap bloats; GC pressure increases | Store Blobs in IndexedDB only; keep references (IDs) in store |
| CSS `filter: blur()` on large elements during animation | GPU memory spike; dropped frames on integrated GPUs | Apply blur to fixed-size elements only; reduce blur radius during animation |
| Full re-hydration on panel open | Defeats the < 80 ms panel open budget | Hydrate at workspace load; panels read from already-warm stores |
| `setInterval` polling for state changes | Unnecessary CPU usage; battery drain | Use Zustand subscriptions or event-driven patterns |

---

## 8. Measurement Strategy

### Development

- **React DevTools Profiler:** Monitor render counts and durations during development.
- **Chrome DevTools Performance tab:** Profile long tasks and layout thrashing.
- **`performance.mark()` / `performance.measure()`:** Instrument critical paths (workspace switch, panel open, note load).

### CI / Automated (Future — Phase 6)

- Lighthouse CI for Web Vitals.
- Bundle size tracking per commit.
- Automated performance regression tests.

---

## 9. Deferred to Phase 6

The following performance concerns require implementation-level decisions and are tracked in the [DOCUMENTATION_PHASES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/DOCUMENTATION_PHASES.md) under Phase 6.

| Concern | Why Deferred |
|---|---|
| Lazy loading strategy | Requires knowing the final component tree |
| Code splitting boundaries | Requires knowing feature module sizes |
| Service worker caching strategy | Requires knowing asset structure |
| Bundle size budget (per-route) | Requires implementation to measure |
| Lighthouse score targets | Requires a running build to baseline |
| Pre-fetching strategy | Requires understanding actual user navigation patterns |

---

*This document defines the "what" — the performance bar. Phase 6 defines the "how." If a feature cannot meet its budget during implementation, escalate to the project owner — do not silently ship a slow feature.*
