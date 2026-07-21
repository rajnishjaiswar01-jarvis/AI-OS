# AI OS — Engineering Decisions Freeze

> **Document Type:** Engineering Decisions Lock  
> **Phase:** 1.5  
> **Status:** Active  
> **Last Updated:** 2026-07-10  
> **Depends On:** [VISION_LOCK.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/VISION_LOCK.md), [PRODUCT_SPECIFICATION.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/PRODUCT_SPECIFICATION.md), [PRODUCT_PRINCIPLES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/PRODUCT_PRINCIPLES.md)  
> **Audience:** All engineers working on AI OS

This document freezes every irreversible engineering decision before Phase 2 (Technical Foundation) begins. Changing any frozen decision requires a formal review with documented justification.

The purpose is simple: **Phase 2 architecture and all subsequent implementation must build on top of these decisions, not debate them.**

---

## How to Read This Document

Each decision follows this structure:

- **Decision** — What was decided.
- **Status** — 🔒 Frozen (will not change for v0.3.0) or ⚡ Decided (may be revisited with strong justification).
- **Alternatives Considered** — What was evaluated.
- **Rationale** — Why this choice wins.
- **Reversal Cost** — How expensive it is to change this later.

---

## 1. Runtime & Build

### 1.1 Framework — React 19

| | |
|---|---|
| **Decision** | React 19 with functional components and hooks. No class components. |
| **Status** | 🔒 Frozen |
| **Alternatives** | Vue 3, Svelte 5, Solid.js |
| **Rationale** | Already adopted in v0.1. Entire component tree (14 components, 2 stores) is React. Switching frameworks means rewriting 100% of existing code with zero feature gain. React 19's concurrent features and use() hook align well with async data loading from IndexedDB. |
| **Reversal Cost** | Total rewrite. Not viable. |

### 1.2 Language — TypeScript (Strict)

| | |
|---|---|
| **Decision** | TypeScript with strict mode enabled. All new code must be fully typed. No `any` except in explicitly documented escape hatches. |
| **Status** | 🔒 Frozen |
| **Alternatives** | JavaScript, TypeScript (loose) |
| **Rationale** | Already adopted. The provider abstraction layer, data model, and repository interfaces are type-critical. Loose typing would undermine the interface contracts that the entire architecture depends on. |
| **Reversal Cost** | Extremely high. Types are the enforcement mechanism for module boundaries. |

**TypeScript Config Rules:**

```
strict: true
noUncheckedIndexedAccess: true
noImplicitReturns: true
```

### 1.3 Build Tool — Vite 8

| | |
|---|---|
| **Decision** | Vite 8 for development and production builds. |
| **Status** | 🔒 Frozen |
| **Alternatives** | Webpack, Turbopack, Rspack |
| **Rationale** | Already adopted. Vite's HMR, ESM-native dev server, and Rollup-based production builds are working. No reason to switch. Vitest (testing decision) is Vite-native, reinforcing this choice. |
| **Reversal Cost** | Config migration, plugin compatibility testing. Medium cost, no benefit. |

### 1.4 Package Manager — npm

| | |
|---|---|
| **Decision** | npm (lockfile: `package-lock.json`). |
| **Status** | ⚡ Decided |
| **Alternatives** | pnpm, yarn, bun |
| **Rationale** | Already in use. `package-lock.json` exists. pnpm would be slightly better (faster, stricter dependency resolution), but switching mid-project adds risk with no critical gain. |
| **Reversal Cost** | Low. Lockfile migration is straightforward. Not worth doing unless a blocking issue arises. |

---

## 2. State Management

### 2.1 Client State — Zustand 5

| | |
|---|---|
| **Decision** | Zustand 5 for all client-side state management. One store per domain (appStore, chatStore, projectStore, fileStore, taskStore, settingsStore, memoryStore). |
| **Status** | 🔒 Frozen |
| **Alternatives** | Redux Toolkit, Jotai, Recoil, React Context |
| **Rationale** | Already adopted (v0.1). Lightweight, no boilerplate, excellent TypeScript support. The concern about cross-store complexity (Architecture Review 2.3) is manageable: use derived selectors for cross-store reads, avoid cascade mutations. |
| **Reversal Cost** | Rewrite all state management. High cost. |

**Store Architecture Rules:**

- Each domain gets one store: `projectStore`, `fileStore`, `taskStore`, `noteStore` (if notes need state beyond file state), `settingsStore`, `memoryStore`.
- Stores are **pure state containers** — no side effects, no API calls, no persistence logic inside stores.
- Cross-store reads use Zustand selectors or custom hooks that compose multiple stores.
- No store may import another store directly. Cross-store coordination happens in service or hook layers.

### 2.2 Server State — None (v0.3.0)

| | |
|---|---|
| **Decision** | No server state management library (React Query, SWR, etc.) in v0.3.0. |
| **Status** | ⚡ Decided |
| **Rationale** | v0.3.0 is entirely client-side. There are no REST/GraphQL APIs to cache. AI provider calls are fire-and-forget (no caching needed). When a backend arrives (v0.5+), React Query or equivalent should be evaluated. |

---

## 3. Database & Persistence

### 3.1 Database — IndexedDB via Dexie.js

| | |
|---|---|
| **Decision** | IndexedDB as the storage engine. Dexie.js as the ORM/wrapper. |
| **Status** | 🔒 Frozen |
| **Alternatives** | Raw IndexedDB, idb, OPFS, localStorage, SQLite (via WASM) |
| **Rationale** | Dexie handles schema versioning, migrations, and provides a clean query API with excellent TypeScript types. IndexedDB is the only browser storage API that supports structured data, async operations, and sufficient storage limits (typically 50%+ of disk on Chromium). OPFS was considered but has limited browser support and is file-oriented, not record-oriented. |
| **Reversal Cost** | High — schema definitions, migration logic, and query patterns are Dexie-specific. However, the repository abstraction (Decision 4.1) isolates Dexie from workspace code, so the reversal cost is contained to the repository layer. |

### 3.2 ID Strategy — UUID v4

| | |
|---|---|
| **Decision** | All entity IDs are UUID v4 strings. No auto-increment. No timestamps as IDs. No nanoid. |
| **Status** | 🔒 Frozen |
| **Alternatives** | Auto-increment (IndexedDB native), nanoid, ULID, timestamp-based |
| **Rationale** | UUID v4 is globally unique without a central authority. This is critical for future cross-device sync — two devices creating entities offline will never produce colliding IDs. Auto-increment IDs would require conflict resolution during sync. nanoid is shorter but offers no practical advantage in IndexedDB (storage is cheap). |
| **Reversal Cost** | Data migration for every entity. Extremely high. This must be right from day one. |

**Implementation Note:** Use `crypto.randomUUID()` (native browser API, no dependency). Supported in all target browsers.

### 3.3 File Content Storage — Blob-First

| | |
|---|---|
| **Decision** | File content is stored as Blobs in IndexedDB, not as string fields. Even text/markdown files are stored as Blobs. |
| **Status** | 🔒 Frozen |
| **Alternatives** | String fields for text, Blobs for binary |
| **Rationale** | Starting with strings and migrating to Blobs later means a schema migration for every existing file when binary file support is added. Dexie handles Blobs natively. By storing everything as Blobs from day one, the schema is future-proof for images, PDFs, and other binary assets without migration. Text files are read via `blob.text()` — a one-line conversion with negligible overhead. |
| **Reversal Cost** | N/A — this is the forward-compatible choice. Reversing to strings would be a regression. |

### 3.4 Schema Versioning — Dexie Native

| | |
|---|---|
| **Decision** | Use Dexie's built-in schema versioning and upgrade mechanism. Each schema change increments the Dexie version and includes a migration function. |
| **Status** | 🔒 Frozen |
| **Rationale** | Dexie's `.version(N).stores({...}).upgrade(tx => {...})` pattern is the standard approach. No custom migration framework needed. |

---

## 4. Architecture Layers

### 4.1 Service Layer Rule — Mandatory Four-Layer Stack

| | |
|---|---|
| **Decision** | All data access follows a strict four-layer stack. No shortcuts. |
| **Status** | 🔒 Frozen |

```text
React Component (UI)
      │
      ▼
   Store (State)
      │
      ▼
  Service (Logic)
      │
      ▼
 Repository (Data Access)
      │
      ▼
   Dexie (Storage)
```

**Layer responsibilities:**

| Layer | Responsibility | Example |
|---|---|---|
| **Component** | Renders UI, dispatches user actions, reads from store. | `TaskList.tsx` renders tasks from `taskStore`. |
| **Store** | Holds client state. Pure state mutations. No side effects. | `taskStore.addTask(task)` updates in-memory state. |
| **Service** | Business logic, orchestration, cross-concern coordination. Calls repositories for persistence. Updates stores after successful persistence. | `taskService.createTask(title)` → generates UUID → calls `taskRepository.save()` → updates `taskStore`. |
| **Repository** | Data access abstraction. Encapsulates all Dexie operations. Returns/accepts domain types, not Dexie-specific types. | `taskRepository.save(task)` → `db.tasks.put(task)`. |

**Why this matters:**

- **Cloud sync readiness.** When cloud sync is added, only the repository layer changes. Services, stores, and components remain untouched.
- **Testability.** Repositories can be mocked for unit tests. Services can be tested without a real database.
- **Provider swap.** If Dexie is ever replaced (e.g., with SQLite WASM), only repositories change.

**Enforcement:**

- Components MUST NOT import repositories or Dexie.
- Stores MUST NOT import repositories or Dexie.
- Services MUST NOT import Dexie directly — only through repositories.
- Only repositories import Dexie.

**Anti-pattern (prohibited):**

```text
React Component → Dexie          ✗
React Component → Repository     ✗
Store → Dexie                    ✗
Store → Repository               ✗
Service → Dexie                  ✗
```

### 4.2 AI Layer Separation — Vision Lock Enforcement

| | |
|---|---|
| **Decision** | The AI Layer is a self-contained module. No workspace module (component, store, service, or repository) may import from the AI layer. The AI layer reads workspace data through defined service interfaces. |
| **Status** | 🔒 Frozen (per Vision Lock Section 9.4) |

```text
Workspace Modules          AI Module
├── projectService          ├── aiProviderAbstraction
├── fileService             ├── geminiAdapter
├── taskService             ├── openRouterAdapter (future)
├── noteService             ├── chatService
└── settingsService         └── chatStore

       ✗ ←──── No imports from AI to Workspace internals
       ✓ ────→ AI reads workspace data via exported interfaces
```

---

## 5. Folder Structure

### 5.1 Source Directory Convention

| | |
|---|---|
| **Decision** | Feature-based folder structure under `src/`. Each feature owns its components, store, service, repository, and types. |
| **Status** | 🔒 Frozen |

```text
src/
├── core/                      # Shared foundation
│   ├── db/                    # Dexie instance, schema, migrations
│   │   ├── database.ts        # Dexie database definition
│   │   └── migrations/        # Version-specific migration scripts
│   ├── errors/                # Error boundaries, error types
│   ├── hooks/                 # Shared React hooks
│   ├── types/                 # Shared type definitions
│   └── utils/                 # Pure utility functions
│
├── features/                  # Feature modules (one per domain)
│   ├── projects/
│   │   ├── components/        # React components
│   │   ├── projectStore.ts    # Zustand store
│   │   ├── projectService.ts  # Business logic
│   │   ├── projectRepository.ts  # Data access
│   │   └── types.ts           # Domain types
│   ├── files/
│   │   ├── components/
│   │   ├── fileStore.ts
│   │   ├── fileService.ts
│   │   ├── fileRepository.ts
│   │   └── types.ts
│   ├── notes/
│   │   ├── components/
│   │   ├── noteService.ts
│   │   └── types.ts           # (may share fileStore if notes = files)
│   ├── tasks/
│   │   ├── components/
│   │   ├── taskStore.ts
│   │   ├── taskService.ts
│   │   ├── taskRepository.ts
│   │   └── types.ts
│   ├── settings/
│   │   ├── components/
│   │   ├── settingsStore.ts
│   │   ├── settingsService.ts
│   │   ├── settingsRepository.ts
│   │   └── types.ts
│   └── memory/
│       ├── memoryStore.ts
│       ├── memoryService.ts
│       ├── memoryRepository.ts
│       └── types.ts
│
├── ai/                        # AI Layer (independent module)
│   ├── providers/
│   │   ├── types.ts           # Provider interface definition
│   │   ├── geminiAdapter.ts   # Gemini implementation
│   │   └── registry.ts        # Provider registration & selection
│   ├── chat/
│   │   ├── components/
│   │   ├── chatStore.ts
│   │   └── chatService.ts
│   └── config.ts              # AI-specific configuration
│
├── shell/                     # Desktop shell (window manager, dock, topbar)
│   ├── components/
│   │   ├── Desktop.tsx
│   │   ├── Dock.tsx
│   │   ├── TopBar.tsx
│   │   ├── Panel.tsx
│   │   ├── BootScreen.tsx
│   │   └── AiOrb.tsx
│   ├── shellStore.ts          # App state, open panels, z-order
│   └── types.ts
│
├── ui/                        # Shared UI component library
│   ├── GlassButton.tsx
│   ├── GlassCard.tsx
│   ├── Input.tsx
│   ├── Widget.tsx
│   ├── CodeBlock.tsx
│   └── ErrorBoundary.tsx
│
├── index.css                  # Global styles & design tokens
├── App.tsx                    # Root component
└── main.tsx                   # Entry point
```

**Rules:**

- Features may import from `core/`, `ui/`, and their own directory.
- Features MUST NOT import from other features directly. Cross-feature coordination happens in services or shared hooks in `core/hooks/`.
- The `ai/` directory is isolated. No feature may import from `ai/`. The `ai/` module reads workspace state through exported interfaces from feature services.
- The `shell/` directory manages desktop chrome (dock, topbar, panels). It imports from `ui/` for shared components.
- The `ui/` directory contains only presentational, stateless components.

### 5.2 Test File Convention

| | |
|---|---|
| **Decision** | Test files are co-located with source files using the `.test.ts` / `.test.tsx` suffix. |
| **Status** | ⚡ Decided |

```text
features/tasks/
├── taskService.ts
├── taskService.test.ts        # Unit test
├── taskRepository.ts
└── taskRepository.test.ts     # Integration test
```

**Rationale:** Co-location keeps related files together and makes it obvious when a module lacks tests.

---

## 6. AI Provider Abstraction

### 6.1 Provider Interface — Text Completion Only (v0.3.0)

| | |
|---|---|
| **Decision** | The v0.3.0 provider interface supports text completion only. No streaming, no function calling, no vision, no embeddings. |
| **Status** | 🔒 Frozen for v0.3.0 scope |

**Rationale:** Scoping to text completion avoids speculative interface design. The Architecture Review (3.2) identified that trying to abstract streaming, function calling, and vision across providers is a multi-week design challenge. v0.4 adds capabilities as optional interface extensions.

**Interface sketch (conceptual, not implementation):**

```typescript
interface AIProvider {
  readonly id: string;
  readonly name: string;
  capabilities(): ProviderCapabilities;
  generateCompletion(request: CompletionRequest): Promise<CompletionResponse>;
}

interface ProviderCapabilities {
  textCompletion: boolean;
  streaming: boolean;        // false for all v0.3.0 adapters
  functionCalling: boolean;  // false for all v0.3.0 adapters
  vision: boolean;           // false for all v0.3.0 adapters
}
```

### 6.2 Provider Registration — Registry Pattern

| | |
|---|---|
| **Decision** | Providers are registered in a central registry. The active provider is selected by configuration (env var in v0.3.0, Settings UI in v0.4). |
| **Status** | ⚡ Decided |

**Rationale:** A registry allows runtime provider switching and makes it trivial to add new adapters without touching existing code.

---

## 7. Error Handling

### 7.1 React Error Boundaries — Per Panel

| | |
|---|---|
| **Decision** | Every panel (workspace app window) is wrapped in a React Error Boundary. A crash in one panel shows an error state in that panel — not a white screen for the entire app. |
| **Status** | 🔒 Frozen |

**Rationale:** Without error boundaries, a single rendering error in the file browser crashes the entire desktop including chat, tasks, and everything else. Error isolation is non-negotiable for a multi-panel workspace.

### 7.2 Error Types — Domain-Specific

| | |
|---|---|
| **Decision** | Each layer produces typed errors. Components catch and display. Services catch repository errors and translate them to domain errors. |
| **Status** | ⚡ Decided |

```text
Repository Layer → RepositoryError (storage failure, not found, constraint violation)
Service Layer    → DomainError (business rule violation, validation failure)
AI Layer         → AiServiceError (already exists from v0.2)
Component Layer  → Displays error state in UI
```

### 7.3 Logging — Structured Console Logging (v0.3.0)

| | |
|---|---|
| **Decision** | Use structured console logging (console.error, console.warn, console.info) with consistent prefixes. No external logging service in v0.3.0. |
| **Status** | ⚡ Decided |

**Format:**

```typescript
console.error('[TaskService] Failed to create task:', { taskId, error });
console.info('[FileRepository] File saved:', { fileId, projectId });
```

**Rationale:** A full logging framework is overhead for a client-side app in v0.3.0. Structured prefixes make console output filterable and debuggable. A proper logging abstraction can be introduced in v0.5+ when a backend exists.

---

## 8. Testing

### 8.1 Test Framework — Vitest

| | |
|---|---|
| **Decision** | Vitest for all unit and integration tests. |
| **Status** | 🔒 Frozen |
| **Alternatives** | Jest, Mocha, Testing Library standalone |
| **Rationale** | Vitest is Vite-native (zero config with existing Vite setup), API-compatible with Jest (low learning curve), and supports TypeScript natively. It shares Vite's transform pipeline, so tests run against the same module system as the app. |

### 8.2 Test Scope — Foundation Layers First

| | |
|---|---|
| **Decision** | v0.3.0 requires automated tests for repositories, services, and the provider abstraction. UI/component tests are not required for v0.3.0. |
| **Status** | ⚡ Decided |

**Required test coverage:**

| Layer | Requirement |
|---|---|
| Repositories (Dexie operations) | Integration tests against a real Dexie instance (in-memory or fake-indexeddb) |
| Services (business logic) | Unit tests with mocked repositories |
| Provider abstraction | Contract tests: any adapter implementing `AIProvider` passes the same test suite |
| Stores | Not required for v0.3.0 (pure state, low bug surface) |
| Components | Not required for v0.3.0 (manual verification sufficient) |

### 8.3 UI Testing — Deferred

| | |
|---|---|
| **Decision** | No Playwright, Cypress, or end-to-end UI tests in v0.3.0. |
| **Status** | ⚡ Decided |
| **Rationale** | UI is changing rapidly in v0.3.0. Brittle E2E tests during a period of high UI churn produce maintenance burden without proportional value. Revisit in v0.5 when the UI stabilizes. |

---

## 9. Multi-Tab Detection

### 9.1 Single-Tab Enforcement

| | |
|---|---|
| **Decision** | AI OS detects when a second tab opens and displays a warning: "AI OS is already open in another tab." The second tab does not write to the database. |
| **Status** | 🔒 Frozen |
| **Implementation approach** | Use `navigator.locks.request()` (Web Locks API) or `BroadcastChannel` to detect concurrent instances. The first tab holds the lock; subsequent tabs are read-only or blocked. |
| **Rationale** | Two tabs writing to the same IndexedDB instance without coordination causes data overwrite. Solving true multi-tab sync is significantly complex (CRDT, operational transforms). A detection-and-warn approach eliminates the data corruption risk with minimal effort. |
| **Reversal Cost** | Low. This is a guard, not a core feature. It can be replaced with multi-tab sync when that capability is built. |

---

## 10. Styling

### 10.1 CSS Approach — Tailwind + CSS Modules

| | |
|---|---|
| **Decision** | Tailwind CSS 4 for utility classes and layout. CSS Modules for component-specific glass-morphism styles. Global `index.css` for design tokens and shared base styles only. |
| **Status** | ⚡ Decided |

**Rationale:** The Architecture Review (4.1) flagged the growing `index.css` (8KB) as a scalability concern. As workspace components grow, component-specific glass-morphism styles should be co-located with their components via CSS Modules, not dumped into a global file.

**Rules:**

- Design tokens (colors, spacing, shadows, blur values) remain in `index.css` as CSS custom properties.
- Component-specific styles use CSS Modules (e.g., `TaskList.module.css`).
- Tailwind utilities are used for layout, spacing, and flexbox — not for glass-morphism effects.
- No inline styles except for dynamic values (e.g., panel position from drag calculations).

---

## 11. Debug Panel (Development Only)

### 11.1 Dev Mode Debug Panel

| | |
|---|---|
| **Decision** | A hidden debug panel accessible via keyboard shortcut (e.g., `Ctrl+Shift+D`) during development. Not shipped to production builds. |
| **Status** | ⚡ Decided |

**Contents:**

| Info | Source |
|---|---|
| Active AI provider | Provider registry |
| Database schema version | Dexie |
| Storage usage (bytes) | `navigator.storage.estimate()` |
| Active project / open panels | Shell store |
| Store state snapshots | All Zustand stores |
| Recent errors | Error log buffer |

**Rationale:** The persistence layer, provider abstraction, and store architecture are all new in v0.3.0. Without runtime visibility into these systems, debugging is guesswork.

---

## 12. Naming Conventions

### 12.1 File Naming

| Pattern | Convention | Example |
|---|---|---|
| React components | PascalCase | `TaskList.tsx` |
| Stores | camelCase + `Store` suffix | `taskStore.ts` |
| Services | camelCase + `Service` suffix | `taskService.ts` |
| Repositories | camelCase + `Repository` suffix | `taskRepository.ts` |
| Types | camelCase or `types.ts` | `types.ts` |
| Tests | source name + `.test.ts` | `taskService.test.ts` |
| CSS Modules | component name + `.module.css` | `TaskList.module.css` |

### 12.2 Code Naming

| Pattern | Convention | Example |
|---|---|---|
| Interfaces | PascalCase, noun | `Task`, `Project`, `FileEntry` |
| Type aliases | PascalCase | `TaskStatus`, `Theme` |
| Zustand stores | `use` + PascalCase + `Store` | `useTaskStore` |
| Service functions | camelCase, verb-first | `createTask()`, `deleteFile()` |
| Repository functions | camelCase, CRUD verbs | `save()`, `findById()`, `findByProject()`, `remove()` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `SCHEMA_VERSION` |
| React hooks | `use` + PascalCase | `useActiveProject()` |

---

## 13. Deferred Decisions

These were considered but explicitly deferred. They are NOT forgotten — they have a target version for resolution.

| Decision | Reason for Deferral | Target |
|---|---|---|
| **Undo/Redo system** | Not a foundation blocker. Browser/editor-native undo is sufficient for v0.3.0. A proper history system introduces state complexity that is premature. | v0.3.1 or v0.4 |
| **Keyboard shortcuts framework** | Useful for power users but not foundational. No blocking dependency. | v0.3.1 |
| **Backend proxy for API keys** | Current client-side key exposure is a documented, accepted risk. A backend introduces deployment complexity that is premature for v0.3.0. | v0.5 |
| **Markdown editor library selection** | Decision needed before notes implementation begins, but not before the data model and persistence are designed. Evaluate during Phase 2. | Phase 2 |
| **Real filesystem access** | Virtual FS only in v0.3.0. Browser File System Access API evaluation deferred. | v0.5 |
| **Cloud sync architecture** | Requires stable data model and repository pattern first. Repository abstraction is designed to enable this. | Post v0.5 |
| **CI/CD pipeline** | Valuable but not blocking for a single-developer or small-team project at this stage. | v0.4 |

---

## Frozen Decision Summary

Quick reference of all 🔒 Frozen decisions — the ones that will NOT change for v0.3.0.

| # | Decision | Value |
|---|---|---|
| 1.1 | Framework | React 19 |
| 1.2 | Language | TypeScript (strict) |
| 1.3 | Build tool | Vite 8 |
| 3.1 | Database | IndexedDB via Dexie.js |
| 3.2 | ID strategy | UUID v4 (`crypto.randomUUID()`) |
| 3.3 | File content storage | Blob-first (all files as Blobs) |
| 3.4 | Schema versioning | Dexie native versioning |
| 4.1 | Data access pattern | Component → Store → Service → Repository → Dexie |
| 4.2 | AI layer separation | No workspace imports from AI (Vision Lock) |
| 5.1 | Folder structure | Feature-based under `src/features/`, AI isolated in `src/ai/` |
| 6.1 | Provider abstraction scope | Text completion only for v0.3.0 |
| 7.1 | Error boundaries | Per-panel isolation |
| 8.1 | Test framework | Vitest |
| 9.1 | Multi-tab handling | Detect and warn (single-tab enforcement) |
| 2.1 | State management | Zustand 5 (one store per domain) |

---

## Phase Roadmap Update

```text
Phase 1    ✅ Product Foundation
              Vision Lock, Product Spec, Principles, Roadmap, Architecture Review

Phase 1.5  ✅ Engineering Decisions Freeze   ← This document
              Irreversible decisions locked

Phase 2    ⏳ Technical Foundation
              Architecture diagrams, data models, interface definitions

Phase 3    ⏳ Security
              Threat model, API key handling, data protection

Phase 4    ⏳ Design System
              Component library, design tokens, accessibility baseline

Phase 5    ⏳ Module Specifications
              Per-feature technical specs

Phase 6    ⏳ Implementation
              Code
```

---

*Every frozen decision in this document is a constraint that simplifies all future decisions. If something feels wrong during implementation, check whether it contradicts a frozen decision — and if it does, raise a formal review before proceeding.*
