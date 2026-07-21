# ADR-002: Mandatory Four-Layer Repository Pattern

> **Status:** ✅ Accepted  
> **Date:** 2026-07-10  
> **Deciders:** Project Owner (initiated) + Principal Architect

---

## Context

AI OS needs a data access strategy. Components need workspace data (projects, files, tasks). That data lives in IndexedDB via Dexie.js. The question: how many layers of abstraction between a React component and the database?

The project owner identified this as a critical architectural decision based on cloud sync readiness and long-term maintainability.

## Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Component → Dexie** (direct) | Simplest, fewest files | Zero separation. Cloud sync requires touching every component. Untestable without real DB. |
| **Component → Store → Dexie** (2-layer) | State management separated | Business logic leaks into stores or components. Persistence logic scattered. |
| **Component → Service → Dexie** (3-layer) | Business logic centralized | No pure state layer. Components must manage their own state. |
| **Component → Store → Service → Repository → Dexie** (4-layer) | Full separation. Each layer has one job. | More files, more indirection for simple CRUD. |

## Decision

**Mandatory four-layer stack: Component → Store → Service → Repository → Dexie.**

```text
Component    ✅ Renders UI, reads store, calls services
Store        ✅ Holds in-memory state, pure mutations
Service      ✅ Business logic, orchestration, calls repositories
Repository   ✅ Data access, Dexie queries, transactions
Dexie        ✅ Storage engine
```

## Consequences

### Positive

- **Cloud sync readiness.** When cloud sync is added, only repositories change. Services, stores, and components remain untouched.
- **Testability.** Repositories can be mocked. Services can be tested without a database. Stores can be tested without side effects.
- **Dexie swappability.** If Dexie is ever replaced (SQLite WASM, OPFS), only the repository layer is rewritten.
- **Clear debugging.** When something breaks, the layer where it broke is immediately identifiable.

### Negative

- **More boilerplate.** A "create task" flow touches 4 files instead of 1.
- **Potential over-engineering for v0.3.0.** The project is single-developer. The four-layer pattern is designed for team scale and long-term maintenance.
- **Learning curve.** Contributors must understand which layer owns which responsibility.

### Mitigations

- Consistent naming conventions (`*Store.ts`, `*Service.ts`, `*Repository.ts`) make the pattern self-documenting.
- The folder architecture places all layers for a feature in one directory — cognitive overhead is low.

## References

- [ENGINEERING_DECISIONS.md Section 4.1](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md)
- [SYSTEM_ARCHITECTURE.md Section 2](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/SYSTEM_ARCHITECTURE.md)
- [SERVICE_REPOSITORY_LAYER.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/SERVICE_REPOSITORY_LAYER.md)
