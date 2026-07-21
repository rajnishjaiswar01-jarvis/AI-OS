# ADR-007: Feature-Based Folder Structure

> **Status:** ✅ Accepted  
> **Date:** 2026-07-10  
> **Deciders:** Project Owner + Principal Architect

---

## Context

AI OS v0.2 uses a flat component-based structure: all components in `src/components/`, all stores in `src/stores/`, all services in `src/services/`. v0.3.0 expands from 2 features to 7+. A flat structure would create directories with 20+ files, making it hard to find related code.

## Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Flat by type** (`components/`, `stores/`, `services/`) | Familiar, easy to find "all stores" | Cross-feature files mixed together. Adding a feature means touching 4+ directories. Doesn't scale past 10 features. |
| **Feature-based** (`features/projects/`, `features/files/`) | Co-locates related code. Adding a feature = adding one directory. Scales to 20+ features. | Must establish import rules to prevent cross-feature coupling. |
| **Domain-driven** (separate packages per domain) | Maximum isolation. Independent deployment possible. | Over-engineering for a single-app SPA. Package management overhead. |

## Decision

**Feature-based.** Each domain gets one directory under `src/features/` containing its components, store, service, repository, and types.

Four zones: `src/core/` (shared), `src/features/` (workspace modules), `src/ai/` (AI layer), `src/shell/` (desktop chrome). Plus `src/ui/` (shared components) and `src/debug/` (dev tools).

## Consequences

### Positive

- **Co-location.** Everything about "tasks" lives in `src/features/tasks/`. No hunting across directories.
- **Self-contained features.** Deleting `src/features/tasks/` removes the entire task feature with no leftover files.
- **Clear module boundaries.** Import rules (feature A cannot import feature B's internals) are enforceable by directory structure.
- **Scales linearly.** v0.5 adds `src/features/terminal/`, v0.6 adds `src/plugins/`. No existing directories change.

### Negative

- **v0.2 → v0.3 migration required.** All existing files must be moved from flat structure to feature directories. One-time cost.
- **Import paths are longer.** `../../../ui/GlassButton` vs `../../GlassButton`. Mitigated by path aliases if needed.
- **Cross-feature code needs explicit home.** Shared hooks go in `src/core/hooks/`, not in any feature directory.

## References

- [ENGINEERING_DECISIONS.md Section 5.1](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md)
- [FOLDER_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/FOLDER_ARCHITECTURE.md)
