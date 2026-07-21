# ADR-006: UUID v4 for Entity Identification

> **Status:** ✅ Accepted  
> **Date:** 2026-07-10  
> **Deciders:** Project Owner + Principal Architect

---

## Context

Every entity in AI OS (projects, files, tasks) needs a unique identifier. The choice of ID strategy affects future capabilities — particularly cross-device sync, offline-first operation, and data portability.

## Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Auto-increment (IndexedDB native)** | Simple, compact, human-readable | Collisions across devices. Sync requires ID remapping. Central authority needed. |
| **UUID v4** | Globally unique, no central authority, sync-safe, native browser API | Longer (36 chars), not sortable by creation time, not human-readable |
| **nanoid** | Shorter (21 chars), URL-safe, faster generation | External dependency. No practical advantage in IndexedDB (storage is cheap). |
| **ULID** | Sortable by time, globally unique | External dependency. Time-sortability not needed (we have `createdAt` fields). |
| **Timestamp-based** | Simple, sortable | Collisions in same-millisecond creation. Not sync-safe. |

## Decision

**UUID v4 everywhere.** Generated via `crypto.randomUUID()` (native browser API, zero dependencies).

No auto-increment. No timestamps as IDs. No nanoid.

## Consequences

### Positive

- **Sync-safe from day one.** Two devices creating entities offline will never collide. Future cloud sync doesn't require ID migration.
- **No external dependency.** `crypto.randomUUID()` is a native Web API.
- **Collision probability negligible.** 2^122 possible UUIDs. Would need ~2.7 quintillion IDs for 50% collision probability.

### Negative

- **Storage cost.** 36 bytes per ID vs 4-8 bytes for auto-increment. Irrelevant at our data scale.
- **Not sortable.** Cannot derive creation order from IDs alone. Mitigated by `createdAt` timestamp on every entity.
- **Not human-readable.** `f47ac10b-58cc-4372-a567-0e02b2c3d479` is not user-friendly. Users never see IDs directly.

## References

- [ENGINEERING_DECISIONS.md Section 3.2](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md)
- [DATABASE_DESIGN.md Section 3](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/DATABASE_DESIGN.md)
