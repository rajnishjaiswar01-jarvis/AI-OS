# AI OS — Interface Contracts

> **Document Type:** Technical Foundation  
> **Phase:** 2.9  
> **Status:** Active  
> **Last Updated:** 2026-07-10  
> **Depends On:** [DATABASE_DESIGN.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/DATABASE_DESIGN.md), [STATE_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/STATE_ARCHITECTURE.md), [SERVICE_REPOSITORY_LAYER.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/SERVICE_REPOSITORY_LAYER.md), [AI_LAYER_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/AI_LAYER_ARCHITECTURE.md)

This document defines every TypeScript interface that crosses a module boundary. These are **contracts** — changing them requires updating all implementors and consumers.

No implementation logic. Only types, interfaces, and enums.

---

## 1. Domain Entities

These are the types used by services, stores, and components. They are the "language" of the workspace.

**Location:** `src/features/[module]/types.ts`

### 1.1 Project

```typescript
// src/features/projects/types.ts

interface Project {
  readonly id: string;
  name: string;
  readonly createdAt: number;
  updatedAt: number;
}
```

### 1.2 FileEntry

```typescript
// src/features/files/types.ts

type FileType = 'file' | 'folder';

interface FileEntry {
  readonly id: string;
  readonly projectId: string;
  parentId: string | null;
  name: string;
  readonly type: FileType;
  mimeType: string | null;
  content: Blob | null;
  size: number;
  readonly createdAt: number;
  updatedAt: number;
}
```

### 1.3 Task

```typescript
// src/features/tasks/types.ts

type TaskStatus = 'todo' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | null;

interface Task {
  readonly id: string;
  readonly projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: number | null;
  completedAt: number | null;
  readonly createdAt: number;
  updatedAt: number;
}
```

### 1.4 Settings Types

```typescript
// src/features/settings/types.ts

type Theme = 'dark' | 'light';
type Wallpaper = 'space' | 'aurora';

interface AppSettings {
  theme: Theme;
  wallpaper: Wallpaper;
  activeProviderId: string | null;
}
```

### 1.5 Memory Types

```typescript
// src/features/memory/types.ts

interface RecentFileRef {
  projectId: string;
  fileId: string;
}

interface WorkspaceMemory {
  lastActiveProjectId: string | null;
  recentProjects: string[];
  recentFiles: RecentFileRef[];
}
```

---

## 2. Common Types

Shared across all modules.

**Location:** `src/core/types/common.ts`

```typescript
// Branded type aliases for clarity (not runtime enforcement)
type UUID = string;
type Timestamp = number;        // Unix milliseconds

// Pagination (future-proofing — not used in v0.3.0)
interface PaginatedResult<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}
```

---

## 3. Repository Interfaces

Every repository follows these typed contracts. Services depend on these interfaces — not on concrete classes.

**Location:** `src/features/[module]/[name]Repository.ts`

### 3.1 ProjectRepository

```typescript
interface IProjectRepository {
  findById(id: UUID): Promise<Project | undefined>;
  findAll(): Promise<Project[]>;
  save(project: Project): Promise<void>;
  remove(id: UUID): Promise<void>;
}
```

### 3.2 FileRepository

```typescript
interface IFileRepository {
  findById(id: UUID): Promise<FileEntry | undefined>;
  findByProject(projectId: UUID): Promise<FileEntry[]>;
  findChildren(projectId: UUID, parentId: UUID | null): Promise<FileEntry[]>;
  save(file: FileEntry): Promise<void>;
  remove(id: UUID): Promise<void>;
  removeByProject(projectId: UUID): Promise<void>;
}
```

### 3.3 TaskRepository

```typescript
interface ITaskRepository {
  findById(id: UUID): Promise<Task | undefined>;
  findByProject(projectId: UUID): Promise<Task[]>;
  findByProjectAndStatus(projectId: UUID, status: TaskStatus): Promise<Task[]>;
  save(task: Task): Promise<void>;
  remove(id: UUID): Promise<void>;
  removeByProject(projectId: UUID): Promise<void>;
}
```

### 3.4 SettingsRepository

```typescript
interface ISettingsRepository {
  get<T>(key: string): Promise<T | undefined>;
  getAll(): Promise<Record<string, unknown>>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
}
```

### 3.5 MemoryRepository

```typescript
interface IMemoryRepository {
  get<T>(key: string): Promise<T | undefined>;
  getAll(): Promise<Record<string, unknown>>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
}
```

---

## 4. Service Interfaces

Public API for each feature. Components call these methods. AI Layer reads through these.

**Location:** `src/features/[module]/[name]Service.ts`

### 4.1 ProjectService

```typescript
interface IProjectService {
  createProject(name: string): Promise<Project>;
  renameProject(id: UUID, name: string): Promise<void>;
  deleteProject(id: UUID): Promise<void>;
  switchProject(id: UUID): Promise<void>;
  getActiveProject(): Project | null;
  getAllProjects(): Project[];
  ensureDefaultProject(): Promise<void>;
}
```

### 4.2 FileService

```typescript
interface IFileService {
  createFile(projectId: UUID, parentId: UUID | null, name: string, content?: string): Promise<FileEntry>;
  createFolder(projectId: UUID, parentId: UUID | null, name: string): Promise<FileEntry>;
  renameFile(id: UUID, name: string): Promise<void>;
  moveFile(id: UUID, newParentId: UUID | null): Promise<void>;
  deleteFile(id: UUID): Promise<void>;
  readContent(id: UUID): Promise<string>;
  writeContent(id: UUID, content: string): Promise<void>;
  getFileTree(projectId: UUID): Promise<FileEntry[]>;
}
```

### 4.3 TaskService

```typescript
interface ITaskService {
  createTask(projectId: UUID, title: string): Promise<Task>;
  updateTask(id: UUID, updates: TaskUpdatePayload): Promise<void>;
  toggleStatus(id: UUID): Promise<void>;
  deleteTask(id: UUID): Promise<void>;
  getTasksByProject(projectId: UUID): Promise<Task[]>;
}

interface TaskUpdatePayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: number | null;
}
```

### 4.4 SettingsService

```typescript
interface ISettingsService {
  loadAll(): Promise<void>;
  getTheme(): Theme;
  setTheme(theme: Theme): Promise<void>;
  getWallpaper(): Wallpaper;
  setWallpaper(wallpaper: Wallpaper): Promise<void>;
  getActiveProviderId(): string | null;
  setActiveProviderId(id: string | null): Promise<void>;
}
```

### 4.5 MemoryService

```typescript
interface IMemoryService {
  loadAll(): Promise<void>;
  recordRecentProject(projectId: UUID): Promise<void>;
  recordRecentFile(projectId: UUID, fileId: UUID): Promise<void>;
  getLastActiveProjectId(): string | null;
  savePanelState(panels: PanelInfo[]): Promise<void>;
  loadPanelState(): Promise<PanelInfo[]>;
}
```

### 4.6 InitializationService

```typescript
interface IInitializationService {
  boot(): Promise<BootResult>;
}

interface BootResult {
  success: boolean;
  migrated: boolean;
  projectCount: number;
  error?: string;
}
```

---

## 5. Store Interfaces

State shape contracts for each Zustand store.

**Location:** `src/features/[module]/[name]Store.ts`, `src/shell/shellStore.ts`, `src/ai/chat/chatStore.ts`

### 5.1 ProjectStore

```typescript
interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;

  setProjects: (projects: Project[]) => void;
  setActiveProject: (id: string) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
}
```

### 5.2 FileStore

```typescript
interface FileState {
  files: FileEntry[];
  expandedFolders: Set<string>;

  setFiles: (files: FileEntry[]) => void;
  addFile: (file: FileEntry) => void;
  updateFile: (id: string, updates: Partial<FileEntry>) => void;
  removeFile: (id: string) => void;
  removeByProject: (projectId: string) => void;
  toggleFolder: (folderId: string) => void;
}
```

### 5.3 TaskStore

```typescript
interface TaskState {
  tasks: Task[];

  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  removeByProject: (projectId: string) => void;
}
```

### 5.4 SettingsStore

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

### 5.5 MemoryStore

```typescript
interface MemoryState {
  lastActiveProjectId: string | null;
  recentProjects: string[];
  recentFiles: RecentFileRef[];

  setLastActiveProject: (id: string) => void;
  addRecentProject: (id: string) => void;
  addRecentFile: (projectId: string, fileId: string) => void;
  hydrate: (data: Record<string, unknown>) => void;
}
```

### 5.6 ShellStore

```typescript
interface PanelInfo {
  id: string;
  appId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
}

interface ShellState {
  booted: boolean;
  panels: PanelInfo[];
  zOrder: string[];

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

### 5.7 ChatStore

```typescript
type AiStatus = 'idle' | 'ready' | 'thinking' | 'error' | 'not-configured';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  tokenUsage?: TokenUsage;
}

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

## 6. AI Provider Interfaces

Complete provider abstraction contract.

**Location:** `src/ai/providers/types.ts`

### 6.1 Provider Interface

```typescript
interface AIProvider {
  readonly id: string;
  readonly name: string;
  capabilities(): ProviderCapabilities;
  isConfigured(): boolean;
  generateCompletion(request: CompletionRequest): Promise<CompletionResponse>;
}

interface ProviderCapabilities {
  textCompletion: boolean;
  streaming: boolean;
  functionCalling: boolean;
  vision: boolean;
  embeddings: boolean;
}
```

### 6.2 Request / Response

```typescript
interface CompletionRequest {
  messages: ConversationMessage[];
  systemPrompt?: string;
  signal?: AbortSignal;
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface CompletionResponse {
  content: string;
  usage: TokenUsage;
  providerId: string;
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}
```

### 6.3 Provider Registry

```typescript
interface IProviderRegistry {
  register(provider: AIProvider): void;
  getAll(): AIProvider[];
  getActive(): AIProvider | null;
  setActive(providerId: string): void;
  getById(id: string): AIProvider | undefined;
  isAnyAvailable(): boolean;
}
```

### 6.4 Chat Service

```typescript
interface IChatService {
  sendMessage(content: string, signal?: AbortSignal): Promise<void>;
  retryLastMessage(signal?: AbortSignal): Promise<void>;
  clearConversation(): void;
  isAvailable(): boolean;
}
```

---

## 7. Error Types

**Location:** `src/core/errors/`

### 7.1 RepositoryError

```typescript
type RepositoryErrorCode =
  | 'NOT_FOUND'
  | 'CONSTRAINT_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'TRANSACTION_FAILED'
  | 'STORAGE_ERROR';

class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;
  readonly retryable: boolean;
}
```

### 7.2 DomainError

```typescript
type DomainErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'DUPLICATE_NAME'
  | 'OPERATION_FAILED'
  | 'CYCLE_DETECTED'
  | 'STORAGE_FULL';

class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly retryable: boolean;
}
```

### 7.3 ProviderError

```typescript
// Location: src/ai/providers/errors.ts

type ProviderErrorCode =
  | 'NOT_CONFIGURED'
  | 'AUTH_ERROR'
  | 'RATE_LIMIT'
  | 'NETWORK_ERROR'
  | 'PROVIDER_ERROR'
  | 'EMPTY_RESPONSE'
  | 'CANCELLED'
  | 'UNSUPPORTED';

class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly providerId: string;
  readonly retryable: boolean;
}
```

---

## 8. Shell Types

**Location:** `src/shell/types.ts`

```typescript
interface AppRegistration {
  id: string;
  name: string;
  icon: string;
  component: ComponentType;
  defaultSize: { width: number; height: number };
  singleton: boolean;
}
```

---

## 9. Contract Change Rules

These interfaces are contracts. Breaking them has cascading costs.

| Change Type | Process |
|---|---|
| **Add optional field** to entity | Safe. No migration needed. Existing code continues to work. |
| **Add required field** to entity | Breaking. Requires database migration + updating all create paths. |
| **Add method** to service/repository interface | Semi-breaking. All implementations must be updated. |
| **Change method signature** | Breaking. All callers must be updated. |
| **Remove field or method** | Breaking. Requires updating all consumers. |
| **Add new enum value** | Safe if consumers have default/fallback handling. |

**Rule:** Any breaking change to a contract in this document requires:
1. Migration plan for existing data (if entity change).
2. List of all affected files.
3. Review before implementation.

---

## Document Metadata

| | |
|---|---|
| **Dependencies** | Database Design (record types), State Architecture (store shapes), Service Layer (method signatures), AI Layer Architecture (provider types) |
| **Used By** | Every implementation file. These interfaces are the "import boundary" between modules. |
| **Future Versions** | v0.4 adds streaming to AIProvider, AI memory entity. v0.5 adds terminal/editor types. v0.6 adds plugin API interfaces. All additions must be backward-compatible (additive only). |
| **Breaking Change Risk** | **Very High** — These are the most change-sensitive types in the codebase. Changing them ripples through every layer. |
