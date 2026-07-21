# ADR-001: Use Dexie.js for Client-Side Persistence

> **Status:** ✅ Accepted  
> **Date:** 2026-07-10  
> **Deciders:** Project Owner + Principal Architect

---

## Context

AI OS v0.3.0 introduces workspace persistence — projects, files, notes, tasks, settings, and memory must survive browser sessions. The v0.2 approach (`localStorage` for theme/wallpaper) does not scale: localStorage is synchronous, string-only, has a 5-10MB limit, and cannot be queried.

We need a structured, async, queryable client-side storage solution.

## Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Raw IndexedDB** | No dependency, full control | Verbose API, manual schema management, error-prone transaction handling |
| **Dexie.js** | Clean query API, built-in schema versioning/migrations, excellent TypeScript types, 45KB gzipped | External dependency, Dexie-specific patterns in repository layer |
| **idb** | Minimal wrapper (1.2KB), close to raw IndexedDB | No schema versioning, no migration support, limited query API |
| **OPFS (Origin Private File System)** | File-oriented, good for binary data | Limited browser support, not record-oriented, no query capability |
| **SQLite via WASM** | Full SQL query power, familiar to backend devs | Large WASM bundle (~1MB), complex setup, overkill for current data volume |

## Decision

**Use Dexie.js.**

## Consequences

### Positive

- Schema versioning and migration are built-in (`db.version(N).stores({}).upgrade()`).
- Query API maps cleanly to our repository pattern (`where().equals()`, compound indexes).
- TypeScript types eliminate a class of runtime errors.
- The repository abstraction layer isolates Dexie from workspace code — if we ever need to switch, only repositories change.

### Negative

- External dependency (45KB gzipped added to bundle).
- Dexie-specific patterns (compound index syntax, transaction API) in repository implementations.
- If Dexie is abandoned, we carry maintenance risk — mitigated by the repository abstraction.

## References

- [ENGINEERING_DECISIONS.md Section 3.1](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md)
- [DATABASE_DESIGN.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/DATABASE_DESIGN.md)
