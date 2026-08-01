# Foundation Freeze

> **Status:** Frozen as of Sprint 1E  
> **Tag:** `v0.3.0-foundation`  
> **Date:** 2026-08-02  
> **Tests:** 87 passing

The contracts below are frozen. Changes to any of these require an [ADR](ADR/).

---

## Frozen Contracts

### ✓ Repository Pattern

```
Feature Module → Repository → Dexie
```

All persistence goes through repository classes. No module accesses `db` tables directly.

- [settingsRepository.ts](../src/core/db/settingsRepository.ts)
- [projectRepository.ts](../src/features/projects/projectRepository.ts)

### ✓ Service Layer

```
Component → Service → Store + Repository
```

Business logic lives in services. Components never call repositories or mutate stores directly.

- [projectService.ts](../src/features/projects/projectService.ts)
- [windowManager.ts](../src/shell/windowManager.ts)

### ✓ Provider Registry

```
registerApp() → getApp() → AppDefinition
```

All apps are registered at boot time via `registerBuiltinApps()`. The registry is a `Map<string, AppDefinition>`, not a Zustand store.

- [registry.ts](../src/core/registry/registry.ts)
- [registerApps.ts](../src/core/registry/registerApps.ts)

### ✓ Window Lifecycle

```
open → focus → minimize → restore → close
```

Window Manager is the only orchestration layer. Desktop never imports the registry. See [WINDOW_MANAGER_INVARIANTS.md](WINDOW_MANAGER_INVARIANTS.md).

- [windowManager.ts](../src/shell/windowManager.ts)

### ✓ Window Store API

```
addWindow | removeWindow | focusWindow | setWindowState
```

These four mutations are the complete surface area. No additional mutations without an ADR.

- [windowStore.ts](../src/shell/windowStore.ts)

### ✓ Dexie Schema (v1)

```
projects:  id, name, createdAt, updatedAt
settings:  key
memory:    ++id, category, createdAt
```

New tables (notes, files, tasks) are added via `this.version(2).stores(...)`. Existing table schemas are not modified without a migration.

- [database.ts](../src/core/db/database.ts)
- [types.ts](../src/core/db/types.ts)

### ✓ Folder Structure

```
src/
├── ai/           # AI layer
├── core/         # Infrastructure (db, registry, config, hooks, errors, types, utils)
├── features/     # Feature modules (projects, settings, notes, files, tasks, memory)
├── shell/        # Desktop shell (window manager, components)
├── ui/           # Reusable UI primitives
└── test/         # Test setup
```

New feature modules go in `src/features/<name>/`. New shell components go in `src/shell/components/`.

### ✓ Vision Lock

The product vision, principles, and design constraints are frozen in:

- [VISION_LOCK.md](VISION_LOCK.md)
- [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md)

---

## What This Means for Sprint 2

Sprint 2 (Notes, Files, Tasks, Memory) **plugs into** these contracts:

1. Create `src/features/notes/` with its own store, service, repository
2. Add a `notes` table via `this.version(2).stores(...)` in `database.ts`
3. Register the Notes app in `registerApps.ts`
4. The Notes window opens through `windowManager.open('notes')`

No foundation code should need modification.

If it does, that's a signal to write an ADR before proceeding.
