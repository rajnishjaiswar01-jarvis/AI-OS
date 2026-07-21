# AI OS — Service & Repository Layer

> **Document Type:** Technical Foundation  
> **Phase:** 2.6 + 2.7  
> **Status:** Active  
> **Last Updated:** 2026-07-10  
> **Depends On:** [SYSTEM_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/SYSTEM_ARCHITECTURE.md), [DATABASE_DESIGN.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/DATABASE_DESIGN.md), [STATE_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/STATE_ARCHITECTURE.md)

---

## 1. Repository Layer

### 1.1 Purpose

Repositories are the **only** layer that touches Dexie. They translate between the database world (Dexie tables, indexes, transactions) and the domain world (typed objects that services understand).

### 1.2 Repository Inventory

| Repository | Location | Table | Domain |
|---|---|---|---|
| `projectRepository` | `src/features/projects/projectRepository.ts` | `projects` | Project CRUD |
| `fileRepository` | `src/features/files/fileRepository.ts` | `files` | File/folder CRUD, tree queries |
| `taskRepository` | `src/features/tasks/taskRepository.ts` | `tasks` | Task CRUD, filtered queries |
| `settingsRepository` | `src/features/settings/settingsRepository.ts` | `settings` | Key-value settings |
| `memoryRepository` | `src/features/memory/memoryRepository.ts` | `memory` | Key-value workspace memory |

### 1.3 Standard Repository Interface

Every repository follows the same method pattern. Naming is consistent across all repositories.

```typescript
// Generic pattern — each repository implements the methods relevant to its domain
interface RepositoryPattern<T> {
  findById(id: string): Promise<T | undefined>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<void>;              // Insert or update (upsert)
  remove(id: string): Promise<void>;
}
```

### 1.4 Repository Specifications

#### projectRepository

```typescript
// Methods
findById(id: string): Promise<Project | undefined>
findAll(): Promise<Project[]>
save(project: Project): Promise<void>
remove(id: string): Promise<void>
```

#### fileRepository

```typescript
// Methods
findById(id: string): Promise<FileEntry | undefined>
findByProject(projectId: string): Promise<FileEntry[]>
findChildren(projectId: string, parentId: string | null): Promise<FileEntry[]>
save(file: FileEntry): Promise<void>
remove(id: string): Promise<void>
removeByProject(projectId: string): Promise<void>

// Note: file content (Blob) is stored as part of the FileEntry.
// Reading text: const text = await file.content.text();
```

#### taskRepository

```typescript
// Methods
findById(id: string): Promise<Task | undefined>
findByProject(projectId: string): Promise<Task[]>
findByProjectAndStatus(projectId: string, status: TaskStatus): Promise<Task[]>
save(task: Task): Promise<void>
remove(id: string): Promise<void>
removeByProject(projectId: string): Promise<void>
```

#### settingsRepository

```typescript
// Methods (key-value pattern, not entity pattern)
get<T>(key: string): Promise<T | undefined>
getAll(): Promise<Record<string, unknown>>
set(key: string, value: unknown): Promise<void>
remove(key: string): Promise<void>
```

#### memoryRepository

```typescript
// Methods (key-value pattern)
get<T>(key: string): Promise<T | undefined>
getAll(): Promise<Record<string, unknown>>
set(key: string, value: unknown): Promise<void>
remove(key: string): Promise<void>
```

### 1.5 Error Handling

Repositories catch Dexie-specific errors and translate them to generic `RepositoryError`:

```typescript
class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;
  readonly retryable: boolean;

  constructor(message: string, code: RepositoryErrorCode, retryable = false) {
    super(message);
    this.name = 'RepositoryError';
    this.code = code;
    this.retryable = retryable;
  }
}

type RepositoryErrorCode =
  | 'NOT_FOUND'
  | 'CONSTRAINT_ERROR'    // e.g., duplicate key
  | 'QUOTA_EXCEEDED'
  | 'TRANSACTION_FAILED'
  | 'STORAGE_ERROR';      // generic catch-all
```

### 1.6 Transaction Pattern

Multi-table operations use Dexie transactions. The repository exposes this when services need atomicity:

```typescript
// fileRepository — used by projectService for cascade delete
async removeByProjectInTransaction(
  projectId: string,
  transaction: Dexie.Transaction
): Promise<void> {
  await transaction.table('files')
    .where('projectId')
    .equals(projectId)
    .delete();
}
```

---

## 2. Service Layer

### 2.1 Purpose

Services are the **brain** of each feature. They enforce business rules, orchestrate multi-step operations, call repositories for persistence, and update stores on success.

### 2.2 Service Inventory

| Service | Location | Responsibility |
|---|---|---|
| `projectService` | `src/features/projects/projectService.ts` | Project CRUD, switching, cascade deletes |
| `fileService` | `src/features/files/fileService.ts` | File/folder CRUD, move, content read/write |
| `taskService` | `src/features/tasks/taskService.ts` | Task CRUD, status toggling |
| `settingsService` | `src/features/settings/settingsService.ts` | Settings read/write, theme application |
| `memoryService` | `src/features/memory/memoryService.ts` | Recent items tracking, session restore |
| `initializationService` | `src/core/initializationService.ts` | Boot sequence, migration, store hydration |

### 2.3 Service Specifications

#### projectService

```typescript
// Methods
createProject(name: string): Promise<Project>
renameProject(id: string, name: string): Promise<void>
deleteProject(id: string): Promise<void>          // Cascade: deletes files + tasks
switchProject(id: string): Promise<void>           // Updates project, file, task stores
getActiveProject(): Project | null                 // Reads from store (sync)
ensureDefaultProject(): Promise<void>              // Creates "My Workspace" if none exist
```

**Business rules:**
- Project name must be non-empty and trimmed.
- Project name must be unique (case-insensitive).
- Deleting the active project switches to the next available project (or creates default).
- Switching project loads files and tasks for the new project and updates 3 stores.

#### fileService

```typescript
// Methods
createFile(projectId: string, parentId: string | null, name: string, content?: string): Promise<FileEntry>
createFolder(projectId: string, parentId: string | null, name: string): Promise<FileEntry>
renameFile(id: string, name: string): Promise<void>
moveFile(id: string, newParentId: string | null): Promise<void>
deleteFile(id: string): Promise<void>              // If folder: recursive delete of children
readContent(id: string): Promise<string>           // Blob → text
writeContent(id: string, content: string): Promise<void>  // text → Blob, updates size
getFileTree(projectId: string): Promise<FileEntry[]>
```

**Business rules:**
- File/folder names must be non-empty.
- No duplicate names within the same parent folder.
- File extensions are part of the name (e.g., `notes.md`).
- Deleting a folder recursively deletes all children.
- Moving a file into itself or its own children is prohibited (cycle prevention).
- `writeContent` updates `size` and `updatedAt` automatically.

#### taskService

```typescript
// Methods
createTask(projectId: string, title: string): Promise<Task>
updateTask(id: string, updates: { title?: string; description?: string; priority?: TaskPriority; dueDate?: number | null }): Promise<void>
toggleStatus(id: string): Promise<void>            // todo ↔ done
deleteTask(id: string): Promise<void>
getTasksByProject(projectId: string): Promise<Task[]>
```

**Business rules:**
- Task title must be non-empty.
- Toggling to `done` sets `completedAt`. Toggling back to `todo` clears `completedAt`.
- `updatedAt` is set on every mutation.

#### settingsService

```typescript
// Methods
loadAll(): Promise<void>                           // Hydrates settingsStore from repository
getTheme(): Theme
setTheme(theme: Theme): Promise<void>              // Persists + updates store + applies to DOM
getWallpaper(): Wallpaper
setWallpaper(wallpaper: Wallpaper): Promise<void>
getActiveProviderId(): string | null
setActiveProviderId(id: string | null): Promise<void>
```

**Business rules:**
- `setTheme` must also call `document.documentElement.setAttribute('data-theme', theme)` — this is a documented exception where a service touches the DOM, because theme application is a cross-cutting concern.

#### memoryService

```typescript
// Methods
loadAll(): Promise<void>                           // Hydrates memoryStore from repository
recordRecentProject(projectId: string): Promise<void>
recordRecentFile(projectId: string, fileId: string): Promise<void>
getLastActiveProjectId(): string | null
savePanelState(panels: PanelInfo[]): Promise<void>
loadPanelState(): Promise<PanelInfo[]>
```

**Business rules:**
- Recent lists have a max length (10 projects, 20 files). Oldest entries are evicted.
- Panel state is saved on panel change (debounced) and on window `beforeunload`.

#### initializationService

```typescript
// Methods
boot(): Promise<BootResult>

interface BootResult {
  success: boolean;
  migrated: boolean;         // Whether localStorage migration occurred
  projectCount: number;
  error?: string;
}
```

**Boot sequence (ordered):**

1. Acquire multi-tab lock (Web Locks API). If lock unavailable → show "already open" warning, halt.
2. Open Dexie database (triggers schema migration if needed).
3. Run `localStorage` → Dexie migration (one-time, idempotent).
4. Load settings → hydrate `settingsStore`.
5. Load memory → hydrate `memoryStore`.
6. Load projects → hydrate `projectStore`.
7. Determine active project (from memory or first project or create default).
8. Load files and tasks for active project → hydrate `fileStore`, `taskStore`.
9. Load panel state → hydrate `shellStore`.
10. Register AI providers (from settings, if configured).
11. Set `booted = true`.

---

## 3. Cross-Feature Operations

Some operations span multiple features. These are handled by the originating service, which calls other repositories (not other services — to avoid circular dependencies).

| Operation | Originating Service | Repositories Involved |
|---|---|---|
| Delete project | `projectService` | `projectRepository`, `fileRepository`, `taskRepository`, `memoryRepository` |
| Switch project | `projectService` | `projectRepository`, `fileRepository`, `taskRepository` |
| Delete folder (recursive) | `fileService` | `fileRepository` (queries children, deletes tree) |
| Record recent file | `memoryService` | `memoryRepository` |

**Cycle prevention rule:** Service A may import Repository B, but Service A must never import Service B. If two services need to coordinate, extract the shared logic into a third service or use an event pattern (future).

---

## 4. Validation Pattern

All validation happens in the service layer. Repositories do not validate. Components do not validate (they may do client-side form validation for UX, but the service is the authoritative validator).

```typescript
// Service validates before persisting
function createTask(projectId: string, title: string): Promise<Task> {
  // Validation
  const trimmed = title.trim();
  if (!trimmed) {
    throw new DomainError('Task title cannot be empty', 'VALIDATION_ERROR');
  }
  if (trimmed.length > 500) {
    throw new DomainError('Task title too long (max 500 characters)', 'VALIDATION_ERROR');
  }

  // Creation
  const task: Task = {
    id: crypto.randomUUID(),
    projectId,
    title: trimmed,
    description: '',
    status: 'todo',
    priority: null,
    dueDate: null,
    completedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Persist → then update store
  await taskRepository.save(task);
  useTaskStore.getState().addTask(task);

  return task;
}
```

---

## 5. Error Types

```typescript
class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly retryable: boolean;

  constructor(message: string, code: DomainErrorCode, retryable = false) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.retryable = retryable;
  }
}

type DomainErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'DUPLICATE_NAME'
  | 'OPERATION_FAILED'
  | 'CYCLE_DETECTED'      // Move file into its own subtree
  | 'STORAGE_FULL';
```

**Error flow:** Repository throws `RepositoryError` → Service catches, translates to `DomainError` → Component catches, displays in UI.

---

## Document Metadata

| | |
|---|---|
| **Dependencies** | System Architecture (layer rules), Database Design (tables, record types), State Architecture (stores that services update), Engineering Decisions (four-layer stack) |
| **Used By** | Components (call services), Interface Contracts (typed interfaces), AI Layer (reads workspace data through service interfaces) |
| **Future Versions** | v0.4 adds AI-related services. v0.5 adds terminal/editor services. v0.6 adds plugin service for third-party extensions. Service pattern scales by adding new services — existing services remain stable. |
| **Breaking Change Risk** | **Medium** — Adding new services is safe. Changing service method signatures requires updating all calling components. Changing repository interfaces requires updating all calling services. |
