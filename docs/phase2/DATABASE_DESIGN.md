# AI OS — Database Design

> **Document Type:** Technical Foundation  
> **Phase:** 2.4  
> **Status:** Active  
> **Last Updated:** 2026-07-10  
> **Depends On:** [ENGINEERING_DECISIONS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md) (Dexie.js, UUID v4, Blob-first), [SYSTEM_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/SYSTEM_ARCHITECTURE.md)

---

## 1. Database Technology

| Property | Value |
|---|---|
| Engine | IndexedDB (browser native) |
| Wrapper | Dexie.js |
| Schema Version | 1 (v0.3.0 initial) |
| ID Strategy | UUID v4 via `crypto.randomUUID()` |
| File Content | Blob storage (all file types, including text) |
| Database Name | `aios-workspace` |

---

## 2. Schema Definition

### 2.1 Dexie Schema (Version 1)

```typescript
import Dexie, { type Table } from 'dexie';

class AIOSDatabase extends Dexie {
  projects!: Table<ProjectRecord>;
  files!: Table<FileRecord>;
  tasks!: Table<TaskRecord>;
  settings!: Table<SettingRecord>;
  memory!: Table<MemoryRecord>;

  constructor() {
    super('aios-workspace');

    this.version(1).stores({
      projects: 'id, name, createdAt, updatedAt',
      files: 'id, projectId, parentId, name, type, [projectId+parentId], createdAt, updatedAt',
      tasks: 'id, projectId, status, [projectId+status], createdAt',
      settings: 'key',
      memory: 'key',
    });
  }
}

export const db = new AIOSDatabase();
```

### 2.2 Index Design Rationale

| Table | Index | Purpose |
|---|---|---|
| **projects** | `id` (PK) | Primary lookup |
| | `name` | Display sorting |
| | `createdAt`, `updatedAt` | Chronological sorting |
| **files** | `id` (PK) | Primary lookup |
| | `projectId` | "All files in project X" |
| | `parentId` | "All children of folder Y" |
| | `[projectId+parentId]` | Compound: "Children of folder Y in project X" (file tree rendering) |
| | `name` | Alphabetical sorting within folder |
| | `type` | Filter by file vs. folder |
| **tasks** | `id` (PK) | Primary lookup |
| | `projectId` | "All tasks in project X" |
| | `status` | Filter by completion status |
| | `[projectId+status]` | Compound: "Incomplete tasks in project X" |
| | `createdAt` | Chronological sorting |
| **settings** | `key` (PK) | Lookup by setting key (e.g., `theme`, `wallpaper`) |
| **memory** | `key` (PK) | Lookup by memory key (e.g., `lastActiveProject`, `recentFiles`) |

---

## 3. Record Types

These are the **storage-level** types — what goes into and comes out of Dexie. Domain types (used by services and components) may differ and are defined in [INTERFACE_CONTRACTS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/INTERFACE_CONTRACTS.md).

### 3.1 ProjectRecord

```typescript
interface ProjectRecord {
  id: string;              // UUID v4
  name: string;            // User-visible project name
  createdAt: number;       // Unix timestamp (ms)
  updatedAt: number;       // Unix timestamp (ms)
}
```

### 3.2 FileRecord

```typescript
type FileType = 'file' | 'folder';

interface FileRecord {
  id: string;              // UUID v4
  projectId: string;       // FK → projects.id
  parentId: string | null; // FK → files.id (null = project root)
  name: string;            // File/folder name including extension
  type: FileType;          // 'file' or 'folder'
  mimeType: string | null; // e.g., 'text/markdown', 'text/plain' (null for folders)
  content: Blob | null;    // File content as Blob (null for folders)
  size: number;            // Content size in bytes (0 for folders)
  createdAt: number;       // Unix timestamp (ms)
  updatedAt: number;       // Unix timestamp (ms)
}
```

**Design notes:**
- `parentId: null` means the file/folder is at the project root.
- Folders have `content: null` and `size: 0`.
- Text files are stored as Blobs. Reading text: `await file.content.text()`.
- `mimeType` enables future file-type-specific rendering (markdown preview, image display, etc.).

### 3.3 TaskRecord

```typescript
type TaskStatus = 'todo' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | null;

interface TaskRecord {
  id: string;              // UUID v4
  projectId: string;       // FK → projects.id
  title: string;           // Task title
  description: string;     // Task description (may be empty)
  status: TaskStatus;      // 'todo' or 'done'
  priority: TaskPriority;  // Optional priority level
  dueDate: number | null;  // Unix timestamp (ms), null = no due date
  completedAt: number | null; // When the task was completed
  createdAt: number;       // Unix timestamp (ms)
  updatedAt: number;       // Unix timestamp (ms)
}
```

### 3.4 SettingRecord

```typescript
interface SettingRecord {
  key: string;             // Setting identifier (PK)
  value: unknown;          // Setting value (any serializable type)
  updatedAt: number;       // Unix timestamp (ms)
}
```

**Known keys for v0.3.0:**

| Key | Type | Default |
|---|---|---|
| `theme` | `'dark' \| 'light'` | `'dark'` |
| `wallpaper` | `'space' \| 'aurora'` | `'space'` |
| `activeProviderId` | `string \| null` | `null` |

The key-value design allows new settings to be added without schema migrations.

### 3.5 MemoryRecord

```typescript
interface MemoryRecord {
  key: string;             // Memory identifier (PK)
  value: unknown;          // Memory value (any serializable type)
  updatedAt: number;       // Unix timestamp (ms)
}
```

**Known keys for v0.3.0:**

| Key | Type | Description |
|---|---|---|
| `lastActiveProjectId` | `string` | Project ID to restore on startup |
| `recentProjects` | `string[]` | Ordered list of recently accessed project IDs |
| `recentFiles` | `{ projectId: string; fileId: string }[]` | Recently opened files |
| `panelState` | `PanelState[]` | Open panels, positions, sizes for session restore |

---

## 4. Relationships

```text
ProjectRecord (1)
    │
    ├──── (many) FileRecord    [projectId → projects.id]
    │         │
    │         └──── (many) FileRecord    [parentId → files.id]  (nested folders)
    │
    └──── (many) TaskRecord    [projectId → projects.id]


SettingRecord — standalone key-value (no relationships)
MemoryRecord  — standalone key-value (no relationships)
```

**Referential integrity:** IndexedDB does not enforce foreign keys. Cascading deletes must be handled at the service layer (e.g., deleting a project must explicitly delete all its files and tasks).

---

## 5. Common Query Patterns

### 5.1 File Tree for a Project

```typescript
// Get all children of a folder (or project root)
const children = await db.files
  .where('[projectId+parentId]')
  .equals([projectId, parentId ?? null])
  .sortBy('name');
```

### 5.2 All Tasks for a Project

```typescript
const tasks = await db.tasks
  .where('projectId')
  .equals(projectId)
  .toArray();
```

### 5.3 Incomplete Tasks for a Project

```typescript
const incompleteTasks = await db.tasks
  .where('[projectId+status]')
  .equals([projectId, 'todo'])
  .toArray();
```

### 5.4 Get a Setting

```typescript
const setting = await db.settings.get(key);
return setting?.value ?? defaultValue;
```

### 5.5 Delete a Project (Cascade)

```typescript
// Must be done in a transaction for atomicity
await db.transaction('rw', [db.projects, db.files, db.tasks], async () => {
  await db.files.where('projectId').equals(projectId).delete();
  await db.tasks.where('projectId').equals(projectId).delete();
  await db.projects.delete(projectId);
});
```

---

## 6. Migration Strategy

### 6.1 v0.2 → v0.3 Migration (localStorage to Dexie)

Existing v0.2 users have theme and wallpaper in `localStorage`:

```typescript
// One-time migration during app initialization
async function migrateFromLocalStorage(): Promise<void> {
  const theme = localStorage.getItem('ai-os-theme');
  const wallpaper = localStorage.getItem('ai-os-wallpaper');

  if (theme) {
    await db.settings.put({
      key: 'theme',
      value: theme,
      updatedAt: Date.now(),
    });
    localStorage.removeItem('ai-os-theme');
  }

  if (wallpaper) {
    await db.settings.put({
      key: 'wallpaper',
      value: wallpaper,
      updatedAt: Date.now(),
    });
    localStorage.removeItem('ai-os-wallpaper');
  }
}
```

### 6.2 Future Schema Versions

```typescript
// Example: Adding a 'tags' index to tasks in a future version
this.version(2).stores({
  tasks: 'id, projectId, status, [projectId+status], createdAt, *tags',
}).upgrade(async (tx) => {
  // Migrate existing tasks to have empty tags array
  await tx.table('tasks').toCollection().modify((task) => {
    task.tags = [];
  });
});
```

---

## 7. Storage Considerations

### 7.1 Limits

| Browser | IndexedDB Limit |
|---|---|
| Chrome/Edge | ~80% of available disk |
| Firefox | ~2GB (can be increased by user) |
| Safari | ~1GB |

### 7.2 Monitoring

```typescript
const estimate = await navigator.storage.estimate();
const usedMB = (estimate.usage ?? 0) / (1024 * 1024);
const quotaMB = (estimate.quota ?? 0) / (1024 * 1024);
const percentUsed = ((estimate.usage ?? 0) / (estimate.quota ?? 1)) * 100;
```

Display in Debug Panel. Show warning when usage exceeds 80% of quota.

### 7.3 Data Safety

- Use Dexie transactions for multi-table operations (cascade deletes, project switches).
- Never store data in `localStorage` for new features. All new state goes through the repository layer → Dexie.
- The `memory` table acts as a session recovery mechanism — if the browser crashes, workspace state can be restored from the last known memory snapshot.

---

## Document Metadata

| | |
|---|---|
| **Dependencies** | Engineering Decisions (Dexie.js, UUID v4, Blob-first, schema versioning), System Architecture (layer responsibilities) |
| **Used By** | Repository Layer (queries these tables), Service Layer (orchestrates operations), State Architecture (stores are hydrated from this data) |
| **Future Versions** | v0.4 may add AI memory tables. v0.5 may add code file metadata. v0.6 plugin data tables. Schema versioning handles all additions. |
| **Breaking Change Risk** | **High** — Record type changes after data exists require migrations. Getting the v1 schema right is critical. |
