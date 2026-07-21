# AI OS — Development Standards

> **Document Type:** Coding Standards & Conventions  
> **Phase:** 2.5  
> **Status:** Active  
> **Last Updated:** 2026-07-10  
> **Depends On:** [ENGINEERING_DECISIONS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md), [FOLDER_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/FOLDER_ARCHITECTURE.md)

This document defines coding standards that must be followed during all AI OS development. These are conventions — not architecture. They ensure that code written by different contributors (or by the same contributor at different times) reads like it was written by one person.

---

## 1. File Naming

| Type | Convention | Example |
|---|---|---|
| React component | PascalCase `.tsx` | `TaskList.tsx`, `CreateProjectDialog.tsx` |
| Zustand store | camelCase + `Store.ts` | `taskStore.ts`, `shellStore.ts` |
| Service | camelCase + `Service.ts` | `taskService.ts`, `initializationService.ts` |
| Repository | camelCase + `Repository.ts` | `taskRepository.ts`, `fileRepository.ts` |
| Type definitions | `types.ts` per module | `src/features/tasks/types.ts` |
| Utility | camelCase `.ts` | `timestamp.ts`, `blob.ts`, `uuid.ts` |
| Error class | PascalCase `.ts` | `DomainError.ts`, `RepositoryError.ts` |
| Test | source name + `.test.ts` | `taskService.test.ts` |
| CSS Module | PascalCase + `.module.css` | `TaskList.module.css` |
| Constants | camelCase or PascalCase `.ts` | `defaults.ts`, `errorCodes.ts` |

**Rule:** One primary export per file. A file named `TaskList.tsx` exports a `TaskList` component. A file named `taskStore.ts` exports `useTaskStore`.

---

## 2. Code Naming

### 2.1 TypeScript

| Construct | Convention | Example |
|---|---|---|
| Interface | PascalCase, noun | `Task`, `Project`, `FileEntry`, `PanelInfo` |
| Type alias | PascalCase | `TaskStatus`, `Theme`, `ProviderErrorCode` |
| Enum (if used) | PascalCase, singular | `TaskStatus.Todo` (prefer union types over enums) |
| Function | camelCase, verb-first | `createTask()`, `deleteFile()`, `switchProject()` |
| Variable | camelCase | `activeProject`, `taskCount`, `isLoading` |
| Constant | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `SCHEMA_VERSION`, `DEFAULT_THEME` |
| Boolean variables | `is`, `has`, `can`, `should` prefix | `isLoading`, `hasError`, `canDelete` |
| Arrays | plural nouns | `tasks`, `files`, `messages` |
| Records/Maps | descriptive | `settingsMap`, `providerRegistry` |

### 2.2 React

| Construct | Convention | Example |
|---|---|---|
| Component | PascalCase, noun/noun-phrase | `TaskList`, `CreateProjectDialog`, `FileTreeItem` |
| Custom hook | `use` + PascalCase | `useActiveProject()`, `useTaskStats()`, `useWorkspaceContext()` |
| Event handler | `handle` + Event | `handleClick`, `handleSubmit`, `handleDelete` |
| Event prop | `on` + Event | `onClick`, `onSubmit`, `onDelete` |
| Ref | camelCase + `Ref` | `inputRef`, `panelRef`, `scrollRef` |
| State setter | `set` + StateName | `setTitle`, `setIsOpen`, `setFilter` |

### 2.3 Zustand Stores

| Construct | Convention | Example |
|---|---|---|
| Store hook | `use` + PascalCase + `Store` | `useTaskStore`, `useProjectStore` |
| State fields | camelCase nouns | `tasks`, `activeProjectId`, `isLoading` |
| Mutation methods | camelCase verbs | `addTask`, `removeProject`, `setTheme` |
| Set-all methods | `set` + PluralNoun | `setTasks`, `setFiles`, `setProjects` |
| Hydration method | `hydrate` | `hydrate(data)` |

### 2.4 Services & Repositories

| Construct | Convention | Example |
|---|---|---|
| Service export | `const` + camelCase | `export const taskService = { ... }` |
| Service methods | camelCase, verb-first | `createTask()`, `toggleStatus()`, `switchProject()` |
| Repository methods | CRUD verbs | `findById()`, `findAll()`, `save()`, `remove()` |
| Query methods | `findBy` + Filter | `findByProject()`, `findByProjectAndStatus()` |

---

## 3. Import Order

Imports in every file follow this order, separated by blank lines:

```typescript
// 1. React / framework imports
import { useState, useCallback } from 'react';

// 2. External library imports
import { create } from 'zustand';

// 3. Core imports (src/core/)
import { DomainError } from '../../core/errors/DomainError';
import type { UUID } from '../../core/types/common';

// 4. Shared UI imports (src/ui/)
import { GlassButton } from '../../ui/GlassButton';

// 5. Feature-local imports (same feature directory)
import { useTaskStore } from '../taskStore';
import { taskService } from '../taskService';
import type { Task } from '../types';

// 6. Styles
import styles from './TaskList.module.css';
```

**Rules:**

- `import type` for type-only imports (enforced by TypeScript `verbatimModuleSyntax`).
- No barrel files (`index.ts` re-exports). Import directly from the source file.
- Absolute paths are not used. All imports are relative.

---

## 4. Component Structure

Every React component follows this internal structure:

```typescript
// 1. Imports (see import order above)

// 2. Types/interfaces for this component's props
interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

// 3. Component definition (always named function, never arrow for components)
function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  // 4. Hooks (all hooks at the top, before any logic)
  const [isConfirming, setIsConfirming] = useState(false);

  // 5. Derived state
  const isDone = task.status === 'done';

  // 6. Event handlers
  function handleToggle() {
    onToggle(task.id);
  }

  function handleDelete() {
    if (isConfirming) {
      onDelete(task.id);
      setIsConfirming(false);
    } else {
      setIsConfirming(true);
    }
  }

  // 7. Render
  return (
    <div className={styles.taskItem}>
      {/* JSX */}
    </div>
  );
}

// 8. Export (always named export, never default)
export { TaskItem };
```

**Rules:**

- Named exports only. No `export default`. This ensures import names are consistent across the codebase.
- Named functions for components (not arrow functions). This improves React DevTools display and stack traces.
- All hooks before any logic. No conditional hooks.
- Destructure props in the function signature.

---

## 5. Error Handling

### 5.1 Throwing Errors

```typescript
// Services throw DomainError
throw new DomainError('Task title cannot be empty', 'VALIDATION_ERROR');

// Repositories throw RepositoryError
throw new RepositoryError('Failed to save task', 'STORAGE_ERROR', true);

// AI adapters throw ProviderError
throw new ProviderError('API key not set', 'NOT_CONFIGURED', 'gemini');
```

### 5.2 Catching Errors

```typescript
// Components catch at the action handler level
async function handleCreateTask() {
  try {
    await taskService.createTask(title);
  } catch (error) {
    if (error instanceof DomainError) {
      setErrorMessage(error.message);
    } else {
      setErrorMessage('Something went wrong');
      console.error('[TaskList] Unexpected error:', error);
    }
  }
}
```

### 5.3 Logging

```typescript
// Format: [Module] Action: details
console.error('[TaskService] Failed to create task:', { title, error });
console.warn('[FileRepository] File not found:', { fileId });
console.info('[InitService] Boot complete:', { projectCount: 3, migrated: true });
```

**Rules:**

- Always include the module name in brackets.
- Use `console.error` for failures, `console.warn` for concerning-but-not-broken, `console.info` for significant events.
- Never use `console.log` in production code. Use `console.info` instead.
- Log objects, not string concatenation: `{ fileId }` not `'fileId: ' + fileId`.

---

## 6. TypeScript Strict Rules

### 6.1 Mandatory

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true
  }
}
```

### 6.2 `any` Policy

- `any` is prohibited except in explicitly documented escape hatches.
- When `any` is unavoidable (e.g., third-party library with missing types), add a comment:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dexie upgrade callback types
async (tx: any) => { ... }
```

### 6.3 Assertions

- Avoid type assertions (`as Type`). Prefer type guards or explicit narrowing.
- When assertions are necessary, prefer `satisfies` over `as` where possible.

---

## 7. Comments Policy

### 7.1 When to Comment

| Comment | When |
|---|---|
| **Why** | Always when the reason is non-obvious. "This timeout exists because Dexie transactions close after the microtask queue." |
| **What** | Only for complex algorithms or non-trivial logic. |
| **How** | Never. If the code needs a "how" comment, refactor for clarity. |

### 7.2 When NOT to Comment

```typescript
// ❌ Don't restate the code
// Set the theme to dark
setTheme('dark');

// ❌ Don't comment obvious things
// Loop through tasks
tasks.forEach(task => { ... });

// ✅ Do explain non-obvious decisions
// Debounce at 300ms — IndexedDB write is ~5ms but React re-render
// after store update can cause input lag if we save on every keystroke
const debouncedSave = useDebouncedCallback(saveContent, 300);
```

### 7.3 TODO Format

```typescript
// TODO(v0.4): Add semantic search support
// TODO: Implement file drag-and-drop (nice-to-have)
// FIXME: Race condition when switching projects rapidly
// HACK: Temporary workaround for Dexie compound index limitation
```

Always include context. `// TODO: fix this` is not acceptable.

---

## 8. Commit Message Format

### 8.1 Conventional Commits

```
<type>(<scope>): <description>

[optional body]
```

### 8.2 Types

| Type | Usage |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that doesn't add a feature or fix a bug |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `chore` | Build, config, dependencies |
| `style` | Formatting, CSS changes (no logic change) |
| `perf` | Performance improvement |

### 8.3 Scopes

Use feature names as scopes: `projects`, `files`, `tasks`, `notes`, `settings`, `memory`, `shell`, `ai`, `core`, `ui`.

### 8.4 Examples

```
feat(tasks): add task creation with auto-save
fix(files): prevent folder cycle during move operation
refactor(ai): migrate Gemini from aiService to adapter pattern
docs(phase2): add interface contracts
test(tasks): add taskService unit tests
chore: update Dexie to 4.x
```

---

## 9. Git Conventions

### 9.1 Branch Naming

```
feature/<scope>-<short-description>
fix/<scope>-<short-description>
refactor/<scope>-<short-description>
```

Examples:

```
feature/tasks-create-task
fix/files-folder-delete-recursive
refactor/ai-provider-abstraction
```

### 9.2 Commit Frequency

- Commit after each logical unit of work is complete.
- Never commit broken code to `main`.
- Feature branches are okay with WIP commits — squash on merge.

---

## 10. Testing Conventions

### 10.1 Test File Location

Co-located with source: `taskService.test.ts` next to `taskService.ts`.

### 10.2 Test Naming

```typescript
describe('taskService', () => {
  describe('createTask', () => {
    it('creates a task with valid title', async () => { ... });
    it('throws VALIDATION_ERROR for empty title', async () => { ... });
    it('throws VALIDATION_ERROR for title exceeding 500 chars', async () => { ... });
    it('generates a UUID v4 id', async () => { ... });
    it('persists via taskRepository', async () => { ... });
    it('updates taskStore on success', async () => { ... });
  });
});
```

**Pattern:** `describe(module) > describe(method) > it(behavior)`

### 10.3 Test Structure (AAA)

```typescript
it('creates a task with valid title', async () => {
  // Arrange
  const mockRepo = { save: vi.fn().mockResolvedValue(undefined) };

  // Act
  const task = await taskService.createTask('Buy milk');

  // Assert
  expect(task.title).toBe('Buy milk');
  expect(task.status).toBe('todo');
  expect(mockRepo.save).toHaveBeenCalledOnce();
});
```

---

## Document Metadata

| | |
|---|---|
| **Dependencies** | Engineering Decisions (TypeScript strict, Zustand naming, test framework), Folder Architecture (file placement) |
| **Used By** | Every contributor. Every file created must follow these standards. |
| **Future Versions** | Standards may expand with linting rules (ESLint config), formatting rules (Prettier config), and CI enforcement. |
| **Breaking Change Risk** | **Low** — These are conventions, not architecture. Changing a naming convention requires a codebase-wide rename but doesn't break functionality. |
