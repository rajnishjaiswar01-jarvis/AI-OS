# AI OS — Folder Architecture

> **Document Type:** Technical Foundation  
> **Phase:** 2.3  
> **Status:** Active  
> **Last Updated:** 2026-07-10  
> **Depends On:** [ENGINEERING_DECISIONS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md) (Section 5), [SYSTEM_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/SYSTEM_ARCHITECTURE.md)

---

## 1. Directory Map

This is the canonical folder structure for AI OS v0.3.0. Every file has a home — no orphan files in `src/`.

```text
ai-os/
├── docs/                             # Project documentation (you are here)
│   ├── VISION_LOCK.md
│   ├── PRODUCT_SPECIFICATION.md
│   ├── PRODUCT_PRINCIPLES.md
│   ├── VERSION_ROADMAP.md
│   ├── ARCHITECTURE_REVIEW.md
│   ├── ENGINEERING_DECISIONS.md
│   └── phase2/
│       ├── SYSTEM_ARCHITECTURE.md
│       ├── FOLDER_ARCHITECTURE.md
│       ├── DATABASE_DESIGN.md
│       ├── STATE_ARCHITECTURE.md
│       ├── SERVICE_REPOSITORY_LAYER.md
│       ├── AI_LAYER_ARCHITECTURE.md
│       └── INTERFACE_CONTRACTS.md
│
├── public/                           # Static assets served by Vite
│   └── (icons, favicon, static images)
│
├── src/
│   ├── core/                         # ── Zone 1: Shared Foundation ──
│   │   ├── db/
│   │   │   ├── database.ts           # Dexie instance + schema definition
│   │   │   └── migrations/
│   │   │       └── v0_2_to_v0_3.ts   # localStorage → Dexie migration
│   │   ├── errors/
│   │   │   ├── DomainError.ts        # Business logic error class
│   │   │   ├── RepositoryError.ts    # Data access error class
│   │   │   └── errorCodes.ts         # All error code types
│   │   ├── hooks/
│   │   │   ├── useWorkspaceContext.ts # Cross-store derived state
│   │   │   └── useDebugPanel.ts      # Debug panel hook (dev only)
│   │   ├── types/
│   │   │   ├── common.ts             # Shared types (Timestamp, UUID, etc.)
│   │   │   └── events.ts             # Cross-module event types (future)
│   │   ├── utils/
│   │   │   ├── uuid.ts               # crypto.randomUUID() wrapper
│   │   │   ├── timestamp.ts          # Date/time utilities
│   │   │   ├── blob.ts               # Blob ↔ text conversion helpers
│   │   │   └── validation.ts         # Shared validation (non-empty, max length)
│   │   └── initializationService.ts  # Boot sequence orchestration
│   │
│   ├── features/                     # ── Zone 2: Feature Modules ──
│   │   ├── projects/
│   │   │   ├── components/
│   │   │   │   ├── ProjectSwitcher.tsx
│   │   │   │   ├── ProjectList.tsx
│   │   │   │   └── CreateProjectDialog.tsx
│   │   │   ├── projectStore.ts
│   │   │   ├── projectService.ts
│   │   │   ├── projectRepository.ts
│   │   │   ├── types.ts
│   │   │   └── projectService.test.ts
│   │   │
│   │   ├── files/
│   │   │   ├── components/
│   │   │   │   ├── FileBrowser.tsx
│   │   │   │   ├── FileTree.tsx
│   │   │   │   ├── FileTreeItem.tsx
│   │   │   │   └── CreateFileDialog.tsx
│   │   │   ├── fileStore.ts
│   │   │   ├── fileService.ts
│   │   │   ├── fileRepository.ts
│   │   │   ├── types.ts
│   │   │   └── fileService.test.ts
│   │   │
│   │   ├── notes/
│   │   │   ├── components/
│   │   │   │   ├── NoteEditor.tsx
│   │   │   │   └── NotePreview.tsx     # Markdown rendered view
│   │   │   ├── noteService.ts          # Content read/write via fileService
│   │   │   └── types.ts
│   │   │
│   │   ├── tasks/
│   │   │   ├── components/
│   │   │   │   ├── TaskList.tsx
│   │   │   │   ├── TaskItem.tsx
│   │   │   │   └── CreateTaskDialog.tsx
│   │   │   ├── taskStore.ts
│   │   │   ├── taskService.ts
│   │   │   ├── taskRepository.ts
│   │   │   ├── types.ts
│   │   │   └── taskService.test.ts
│   │   │
│   │   ├── settings/
│   │   │   ├── components/
│   │   │   │   └── SettingsPanel.tsx
│   │   │   ├── settingsStore.ts
│   │   │   ├── settingsService.ts
│   │   │   ├── settingsRepository.ts
│   │   │   └── types.ts
│   │   │
│   │   └── memory/
│   │       ├── memoryStore.ts
│   │       ├── memoryService.ts
│   │       ├── memoryRepository.ts
│   │       └── types.ts
│   │
│   ├── ai/                           # ── Zone 3: AI Layer (Optional) ──
│   │   ├── providers/
│   │   │   ├── types.ts              # AIProvider interface, request/response types
│   │   │   ├── errors.ts             # ProviderError class
│   │   │   ├── geminiAdapter.ts      # Gemini implementation
│   │   │   └── registry.ts           # Provider registration + selection
│   │   ├── chat/
│   │   │   ├── components/
│   │   │   │   ├── Chat.tsx
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   └── ChatInput.tsx
│   │   │   ├── chatStore.ts
│   │   │   └── chatService.ts
│   │   └── config.ts                 # AI-specific configuration
│   │
│   ├── shell/                        # ── Zone 4: Desktop Shell ──
│   │   ├── components/
│   │   │   ├── Desktop.tsx           # Root desktop layout
│   │   │   ├── Dock.tsx              # App launcher bar
│   │   │   ├── TopBar.tsx            # System status, clock, theme
│   │   │   ├── Panel.tsx             # Window/panel container
│   │   │   ├── PanelManager.tsx      # Manages multiple panels, z-order
│   │   │   ├── BootScreen.tsx        # Startup animation
│   │   │   ├── AiOrb.tsx             # AI status indicator
│   │   │   ├── Clock.tsx             # Clock widget
│   │   │   └── MultiTabGuard.tsx     # Multi-tab detection warning
│   │   ├── shellStore.ts             # Panel state, z-order, boot status
│   │   ├── appRegistry.ts           # Maps app IDs to components + metadata
│   │   └── types.ts
│   │
│   ├── ui/                           # ── Shared UI Components ──
│   │   ├── GlassButton.tsx
│   │   ├── GlassCard.tsx
│   │   ├── Input.tsx
│   │   ├── Widget.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── ErrorBoundary.tsx         # React Error Boundary wrapper
│   │   ├── ConfirmDialog.tsx         # Shared confirmation dialog
│   │   ├── EmptyState.tsx            # "No items" placeholder
│   │   ├── LoadingSpinner.tsx        # Loading indicator
│   │   └── Toast.tsx                 # Notification toast
│   │
│   ├── debug/                        # ── Dev-Only Debug Tools ──
│   │   ├── DebugPanel.tsx            # Hidden debug panel (Ctrl+Shift+D)
│   │   └── DebugOverlay.tsx          # Store state viewer
│   │
│   ├── index.css                     # Global styles + design tokens
│   ├── App.tsx                       # Root component
│   └── main.tsx                      # Entry point
│
├── .env                              # Environment variables (gitignored)
├── .env.example                      # Template for env vars (committed)
├── .gitignore
├── index.html                        # Vite entry HTML
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts                  # Test configuration
└── README.md
```

---

## 2. Zone Descriptions

### Zone 1: `src/core/` — Shared Foundation

Everything that multiple zones depend on. This is infrastructure, not features.

| Directory | Contains | Imported By |
|---|---|---|
| `core/db/` | Dexie database instance, schema, migrations | Repositories only |
| `core/errors/` | Error classes (`DomainError`, `RepositoryError`) | Services, repositories, components |
| `core/hooks/` | Cross-store composed hooks | Components |
| `core/types/` | Shared type definitions | Everywhere |
| `core/utils/` | Pure utility functions (UUID, timestamp, blob) | Services, repositories |
| `core/initializationService.ts` | Boot sequence | `App.tsx` |

**Rule:** `core/` has zero awareness of features, AI, or shell. It provides tools — it doesn't use them.

### Zone 2: `src/features/` — Feature Modules

One directory per workspace feature. Each feature is self-contained: its own components, store, service, repository, and types.

**Internal structure of every feature module:**

```text
features/[name]/
├── components/           # React components for this feature
│   └── *.tsx
├── [name]Store.ts        # Zustand store
├── [name]Service.ts      # Business logic
├── [name]Repository.ts   # Dexie data access
├── types.ts              # Domain types
└── [name]Service.test.ts # Tests
```

**Notes feature exception:** Notes share the file system. `noteService.ts` delegates to `fileService` for file operations and adds note-specific behavior (markdown parsing, auto-save). Notes do not have their own store or repository — they use `fileStore` and `fileRepository`.

### Zone 3: `src/ai/` — AI Layer

Completely isolated from the workspace. Has its own store (`chatStore`), service (`chatService`), and providers.

**Import rule:** Nothing in `src/features/` or `src/shell/` may import from `src/ai/`. The reverse is allowed — AI can read workspace data through exported service interfaces.

### Zone 4: `src/shell/` — Desktop Shell

The visual container. Manages panels, dock, top bar, boot screen. Knows which apps exist (via `appRegistry`) but doesn't know their internals.

### Shared: `src/ui/` — Component Library

Stateless, presentational components used across all zones. No business logic, no state management, no imports from features or AI.

### Dev-Only: `src/debug/`

Debug tools that are excluded from production builds via conditional imports or build flags.

---

## 3. Import Rules

### 3.1 Allowed Imports Matrix

| Importing From ↓ / Into → | `core/` | `ui/` | `features/own` | `features/other` | `ai/` | `shell/` | `debug/` |
|---|---|---|---|---|---|---|---|
| **`core/`** | ✅ internal | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`ui/`** | ✅ types | ✅ internal | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`features/[name]`** | ✅ | ✅ | ✅ | ❌ direct* | ❌ | ❌ | ❌ |
| **`ai/`** | ✅ | ✅ | ✅ exported only** | — | ✅ internal | ❌ | ❌ |
| **`shell/`** | ✅ | ✅ | ✅ components only*** | — | ❌ | ✅ internal | ❌ |
| **`debug/`** | ✅ | ✅ | ✅ stores (read) | — | ✅ stores (read) | ✅ | ✅ |

\* Services may import other feature **repositories** for cross-feature operations (e.g., `projectService` imports `fileRepository` for cascade delete). They must NOT import other feature stores or services.

\** AI may import exported interfaces from feature services (e.g., `projectService.getActiveProject()`). It must NOT import stores, repositories, or internal components.

\*** Shell imports feature components through the app registry — an indirect reference. It does not import feature services, stores, or repositories.

### 3.2 Anti-Patterns

```typescript
// ❌ Feature importing another feature's store
// src/features/tasks/taskService.ts
import { useProjectStore } from '../projects/projectStore';    // PROHIBITED

// ❌ Component importing repository
// src/features/tasks/components/TaskList.tsx
import { taskRepository } from '../taskRepository';           // PROHIBITED

// ❌ Shell importing AI layer
// src/shell/components/Dock.tsx
import { chatService } from '../../ai/chat/chatService';      // PROHIBITED

// ❌ Feature importing AI
// src/features/files/fileService.ts
import { providerRegistry } from '../../ai/providers/registry'; // PROHIBITED

// ❌ Store importing repository
// src/features/tasks/taskStore.ts
import { taskRepository } from './taskRepository';             // PROHIBITED
```

### 3.3 Correct Patterns

```typescript
// ✅ Service importing own repository
// src/features/tasks/taskService.ts
import { taskRepository } from './taskRepository';

// ✅ Service importing cross-feature repository
// src/features/projects/projectService.ts
import { fileRepository } from '../files/fileRepository';
import { taskRepository } from '../tasks/taskRepository';

// ✅ Component importing own store + service
// src/features/tasks/components/TaskList.tsx
import { useTaskStore } from '../taskStore';
import { taskService } from '../taskService';

// ✅ Component importing shared UI
// src/features/tasks/components/TaskItem.tsx
import { GlassButton } from '../../../ui/GlassButton';
import { GlassCard } from '../../../ui/GlassCard';

// ✅ AI importing workspace exported interface
// src/ai/chat/chatService.ts
import { projectService } from '../../features/projects/projectService';
```

---

## 4. File Naming Conventions

| Type | Pattern | Example |
|---|---|---|
| React component | PascalCase `.tsx` | `TaskList.tsx` |
| Store | camelCase + `Store.ts` | `taskStore.ts` |
| Service | camelCase + `Service.ts` | `taskService.ts` |
| Repository | camelCase + `Repository.ts` | `taskRepository.ts` |
| Types | `types.ts` | `types.ts` |
| Tests | source + `.test.ts` | `taskService.test.ts` |
| CSS Modules | PascalCase + `.module.css` | `TaskList.module.css` |
| Utilities | camelCase `.ts` | `timestamp.ts` |
| Error classes | PascalCase `.ts` | `DomainError.ts` |

---

## 5. App Registry

The shell needs to know which apps exist, their icons, and their root components — but it must not import feature internals.

```typescript
// src/shell/appRegistry.ts
import type { ComponentType } from 'react';

interface AppRegistration {
  id: string;                    // Unique app identifier
  name: string;                  // Display name
  icon: string;                  // Icon identifier or path
  component: ComponentType;      // Root component for this app's panel
  defaultSize: { width: number; height: number };
  singleton: boolean;            // Only one instance allowed?
}

// Apps are registered here — shell imports components by reference
const APP_REGISTRY: AppRegistration[] = [
  {
    id: 'files',
    name: 'Files',
    icon: 'folder',
    component: FileBrowser,      // Lazy import from features/files
    defaultSize: { width: 400, height: 500 },
    singleton: true,
  },
  {
    id: 'tasks',
    name: 'Tasks',
    icon: 'check-square',
    component: TaskList,         // Lazy import from features/tasks
    defaultSize: { width: 380, height: 500 },
    singleton: true,
  },
  // ... notes, settings, chat
];
```

---

## 6. v0.2 → v0.3 Migration Map

How existing v0.2 files map to the new structure:

| v0.2 Location | v0.3 Location | Change |
|---|---|---|
| `src/services/aiService.ts` | `src/ai/providers/geminiAdapter.ts` + `src/ai/chat/chatService.ts` | Split into adapter + service |
| `src/config/ai.ts` | `src/ai/config.ts` | Moved to AI layer |
| `src/stores/appStore.ts` | `src/features/settings/settingsStore.ts` + `src/shell/shellStore.ts` | Split by concern |
| `src/stores/chatStore.ts` | `src/ai/chat/chatStore.ts` | Moved to AI layer |
| `src/components/Chat.tsx` | `src/ai/chat/components/Chat.tsx` | Moved to AI layer |
| `src/components/Desktop.tsx` | `src/shell/components/Desktop.tsx` | Moved to shell |
| `src/components/Dock.tsx` | `src/shell/components/Dock.tsx` | Moved to shell |
| `src/components/TopBar.tsx` | `src/shell/components/TopBar.tsx` | Moved to shell |
| `src/components/Panel.tsx` | `src/shell/components/Panel.tsx` | Moved to shell |
| `src/components/BootScreen.tsx` | `src/shell/components/BootScreen.tsx` | Moved to shell |
| `src/components/AiOrb.tsx` | `src/shell/components/AiOrb.tsx` | Moved to shell |
| `src/components/GlassButton.tsx` | `src/ui/GlassButton.tsx` | Moved to UI library |
| `src/components/GlassCard.tsx` | `src/ui/GlassCard.tsx` | Moved to UI library |
| `src/components/CodeBlock.tsx` | `src/ui/CodeBlock.tsx` | Moved to UI library |

---

## Document Metadata

| | |
|---|---|
| **Dependencies** | Engineering Decisions (Section 5: folder structure, naming conventions), System Architecture (zones, layer rules) |
| **Used By** | All implementation work. Every new file must map to a location defined here. |
| **Future Versions** | v0.4: `src/features/aiMemory/`. v0.5: `src/features/terminal/`, `src/features/editor/`. v0.6: `src/plugins/`. Structure scales by adding new directories — existing directories don't change. |
| **Breaking Change Risk** | **Low** — Adding new directories is safe. Moving existing files requires updating all imports (one-time cost during v0.2 → v0.3 migration). |
