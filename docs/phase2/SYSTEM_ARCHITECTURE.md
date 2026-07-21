# AI OS — System Architecture

> **Document Type:** Technical Foundation  
> **Phase:** 2.1  
> **Status:** Active  
> **Last Updated:** 2026-07-10  
> **Depends On:** [VISION_LOCK.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/VISION_LOCK.md), [ENGINEERING_DECISIONS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md)

---

## 1. High-Level Architecture

AI OS is a browser-based workspace composed of four architectural zones. Each zone is independently deployable, testable, and modifiable.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                           Browser Tab                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     Shell Layer                               │   │
│  │   Desktop  │  Dock  │  TopBar  │  Panels  │  BootScreen      │   │
│  └──────────────────────┬───────────────────────────────────────┘   │
│                         │ renders                                    │
│  ┌──────────────────────▼───────────────────────────────────────┐   │
│  │                  Feature Modules                              │   │
│  │                                                               │   │
│  │   ┌──────────┐  ┌──────┐  ┌───────┐  ┌──────┐  ┌────────┐  │   │
│  │   │ Projects  │  │Files │  │ Notes │  │Tasks │  │Settings│  │   │
│  │   └────┬─────┘  └──┬───┘  └──┬────┘  └──┬───┘  └───┬────┘  │   │
│  │        │           │         │           │          │         │   │
│  │   Component → Store → Service → Repository                   │   │
│  └──────────────────────┬───────────────────────────────────────┘   │
│                         │                                            │
│  ┌──────────────────────▼───────────────────────────────────────┐   │
│  │                    Core Layer                                 │   │
│  │   Database (Dexie)  │  Errors  │  Hooks  │  Types  │  Utils  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  AI Layer (Optional)                           │   │
│  │   Provider Abstraction  │  Gemini Adapter  │  Chat            │   │
│  │   ────────────── reads workspace via interfaces ──────────    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │    IndexedDB         │
              │    (via Dexie.js)    │
              └─────────────────────┘
```

### Zone Summary

| Zone | Purpose | Can be removed without breaking others? |
|---|---|---|
| **Shell** | Desktop chrome: dock, top bar, panels, boot screen, window management | No — it's the visual container |
| **Features** | Workspace modules: projects, files, notes, tasks, settings, memory | Individual features can be removed; the zone itself is essential |
| **Core** | Shared infrastructure: database, error handling, types, utilities | No — everything depends on it |
| **AI** | Optional intelligence layer: provider abstraction, chat, AI config | **Yes** — workspace functions fully without it |

---

## 2. Layer Responsibilities

This is the system boundary contract. Each layer has explicit responsibilities and explicit prohibitions. If a piece of logic doesn't belong in a layer, it must be moved — not shoehorned.

### 2.1 React Component Layer

| | |
|---|---|
| **Role** | Presentation and user interaction |
| **Location** | `src/features/*/components/`, `src/shell/components/`, `src/ui/` |

| ✅ Responsible For | ❌ NOT Responsible For |
|---|---|
| Rendering UI based on store state | Business logic or validation |
| Dispatching user actions to services | Direct database access (Dexie) |
| Reading from Zustand stores via selectors | Direct repository calls |
| Displaying loading, error, and empty states | Data transformation beyond display formatting |
| Local UI state (form inputs, toggles, modals) | Cross-feature coordination |
| Calling service functions in response to user actions | Generating UUIDs or entity creation logic |

**Enforcement Rule:** Components import from stores (read) and services (write). Never from repositories or Dexie.

```typescript
// ✅ Correct
import { useTaskStore } from '../taskStore';
import { taskService } from '../taskService';

// ❌ Prohibited
import { taskRepository } from '../taskRepository';
import { db } from '../../core/db/database';
```

---

### 2.2 Store Layer

| | |
|---|---|
| **Role** | Client-side state container |
| **Location** | `src/features/*/[name]Store.ts`, `src/shell/shellStore.ts`, `src/ai/chat/chatStore.ts` |

| ✅ Responsible For | ❌ NOT Responsible For |
|---|---|
| Holding in-memory state for its domain | Persistence (no Dexie, no localStorage) |
| Pure state mutations (set, update, remove) | API calls or network requests |
| Exposing selectors for derived state | Business rule enforcement |
| Providing initial/default state | Cross-store mutations |
| Resetting state (e.g., clear, reset) | Side effects of any kind |

**Enforcement Rule:** Stores are pure. If a store method needs to persist data or call an API, it's in the wrong layer — move it to a service.

```typescript
// ✅ Correct — pure state mutation
addTask: (task: Task) => set((state) => ({
  tasks: [...state.tasks, task],
}))

// ❌ Prohibited — side effect in store
addTask: async (title: string) => {
  const task = await taskRepository.save({ title }); // NO
  set((state) => ({ tasks: [...state.tasks, task] }));
}
```

**Cross-store rule:** No store imports another store. If `taskStore` needs data from `projectStore`, a hook or service reads from both — the stores don't know about each other.

---

### 2.3 Service Layer

| | |
|---|---|
| **Role** | Business logic, orchestration, and cross-concern coordination |
| **Location** | `src/features/*/[name]Service.ts`, `src/ai/chat/chatService.ts` |

| ✅ Responsible For | ❌ NOT Responsible For |
|---|---|
| Business rule enforcement and validation | Rendering UI |
| Orchestrating multi-step operations | Holding persistent state (that's the store) |
| Calling repositories for persistence | Direct Dexie access |
| Updating stores after successful persistence | Managing React component lifecycle |
| Generating UUIDs for new entities | Knowing about specific AI providers |
| Error translation (repository errors → domain errors) | CSS or styling decisions |
| Cross-feature coordination (when necessary) | |

**This is the "brain" of each feature.** When a user clicks "Create Task," the flow is:

```text
Component calls:  taskService.createTask("Send proposal")
Service:          1. Validates input
                  2. Generates UUID
                  3. Creates Task object
                  4. Calls taskRepository.save(task)
                  5. On success: calls taskStore.addTask(task)
                  6. On failure: throws DomainError
Component:        Catches errors, shows UI feedback
```

**Cross-feature coordination example:**

```text
Deleting a project requires deleting its files and tasks.

projectService.deleteProject(projectId):
  1. Calls fileRepository.deleteByProject(projectId)
  2. Calls taskRepository.deleteByProject(projectId)
  3. Calls projectRepository.delete(projectId)
  4. Updates projectStore, fileStore, taskStore
```

Services may import other repositories (for cross-feature operations) but never other stores directly. Store updates always happen through the store's own API.

---

### 2.4 Repository Layer

| | |
|---|---|
| **Role** | Data access abstraction over Dexie.js |
| **Location** | `src/features/*/[name]Repository.ts` |

| ✅ Responsible For | ❌ NOT Responsible For |
|---|---|
| All Dexie read/write operations | Business logic or validation |
| Query construction (filters, sorts, indexes) | UUID generation |
| Mapping between Dexie records and domain types (if needed) | Updating Zustand stores |
| Transaction management | Error display or user-facing messaging |
| Handling storage-specific errors (quota, constraint violations) | Knowledge of React or UI state |

**Enforcement Rule:** This is the ONLY layer that imports Dexie. Every other layer is Dexie-ignorant.

```typescript
// ✅ Correct — repository encapsulates Dexie
class TaskRepository {
  async save(task: Task): Promise<void> {
    await db.tasks.put(task);
  }

  async findByProject(projectId: string): Promise<Task[]> {
    return db.tasks.where('projectId').equals(projectId).toArray();
  }
}

// ❌ Prohibited — service accessing Dexie
class TaskService {
  async createTask(title: string) {
    await db.tasks.put({ id, title }); // NO — use repository
  }
}
```

---

### 2.5 Database Layer (Dexie)

| | |
|---|---|
| **Role** | Storage engine — IndexedDB via Dexie.js |
| **Location** | `src/core/db/database.ts`, `src/core/db/migrations/` |

| ✅ Responsible For | ❌ NOT Responsible For |
|---|---|
| Schema definition (tables, indexes) | Business logic |
| Schema versioning and migrations | Any awareness of UI or stores |
| IndexedDB transaction management | Application-level error handling |
| Raw CRUD operations (put, get, delete, where) | Validation |

**Access rule:** Only repositories interact with the database instance. The `db` object is never imported outside `src/core/db/` and repository files.

---

### 2.6 AI Layer

| | |
|---|---|
| **Role** | Optional intelligence layer — provider abstraction, chat, AI configuration |
| **Location** | `src/ai/` |

| ✅ Responsible For | ❌ NOT Responsible For |
|---|---|
| AI provider abstraction interface | Workspace data ownership |
| Provider adapter implementations (Gemini, etc.) | Workspace persistence |
| Provider registration and selection | Core workspace operations (files, tasks, notes) |
| Chat conversation management | Window management or shell operations |
| AI-specific configuration (API keys, model selection) | Any operation that must work offline |
| AI-specific error handling (AiServiceError) | Modifying workspace data without going through workspace services |

**Boundary rule:** The AI Layer reads workspace data through exported service interfaces. It never imports workspace internals (stores, repositories, types not in the public API).

```typescript
// ✅ Correct — AI reads workspace context through exported interface
import { projectService } from '../features/projects/projectService';
const activeProject = projectService.getActiveProject();

// ❌ Prohibited — AI reaching into workspace internals
import { useProjectStore } from '../features/projects/projectStore';
import { db } from '../core/db/database';
```

---

### 2.7 Shell Layer

| | |
|---|---|
| **Role** | Desktop chrome — the visual container for everything |
| **Location** | `src/shell/` |

| ✅ Responsible For | ❌ NOT Responsible For |
|---|---|
| Desktop layout (dock, top bar, wallpaper) | Feature-specific business logic |
| Panel/window management (open, close, drag, resize, z-order) | Data persistence |
| Boot screen animation | AI provider management |
| App registration (which apps exist, their icons) | File operations, task operations, etc. |
| Routing user actions to the correct feature panel | |

---

### 2.8 UI Library Layer

| | |
|---|---|
| **Role** | Shared, stateless, presentational components |
| **Location** | `src/ui/` |

| ✅ Responsible For | ❌ NOT Responsible For |
|---|---|
| Reusable visual components (GlassButton, GlassCard, Input) | State management |
| Error boundary component | Business logic |
| Design system enforcement (consistent styling) | Feature-specific behavior |
| Theme-aware rendering | Data fetching or persistence |

---

## 3. Layer Dependency Matrix

This matrix shows which layer can import from which. Any import not shown here is **prohibited**.

| Importing Layer ↓ / From → | Core | UI | Shell | Features (own) | Features (other) | AI | Stores | Services | Repositories | Dexie |
|---|---|---|---|---|---|---|---|---|---|---|
| **Component** | ✅ types, hooks | ✅ | — | ✅ | ❌ | ❌ | ✅ read | ✅ call | ❌ | ❌ |
| **Store** | ✅ types | — | — | ✅ own types | ❌ | ❌ | ❌ other stores | ❌ | ❌ | ❌ |
| **Service** | ✅ types, utils | — | — | ✅ | ❌ direct* | ❌ | ✅ update | — | ✅ call | ❌ |
| **Repository** | ✅ db, types | — | — | ✅ own types | ❌ | ❌ | ❌ | ❌ | — | ✅ |
| **AI Layer** | ✅ types | ✅ | ❌ | exported interfaces only | — | ✅ | ✅ own | ✅ own | ✅ own | ❌ |
| **Shell** | ✅ types, hooks | ✅ | ✅ | ❌ direct** | — | ❌ | ✅ shellStore | — | ❌ | ❌ |

\* Services may import *other feature repositories* for cross-feature operations (e.g., `projectService` deleting files). They must not import other feature stores — store updates go through the owning service.

\** Shell renders feature panels by reference (component registry) but does not import feature internals.

---

## 4. Module Dependency Graph

```text
                    ┌─────────┐
                    │  main   │
                    │  .tsx   │
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │  App    │
                    │  .tsx   │
                    └────┬────┘
                         │
              ┌──────────▼──────────┐
              │       Shell         │
              │  Desktop, Dock,     │
              │  TopBar, Panels     │
              └──────────┬──────────┘
                         │ renders
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
    │ Feature   │  │ Feature  │  │   AI     │
    │ Panels    │  │ Panels   │  │  Chat    │
    │(Files,    │  │(Tasks,   │  │  Panel   │
    │ Notes)    │  │ Settings)│  │          │
    └─────┬─────┘  └────┬─────┘  └────┬─────┘
          │              │              │
          │    Component Layer          │
          │              │              │
          ├──────────────┤              │
          │    Store Layer│              │
          │              │              │
          ├──────────────┤              │
          │  Service Layer│              │
          │              │              │
          ├──────────────┤              │
          │ Repository   │              │
          │    Layer      │              │
          └──────┬───────┘              │
                 │                      │
          ┌──────▼───────┐    ┌────────▼────────┐
          │   core/db    │    │  AI Provider    │
          │   (Dexie)    │    │  Abstraction    │
          └──────┬───────┘    └────────┬────────┘
                 │                     │
          ┌──────▼───────┐    ┌────────▼────────┐
          │  IndexedDB   │    │ External APIs   │
          │  (Browser)   │    │ (Gemini, etc.)  │
          └──────────────┘    └─────────────────┘
```

---

## 5. Data Flow Examples

### 5.1 Create a Task

```text
User clicks "Add Task" button
         │
    ┌────▼────────────────────┐
    │ TaskList.tsx (Component) │
    │ calls taskService       │
    │ .createTask("Buy milk") │
    └────┬────────────────────┘
         │
    ┌────▼────────────────────┐
    │ taskService (Service)    │
    │ 1. Validate: title      │
    │    not empty             │
    │ 2. Generate UUID         │
    │ 3. Build Task object     │
    │ 4. Call taskRepository   │
    │    .save(task)           │
    └────┬────────────────────┘
         │
    ┌────▼────────────────────┐
    │ taskRepository (Repo)    │
    │ db.tasks.put(task)       │
    └────┬────────────────────┘
         │
    ┌────▼────────────────────┐
    │ Dexie → IndexedDB        │
    │ (persisted)              │
    └────┬────────────────────┘
         │ success
    ┌────▼────────────────────┐
    │ taskService              │
    │ 5. taskStore.addTask()   │
    └────┬────────────────────┘
         │
    ┌────▼────────────────────┐
    │ taskStore (Store)        │
    │ State updated            │
    │ React re-renders         │
    └─────────────────────────┘
```

### 5.2 Send AI Chat Message

```text
User types message, clicks Send
         │
    ┌────▼────────────────────┐
    │ Chat.tsx (Component)     │
    │ calls chatService        │
    │ .sendMessage("Hello")    │
    └────┬────────────────────┘
         │
    ┌────▼────────────────────┐
    │ chatService (AI Layer)   │
    │ 1. chatStore.addMessage  │
    │    (user message)        │
    │ 2. chatStore.setLoading  │
    │    (true)                │
    │ 3. Get active provider   │
    │    from registry         │
    │ 4. provider              │
    │    .generateCompletion() │
    └────┬────────────────────┘
         │
    ┌────▼────────────────────┐
    │ Provider Abstraction     │
    │ → geminiAdapter          │
    │ → Gemini API call        │
    └────┬────────────────────┘
         │ response
    ┌────▼────────────────────┐
    │ chatService              │
    │ 5. chatStore.addMessage  │
    │    (assistant response)  │
    │ 6. chatStore.setLoading  │
    │    (false)               │
    │ 7. chatStore             │
    │    .addTokenUsage()      │
    └────┬────────────────────┘
         │
    ┌────▼────────────────────┐
    │ chatStore (Store)        │
    │ State updated            │
    │ React re-renders         │
    └─────────────────────────┘
```

### 5.3 Switch Project

```text
User clicks project name in sidebar
         │
    ┌────▼────────────────────┐
    │ ProjectSwitcher.tsx      │
    │ calls projectService     │
    │ .switchProject(id)       │
    └────┬────────────────────┘
         │
    ┌────▼────────────────────┐
    │ projectService           │
    │ 1. projectRepository     │
    │    .findById(id)         │
    │ 2. Verify project exists │
    │ 3. fileRepository        │
    │    .findByProject(id)    │
    │ 4. taskRepository        │
    │    .findByProject(id)    │
    │ 5. Update stores:        │
    │    projectStore          │
    │    .setActive(project)   │
    │    fileStore             │
    │    .setFiles(files)      │
    │    taskStore             │
    │    .setTasks(tasks)      │
    │ 6. memoryService         │
    │    .recordRecentProject  │
    │    (id)                  │
    └────┬────────────────────┘
         │
    ┌────▼────────────────────┐
    │ Stores updated           │
    │ All panels re-render     │
    │ with new project context │
    └─────────────────────────┘
```

### 5.4 App Startup (Boot)

```text
Browser loads AI OS
         │
    ┌────▼────────────────────┐
    │ main.tsx                 │
    │ React mounts App.tsx     │
    └────┬────────────────────┘
         │
    ┌────▼────────────────────┐
    │ BootScreen renders       │
    │ (animation plays)        │
    └────┬────────────────────┘
         │ meanwhile...
    ┌────▼────────────────────┐
    │ Initialization Service   │
    │ 1. Check multi-tab lock  │
    │    (Web Locks API)       │
    │ 2. Open Dexie database   │
    │ 3. Run pending migrations│
    │ 4. Load settings from    │
    │    settingsRepository    │
    │ 5. Load last active      │
    │    project from          │
    │    memoryRepository      │
    │ 6. Load project's files  │
    │    and tasks             │
    │ 7. Hydrate all stores    │
    │ 8. Register AI providers │
    │    (if configured)       │
    │ 9. Check localStorage    │
    │    for v0.2 migration    │
    └────┬────────────────────┘
         │
    ┌────▼────────────────────┐
    │ Boot complete            │
    │ shellStore.setBooted()   │
    │ Desktop renders          │
    └─────────────────────────┘
```

---

## 6. Error Propagation Flow

```text
IndexedDB Error (e.g., QuotaExceeded)
         │
    ┌────▼────────────────────┐
    │ Repository               │
    │ Catches Dexie error      │
    │ Throws RepositoryError   │
    │ { code: 'QUOTA_EXCEEDED' │
    │   message: '...' }       │
    └────┬────────────────────┘
         │
    ┌────▼────────────────────┐
    │ Service                  │
    │ Catches RepositoryError  │
    │ Throws DomainError       │
    │ { code: 'SAVE_FAILED',   │
    │   message: 'Storage full'│
    │   retryable: false }     │
    └────┬────────────────────┘
         │
    ┌────▼────────────────────┐
    │ Component                │
    │ Catches DomainError      │
    │ Shows error toast/alert  │
    │ Does NOT crash           │
    └─────────────────────────┘

    If uncaught:
    ┌─────────────────────────┐
    │ Error Boundary           │
    │ Shows "Something went    │
    │ wrong" in that panel     │
    │ Other panels unaffected  │
    └─────────────────────────┘
```

---

## Document Metadata

| | |
|---|---|
| **Dependencies** | Vision Lock (product identity), Engineering Decisions (frozen decisions, folder structure, layer rules) |
| **Used By** | Database Design, State Architecture, Service Layer, Repository Layer, AI Layer Architecture, Interface Contracts |
| **Future Versions** | v0.4 adds AI context reading through workspace interfaces. v0.5 may add a backend zone. v0.6 adds a plugin zone. |
| **Breaking Change Risk** | **High** — This is the foundational architecture. Changing layer responsibilities or dependency rules after implementation would require refactoring every module. |
