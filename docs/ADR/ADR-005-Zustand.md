# ADR-005: Zustand for State Management

> **Status:** ✅ Accepted  
> **Date:** 2026-07-10  
> **Deciders:** Project Owner + Principal Architect

---

## Context

AI OS needs client-side state management. v0.1 introduced Zustand with 2 stores (`appStore`, `chatStore`). v0.3.0 scales to 7+ stores with cross-store relationships (projects → files → tasks). The question: does Zustand scale, or should we switch?

## Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Zustand (keep)** | Already adopted, lightweight (1.2KB), no boilerplate, excellent TypeScript, simple API | Cross-store derived state requires custom hooks. No built-in devtools (community plugin exists). |
| **Redux Toolkit** | Industry standard, Redux DevTools, middleware ecosystem | Heavy boilerplate (slices, reducers, actions). Migration cost from Zustand. Overkill for client-only app. |
| **Jotai** | Atomic state model, fine-grained re-renders | Different mental model from current code. Atomic approach doesn't map well to domain stores. |
| **React Context** | Zero dependency | Poor performance at scale (re-renders entire tree). No built-in selectors. |

## Decision

**Keep Zustand 5.** One store per domain. Pure state containers (no side effects in stores).

## Consequences

### Positive

- **Zero migration cost.** Existing stores continue to work.
- **Minimal bundle impact.** 1.2KB vs Redux Toolkit's ~12KB.
- **Simple mental model.** Store is a function that returns state + mutations. No actions, reducers, or middleware.
- **Selectors are built-in.** `useStore(state => state.field)` prevents unnecessary re-renders.

### Negative

- **Cross-store coordination requires discipline.** No built-in mechanism for "when store A changes, update store B." This is handled by services (see ADR-002).
- **No built-in persistence middleware.** Zustand has a `persist` middleware, but we deliberately avoid it — persistence goes through the service → repository path.
- **Less ecosystem tooling than Redux.** Acceptable for project scale.

## References

- [ENGINEERING_DECISIONS.md Section 2.1](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md)
- [STATE_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/STATE_ARCHITECTURE.md)
