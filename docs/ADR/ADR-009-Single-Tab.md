# ADR-009: Single-Tab Enforcement

> **Status:** ✅ Accepted  
> **Date:** 2026-07-10  
> **Deciders:** Project Owner + Principal Architect

---

## Context

AI OS runs in a browser tab with IndexedDB as its database. If a user opens two tabs, both instances write to the same IndexedDB — without coordination. This causes silent data overwrites: Tab A saves a file, Tab B saves a different version, Tab A's changes are lost.

## Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Ignore the problem** | Zero effort | Data corruption. Users lose work without warning. Unacceptable. |
| **Multi-tab sync (BroadcastChannel + CRDT)** | Full multi-tab support | Complex (conflict resolution, operational transforms). Massive scope increase. Unnecessary for v0.3.0. |
| **Single-tab enforcement (detect and warn)** | Simple. Prevents data corruption. Low effort (~2 hours). | Users can't use multiple tabs. Acceptable — AI OS is a workspace, not a multi-window app. |

## Decision

**Single-tab enforcement.** The first tab acquires a lock via the Web Locks API. Subsequent tabs detect the lock and display: "AI OS is already open in another tab." The second tab does not write to the database.

## Consequences

### Positive

- **Data corruption prevented.** Only one tab writes to IndexedDB at any time.
- **Simple implementation.** `navigator.locks.request()` is a few lines of code.
- **Clear user communication.** The warning explains what happened and what to do (switch to the other tab).

### Negative

- **No multi-tab workflow.** Users can't open AI OS in two tabs. This is acceptable for v0.3.0.
- **Tab crash may hold lock.** If the first tab crashes without releasing the lock, the lock may persist briefly. Web Locks API handles this automatically — locks are released when the tab's browsing context is destroyed.

### Future

This can be replaced with proper multi-tab sync (SharedWorker or BroadcastChannel + conflict resolution) if user demand justifies it. The guard is a lightweight solution, not a permanent architecture.

## References

- [ENGINEERING_DECISIONS.md Section 9.1](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md)
- [ARCHITECTURE_REVIEW.md Section 5.1](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ARCHITECTURE_REVIEW.md)
