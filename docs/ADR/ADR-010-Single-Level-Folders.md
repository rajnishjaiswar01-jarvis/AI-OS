# ADR-010: Single-Level Folder Hierarchy for v0.3 Files

> **Status:** ✅ Accepted  
> **Date:** 2026-08-16  
> **Deciders:** Project Owner + Principal Architect  
> **Sprint:** 4 — Files Workspace

---

## Context

Sprint 4 introduces the Files module — the first feature in AI OS that requires **hierarchical data** rather than flat entities. Notes and Tasks both use flat lists scoped by `projectId`. Files need folders.

The question: how deep does the hierarchy go in v0.3.0?

This decision also affects:
- Data model complexity (flat vs. recursive)
- Rename/move operations (single entity vs. descendant cascades)
- Delete semantics (single row vs. recursive)
- Test surface area
- Future upgrade path to full filesystem

## Options Considered

| Option | Usefulness | Complexity | Risk | Upgrade Path |
|--------|-----------|------------|------|-------------|
| **Flat files only** — no folders, like Notes with extensions | Low | Very Low | None | Must introduce folders later from scratch |
| **Single-level folders** — files at root or inside one folder, no nesting | Good | Low | Low–Medium | Add depth by relaxing the constraint |
| **Full recursive tree** — arbitrary nesting depth | Complete | High | **High** — path cascades, recursive deletion, move semantics | N/A (already there) |

## Decision

**Single-level folders with `parentId` identity. Maximum hierarchy depth of 1. Paths are derived, not authoritative.**

### Data Model

```ts
FileEntry {
  id: string           // Primary key (UUID v4)
  projectId: string    // Foreign key to Project
  parentId: string | null  // null = project root, non-null = inside a folder
  name: string         // Display name (e.g., "report.md")
  type: "file" | "folder"
  content: string      // Text content (empty string for folders)
  isDeleted: boolean   // Soft delete flag
  createdAt: string    // ISO 8601
  updatedAt: string    // ISO 8601
}
```

### Depth Constraint

```text
parentId === null       → entity lives at project root
parentId !== null       → entity's parent MUST be a root-level folder
                          (parent.parentId === null AND parent.type === "folder")
```

This means:

```text
✅ Project Root → File
✅ Project Root → Folder → File
❌ Project Root → Folder → Folder        (nested folder)
❌ Project Root → Folder → Folder → File (deep nesting)
```

### Path Is Derived, Not Stored

The displayed breadcrumb path is computed at read time:

```text
id="abc123", parentId="folder456", name="report.md"
folder456.name = "Documents"

Display path → Documents / report.md
```

No `path` column exists. Rename a folder = update one row. No descendant cascade.

## Consequences

### Positive

- **Controlled complexity.** No recursive queries, no path rewriting, no cascade deletes beyond one level.
- **Clean upgrade path.** Relaxing the depth constraint from 1 → N in a future version requires only removing the validation guard in the service layer. The data model (`id + parentId`) already supports arbitrary depth.
- **Same architectural pattern.** Repository → Service → Store → UI — identical to Notes and Tasks.
- **Predictable test surface.** Folder CRUD, file CRUD, parent validation, depth guard, project isolation. No tree traversal tests needed.

### Negative

- **Limited organization.** Users cannot create nested subfolder structures (e.g., `src/components/ui/Button.tsx`). This is acceptable for v0.3.0.
- **Folders cannot contain folders.** May feel restrictive to power users. Mitigated: v0.4+ can relax this.

## Invariants (v0.3 Files)

These invariants MUST hold in all code paths:

1. **Depth-1 maximum.** `fileService.create()` MUST reject any entity whose `parentId` references a non-root entity.
2. **Folders are content-less.** `type === "folder"` implies `content === ""`. Service MUST enforce this.
3. **Folder deletion cascades children.** Deleting a folder soft-deletes all files inside it.
4. **Name uniqueness within scope.** No two non-deleted entities with the same `parentId` and `name` (case-insensitive) in the same project.
5. **parentId referential integrity.** If `parentId !== null`, the referenced entity MUST exist, be non-deleted, be a folder, be at root level, AND belong to the same project.
6. **No Notes migration.** Notes table and Files table are independent. No unification in v0.3.
7. **Filename validation.** Names must be trimmed, non-empty, and must not contain `/` or `\` characters.
8. **Case-insensitive uniqueness.** `README.md` and `readme.md` are considered duplicates within the same parent. Original casing is preserved for display.
9. **No restoration in v0.3.** Soft-deleted entries are excluded from all normal queries and cannot be restored through the UI.

## References

- [ADR-001: Use Dexie.js](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ADR/ADR-001-Use-Dexie.md)
- [ADR-002: Repository Pattern](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ADR/ADR-002-Repository-Pattern.md)
- [FOUNDATION_FREEZE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/FOUNDATION_FREEZE.md)
