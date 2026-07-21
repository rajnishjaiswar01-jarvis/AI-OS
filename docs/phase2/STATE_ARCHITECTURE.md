# AI OS — State Architecture

> **Document Type:** Technical Foundation  
> **Phase:** 2.5  
> **Status:** Active  
> **Last Updated:** 2026-07-10  
> **Depends On:** [ENGINEERING_DECISIONS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md) (Zustand 5), [SYSTEM_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/SYSTEM_ARCHITECTURE.md), [DATABASE_DESIGN.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/DATABASE_DESIGN.md)

---

## 1. Store Inventory

Each domain gets one Zustand store. Stores are pure state containers — no side effects, no persistence, no API calls.

| Store | Location | Domain | Hydrated From |
|---|---|---|---|
| `useProjectStore` | `src/features/projects/projectStore.ts` | Project management | `projectRepository` via `projectService` |
| `useFileStore` | `src/features/files/fileStore.ts` | Virtual file system | `fileRepository` via `fileService` |
| `useTaskStore` | `src/features/tasks/taskStore.ts` | Task management | `taskRepository` via `taskService` |
| `useSettingsStore` | `src/features/settings/settingsStore.ts` | User preferences | `settingsRepository` via `settingsService` |
| `useMemoryStore` | `src/features/memory/memoryStore.ts` | Workspace memory | `memoryRepository` via `memoryService` |
| `useShellStore` | `src/shell/shellStore.ts` | Desktop shell state | `memoryRepository` (panel state) |
| `useChatStore` | `src/ai/chat/chatStore.ts` | AI chat | In-memory only (not persisted in v0.3.0) |

---

## 2. Store Definitions

### 2.1 useProjectStore

```typescript
interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;

  // Mutations (called by projectService, never directly by components)
  setProjects: (projects: Project[]) => void;
  setActiveProject: (id: string) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
}
```

**Derived state (via selectors):**

```typescript
// Custom hook — not inside the store
function useActiveProject(): Project | null {
  const { projects, activeProjectId } = useProjectStore();
  return projects.find(p => p.id === activeProjectId) ?? null;
}
```

### 2.2 useFileStore

```typescript
interface FileState {
  files: FileEntry[];           // Files for the active project
  expandedFolders: Set<string>; // UI state: which folders are expanded

  setFiles: (files: FileEntry[]) => void;
  addFile: (file: FileEntry) => void;
  updateFile: (id: string, updates: Partial<FileEntry>) => void;
  removeFile: (id: string) => void;
  removeByProject: (projectId: string) => void;
  toggleFolder: (folderId: string) => void;
}
```

**Note:** `files` contains only files for the currently active project. Switching projects replaces this array entirely (via `setFiles`). No cross-project file state in memory.

### 2.3 useTaskStore

```typescript
interface TaskState {
  tasks: Task[];                // Tasks for the active project

  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  removeByProject: (projectId: string) => void;
}
```

**Derived state:**

```typescript
function useIncompleteTasks(): Task[] {
  const tasks = useTaskStore(state => state.tasks);
  return tasks.filter(t => t.status === 'todo');
}

function useTaskStats(): { total: number; done: number; todo: number } {
  const tasks = useTaskStore(state => state.tasks);
  const done = tasks.filter(t => t.status === 'done').length;
  return { total: tasks.length, done, todo: tasks.length - done };
}
```

### 2.4 useSettingsStore

```typescript
interface SettingsState {
  theme: Theme;
  wallpaper: Wallpaper;
  activeProviderId: string | null;

  setTheme: (theme: Theme) => void;
  setWallpaper: (wallpaper: Wallpaper) => void;
  setActiveProvider: (providerId: string | null) => void;
  hydrate: (settings: Record<string, unknown>) => void;
}
```

**Note:** `hydrate` is called once during boot by `settingsService` after reading from `settingsRepository`. Individual setters are called by `settingsService` when the user changes a setting.

### 2.5 useMemoryStore

```typescript
interface MemoryState {
  lastActiveProjectId: string | null;
  recentProjects: string[];
  recentFiles: { projectId: string; fileId: string }[];

  setLastActiveProject: (id: string) => void;
  addRecentProject: (id: string) => void;
  addRecentFile: (projectId: string, fileId: string) => void;
  hydrate: (data: Record<string, unknown>) => void;
}
```

### 2.6 useShellStore

```typescript
interface PanelInfo {
  id: string;          // Panel instance ID
  appId: string;       // Which app this panel runs (e.g., 'files', 'tasks', 'chat')
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
}

interface ShellState {
  booted: boolean;
  panels: PanelInfo[];
  zOrder: string[];        // Panel IDs in z-order (last = on top)

  setBooted: () => void;
  openPanel: (appId: string) => void;
  closePanel: (panelId: string) => void;
  minimizePanel: (panelId: string) => void;
  restorePanel: (panelId: string) => void;
  bringToFront: (panelId: string) => void;
  updatePanelPosition: (panelId: string, position: { x: number; y: number }) => void;
  updatePanelSize: (panelId: string, size: { width: number; height: number }) => void;
  hydrateFromMemory: (panels: PanelInfo[]) => void;
}
```

### 2.7 useChatStore

```typescript
// Existing from v0.2 — migrated to src/ai/chat/chatStore.ts
interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  aiStatus: AiStatus;
  sessionTokens: TokenUsage;

  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAiStatus: (status: AiStatus) => void;
  addTokenUsage: (usage: TokenUsage) => void;
  removeLastAssistantMessage: () => void;
  clearChat: () => void;
  clearError: () => void;
}
```

---

## 3. Cross-Store Patterns

### 3.1 Rule: No Direct Store-to-Store Imports

Stores must never import other stores. Cross-store coordination happens in:

1. **Services** — for persistence-related coordination (e.g., switching projects updates multiple stores).
2. **Custom hooks** — for read-only derived state (e.g., combining project and task data for display).

### 3.2 Custom Hooks for Cross-Store Reads

```typescript
// src/core/hooks/useWorkspaceContext.ts
function useWorkspaceContext() {
  const activeProject = useActiveProject();          // from projectStore
  const tasks = useTaskStore(state => state.tasks);  // from taskStore
  const files = useFileStore(state => state.files);  // from fileStore

  return {
    project: activeProject,
    taskCount: tasks.length,
    fileCount: files.filter(f => f.type === 'file').length,
  };
}
```

### 3.3 Services for Cross-Store Writes

When an operation affects multiple stores, the service is the coordinator:

```typescript
// projectService.switchProject(id) — updates 3 stores
async function switchProject(id: string): Promise<void> {
  const project = await projectRepository.findById(id);
  const files = await fileRepository.findByProject(id);
  const tasks = await taskRepository.findByProject(id);

  projectStore.setActiveProject(id);
  fileStore.setFiles(files);
  taskStore.setTasks(tasks);
  memoryService.recordRecentProject(id);
}
```

---

## 4. Hydration Flow (Boot Sequence)

On app startup, stores begin empty and are hydrated from the database:

```text
App mounts
    │
    ▼
initializationService.boot()
    │
    ├── settingsRepository.getAll()
    │   └── settingsStore.hydrate(settings)
    │
    ├── memoryRepository.getAll()
    │   └── memoryStore.hydrate(memory)
    │
    ├── projectRepository.findAll()
    │   └── projectStore.setProjects(projects)
    │
    ├── Determine activeProjectId (from memory or first project)
    │   └── projectStore.setActiveProject(id)
    │
    ├── fileRepository.findByProject(activeProjectId)
    │   └── fileStore.setFiles(files)
    │
    ├── taskRepository.findByProject(activeProjectId)
    │   └── taskStore.setTasks(tasks)
    │
    ├── memoryRepository.get('panelState')
    │   └── shellStore.hydrateFromMemory(panels)
    │
    └── shellStore.setBooted()
```

---

## 5. Persistence Sync Pattern

When a service modifies data, it always persists first, then updates the store:

```text
Service receives action
    │
    ├── Validate input
    │
    ├── Repository.save(data)    ← Persist first
    │       │
    │       ├── Success → Store.update(data)    ← Then update state
    │       │
    │       └── Failure → throw DomainError     ← State unchanged
    │
    └── Return result to component
```

**Why persist-first?** If the store updates before persistence succeeds, the UI shows data that doesn't exist in the database. On next refresh, that data disappears — confusing the user. By persisting first, the store always reflects what's actually saved.

---

## Document Metadata

| | |
|---|---|
| **Dependencies** | Engineering Decisions (Zustand 5, store rules), System Architecture (layer responsibilities), Database Design (record types that hydrate stores) |
| **Used By** | Service Layer (updates stores), Components (reads stores), Interface Contracts (store interfaces) |
| **Future Versions** | v0.4 may add `useAiMemoryStore`. v0.5 may add `useTerminalStore`, `useEditorStore`. Store architecture scales by adding new stores — existing stores remain unchanged. |
| **Breaking Change Risk** | **Medium** — Adding new stores is safe. Changing existing store shapes requires updating all consuming components and services. |
