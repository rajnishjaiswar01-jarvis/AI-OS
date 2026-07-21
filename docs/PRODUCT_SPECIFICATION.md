# AI OS — Product Specification

> **Document Type:** Product Specification  
> **Version:** v0.3.0  
> **Status:** Active  
> **Last Updated:** 2026-07-10  
> **Depends On:** [VISION_LOCK.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/VISION_LOCK.md)  
> **Audience:** Engineering, product, and design contributors

This document defines **what** AI OS v0.3.0 will build. It does not define **how** (implementation). Every decision traces back to the Vision Lock.

---

## 1. Product Overview

AI OS is an AI-augmented workspace environment that runs inside the browser, on top of existing operating systems. It provides a unified surface for managing projects, files, notes, tasks, settings, and local memory — with an optional AI service layer that augments (but never defines) the workspace experience.

**v0.3.0 — Workspace Foundation** transforms AI OS from a UI shell with a chat feature into a functional workspace where users can perform real organizational work.

### Current State (v0.2.0)

| Layer | Status |
|---|---|
| Desktop metaphor (windows, dock, top bar, boot screen) | Shipped (v0.1) |
| AI chat with Gemini, session memory, markdown rendering | Shipped (v0.2) |
| Theme engine (dark/light), wallpaper system | Shipped (v0.1) |
| Workspace primitives (projects, files, notes, tasks) | **Not yet built** |
| Structured persistence (beyond localStorage) | **Not yet built** |
| AI provider abstraction | **Not yet built** — Gemini is directly coupled |

### v0.3.0 Target State

A user can open AI OS, create a project, manage files, write notes, track tasks, and close the browser — then return later with everything intact. The AI chat continues to work, but the workspace functions fully without it.

---

## 2. Product Objectives

| # | Objective | Rationale |
|---|---|---|
| O1 | Deliver functional workspace primitives | The Vision Lock (Section 10.1) establishes that the workspace is the foundation; AI is valuable only when it operates on real user data. Without workspace primitives, AI OS is a themed chatbot. |
| O2 | Establish structured, persistent data storage | Current state uses raw `localStorage` strings (appStore.ts lines 30, 40). This cannot scale to projects, files, and tasks. Vision Lock Section 12.2 requires "structured, queryable format." |
| O3 | Migrate AI integration behind a provider abstraction | Current `aiService.ts` directly imports `@google/genai`. Vision Lock Section 9.3 mandates provider-agnostic architecture. v0.3.0 must establish this boundary. |
| O4 | Maintain visual and architectural consistency | All new workspace apps must use the existing glass-morphism design language and integrate with the panel/window system from v0.1. |
| O5 | Preserve offline workspace functionality | Vision Lock Section 8 (AI Independence Principle) requires all workspace operations to function without any AI provider or internet connection. |

---

## 3. Target Users

AI OS v0.3.0 serves a narrow audience. This is intentional — the product is in planning phase and the audience expands with the product.

### Primary: Developer-Builders

Technically fluent individuals who will both use and contribute to AI OS. They are comfortable with browser-based tools, understand the desktop metaphor being simulated, and can tolerate rough edges in exchange for early access to the vision.

### Secondary: Organized Knowledge Workers

People who manage multiple projects, notes, and tasks simultaneously and want a unified workspace. They arrive in later versions when the workspace is mature enough to compete with dedicated tools.

### Not Yet Target Users (Future Versions)

| User Type | When |
|---|---|
| Plugin developers | v0.6 (Plugin Ecosystem) |
| Non-technical end users | v1.0 (Production Release) |
| Enterprise / team users | Post v1.0 |

---

## 4. User Personas

### 4.1 Ritik — Solo Developer & Builder

- **Background:** Full-stack developer building side projects and learning AI integration.
- **Current workflow:** VS Code, browser tabs, Notion for notes, Todoist for tasks, ChatGPT/Gemini for AI. Constantly switching between 5+ apps.
- **Pain point:** Context fragmentation. Starting a new project means setting up notes in one tool, tasks in another, and AI chat in a third. Nothing connects.
- **What v0.3.0 gives him:** A single workspace where he opens a project and everything (files, notes, tasks) lives together. When AI chat arrives contextually in later versions, it already knows his project.
- **What v0.3.0 does NOT give him:** Terminal, code editor, Jarvis, or plugin system. Those are later versions.

### 4.2 Priya — Freelance Content Creator

- **Background:** Manages 3–4 client projects simultaneously. Not a developer but comfortable with digital tools.
- **Current workflow:** Google Docs, Trello, browser bookmarks, WhatsApp for client communication.
- **Pain point:** Losing track of where things are. Files in one place, tasks in another, notes scattered across apps.
- **What v0.3.0 gives her:** Project-based organization where each client has a workspace with their files, notes, and tasks in one view.
- **Limitation:** Priya becomes a stronger target user once the workspace has cloud sync and sharing (post v0.3.0).

### 4.3 The Tinkerer — Early Adopter

- **Background:** Tries every new productivity tool. Wants to see where AI OS is going.
- **Current workflow:** Varies; the tool itself is the interest.
- **What v0.3.0 gives them:** A functional workspace that demonstrates the AI OS vision beyond a UI demo.
- **Risk:** If v0.3.0 is just "another Notion clone," this user leaves. The differentiation comes in v0.4+ when AI begins augmenting the workspace.

---

## 5. Problems AI OS Solves

### 5.1 Context Fragmentation

**Problem:** Users manage their work across 5–10 disconnected tools. Projects exist in VS Code, notes in Notion, tasks in Todoist, AI chat in ChatGPT, files in Finder/Explorer. Each tool has its own login, its own data format, its own mental model.

**AI OS approach:** One environment, one project context. Files, notes, tasks, and (later) AI all operate within the same workspace. The project is the unifying concept.

### 5.2 AI as an Afterthought

**Problem:** AI chat tools (ChatGPT, Gemini) are standalone experiences. They don't know about your projects, your files, or your tasks. You copy-paste context in and results out.

**AI OS approach:** AI is a layer that will eventually read workspace context. v0.3.0 builds the context (the workspace) that future AI features need. Without it, contextual AI is impossible.

### 5.3 Tool Vendor Lock-In

**Problem:** Switching from Notion to Obsidian or from Trello to Linear means exporting/importing data, relearning workflows, and losing integrations.

**AI OS approach:** Open, local-first data. The virtual filesystem and workspace data belong to the user, stored client-side. Future versions will add export capabilities, but the data is never locked behind a proprietary cloud.

### 5.4 AI Provider Dependency

**Problem:** Users who build workflows on a single AI provider are exposed to pricing changes, API deprecations, and outages.

**AI OS approach:** Provider abstraction layer. The workspace functions without AI. When AI is used, providers can be swapped without affecting the workspace.

---

## 6. Core Features (v0.3.0)

Every feature below traces directly to the Vision Lock Section 11.2 (In Scope).

### F1: Project Management

| Property | Detail |
|---|---|
| **Description** | Users can create, open, rename, delete, and switch between projects. A project is the top-level organizational unit. |
| **Data model** | Each project contains: name, creation date, last modified date, and is the parent container for files, notes, and tasks. |
| **Constraints** | Projects are local-only. No sharing, no templates, no collaboration in v0.3.0. |
| **Workspace integration** | Switching projects changes the active context for the file browser, notes, and task views. |

### F2: Virtual File System

| Property | Detail |
|---|---|
| **Description** | Users can browse, create, rename, move, and delete files and folders within a project. |
| **Storage** | Client-side via Dexie.js (IndexedDB). Not real filesystem access. File content stored as Blobs — including text files — to avoid future migration when binary file support is added. |
| **File types** | Plain text and markdown initially. Binary file support is not in v0.3.0 scope, but the Blob-first storage model ensures the schema is ready for it without migration. |
| **Constraints** | No file preview, no search, no version history in v0.3.0. Drag-and-drop is desirable but not required. |
| **UI** | Tree-view file browser rendered as a panel in the window management system. |

### F3: Notes

| Property | Detail |
|---|---|
| **Description** | Users can create, edit, and delete plain-text and markdown notes within a project. |
| **Editor** | Markdown editing with live preview. Must support headings, lists, bold/italic, code blocks, and links. |
| **Constraints** | No rich-text WYSIWYG editor. No image embedding. No collaborative editing. |
| **Persistence** | Notes are stored as files within the virtual file system. A note is a file with a `.md` or `.txt` extension. |

### F4: Task Management

| Property | Detail |
|---|---|
| **Description** | Users can create, complete, edit, delete, and organize tasks within a project. |
| **Data model** | Task has: title, completion status, creation date. Optional: description, priority, due date. |
| **Constraints** | No subtasks, no assignees, no calendar integration, no recurring tasks in v0.3.0. |
| **UI** | Task list panel with create, toggle complete, and delete actions. |

### F5: Settings

| Property | Detail |
|---|---|
| **Description** | Centralized user preferences including theme, wallpaper, and workspace configuration. |
| **Migration** | Existing settings (theme, wallpaper) must be migrated from raw `localStorage` to the new persistence layer. |
| **Extensibility** | The settings data model must accommodate future settings (AI provider config, keybindings, etc.) without schema rewrites. |

### F6: Memory

| Property | Detail |
|---|---|
| **Description** | Local, persistent workspace memory for context that spans sessions. |
| **Scope** | Workspace-level metadata: recent projects, recent files opened, workspace-level preferences, and activity context. |
| **Clarification** | This is **workspace memory**, not AI memory. It does not store conversation history or AI-generated insights. AI memory is a future concern (v0.4+). |
| **Storage** | Part of the structured persistence layer, same as projects and tasks. |

### F7: Workspace Persistence

| Property | Detail |
|---|---|
| **Description** | All workspace state persists across browser sessions. |
| **Requirements** | Closing the browser and reopening AI OS restores: open projects, file tree state, note content, task lists, settings, and memory. |
| **Technology decision** | Dexie.js (IndexedDB wrapper) with schema versioning. Frozen decision — see [ENGINEERING_DECISIONS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md) Section 3.1. |
| **Data abstraction** | The persistence layer is accessed through a repository abstraction. All data flows through the four-layer stack: Component → Store → Service → Repository → Dexie. See [ENGINEERING_DECISIONS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md) Section 4.1. |

### F8: Window Management Improvements

| Property | Detail |
|---|---|
| **Description** | Refinements to the existing Panel component to support multiple workspace apps. |
| **Requirements** | Each workspace app (file browser, notes, tasks) opens in its own draggable, resizable panel. Multiple panels can be open simultaneously. |
| **Existing base** | `Panel.tsx` already supports basic dragging and closing. Improvements may include: minimize, maximize, z-ordering, and panel state persistence. |

### F9: AI Provider Abstraction

| Property | Detail |
|---|---|
| **Description** | Migrate the existing Gemini-coupled AI service behind a provider-agnostic abstraction. |
| **Current state** | `aiService.ts` directly imports `@google/genai`. `ai.ts` config references Gemini-specific environment variables. |
| **Target state** | A provider interface that the workspace consumes. Gemini becomes one adapter behind this interface. Adding OpenRouter or OpenAI requires implementing an adapter, not modifying workspace code. |
| **v0.3.0 scope** | Define the interface. Migrate Gemini behind it. The workspace must not import any AI provider module directly. Adding a second provider is a validation test, not a shipping requirement. |

---

## 7. Out of Scope (v0.3.0)

Consolidated from Vision Lock Section 11.3. Each exclusion includes the rationale to prevent scope creep.

| Feature | Rationale | Target Version |
|---|---|---|
| Jarvis / personal assistant | Requires mature workspace data to be useful. Building Jarvis on an empty workspace produces a demo. | v0.7 |
| Voice input/output | Not a workspace primitive. Adds complexity without strengthening the workspace foundation. | TBD |
| Terminal emulator | Developer tooling. The workspace must be useful before developer features layer on top. | v0.5 |
| Code editor | Developer tooling. | v0.5 |
| Plugin system / marketplace | Requires stable core APIs that don't exist yet. Premature extension points lead to breaking changes. | v0.6 |
| Cloud sync | Local-first is the current constraint. Cloud sync introduces auth, conflict resolution, and infrastructure. | Post v0.5 |
| Multi-agent workflows | Requires deep AI integration. | v0.7+ |
| AI-powered workspace features | Smart search, AI-assisted notes, auto-tagging. These require the workspace to exist first (they operate on workspace data). | v0.4 |
| Real filesystem access | Browser File System Access API has inconsistent support. Virtual FS first, real FS later. | v0.5+ |
| Collaboration / sharing | Multiplayer is a post-1.0 concern. | Post v1.0 |
| Mobile / responsive layout | Desktop-first. Responsive comes after the core experience is stable. | v0.5+ |

---

## 8. Functional Requirements

### FR1: Project Lifecycle

- FR1.1: User can create a new project with a name.
- FR1.2: User can rename an existing project.
- FR1.3: User can delete a project (with confirmation).
- FR1.4: User can switch between projects. Switching updates the active context for files, notes, and tasks.
- FR1.5: The most recently active project is restored on startup.
- FR1.6: A default project exists if the user has never created one.

### FR2: File Operations

- FR2.1: User can create files and folders within a project.
- FR2.2: User can rename files and folders.
- FR2.3: User can move files between folders.
- FR2.4: User can delete files and folders (with confirmation for non-empty folders).
- FR2.5: File tree reflects the current project's contents and updates in real time.
- FR2.6: File content is editable for text and markdown files.

### FR3: Notes

- FR3.1: User can create a new note (markdown file) within a project.
- FR3.2: User can edit note content with markdown support.
- FR3.3: User can delete a note.
- FR3.4: Notes save automatically (auto-save on change, debounced).
- FR3.5: Notes are stored as files in the virtual file system, not as a separate data model.

### FR4: Tasks

- FR4.1: User can create a task with a title.
- FR4.2: User can mark a task as complete or incomplete.
- FR4.3: User can delete a task.
- FR4.4: User can edit a task's title.
- FR4.5: Tasks are displayed in a list, sorted by creation date (newest first) with completed tasks at the bottom.
- FR4.6: Tasks belong to the active project.

### FR5: Settings

- FR5.1: Theme and wallpaper preferences persist in the new storage layer (not raw `localStorage`).
- FR5.2: Settings are restored correctly on startup.
- FR5.3: Existing Settings app continues to function without regression.

### FR6: Memory

- FR6.1: Workspace remembers the last active project and restores it on startup.
- FR6.2: Workspace remembers recently opened files and recently opened notes.
- FR6.3: Memory is purely local and contains no AI-generated data.

### FR7: Persistence

- FR7.1: All workspace data (projects, files, notes, tasks, settings, memory) survives browser close and reopen.
- FR7.2: Data corruption from unexpected browser termination (crash, force-close) does not result in total data loss.
- FR7.3: Storage mechanism supports querying (e.g., "all tasks for project X") without loading entire datasets into memory.

### FR8: Window Management

- FR8.1: File browser, notes editor, and task list each open in their own panel.
- FR8.2: Multiple panels can be open simultaneously.
- FR8.3: Panel positions and open/close state persist across sessions.
- FR8.4: Panels are draggable and resizable (existing Panel.tsx behavior).

### FR9: AI Abstraction

- FR9.1: The existing chat feature continues to work through the new provider abstraction.
- FR9.2: No workspace module imports any AI provider SDK directly.
- FR9.3: Provider selection is configurable through settings (for v0.3.0, this may be environment-variable-based; UI-based selection can follow).

---

## 9. Non-Functional Requirements

### NFR1: Performance

- Workspace operations (create file, switch project, toggle task) must complete in under 100ms perceived latency.
- The application must remain responsive with 10+ open panels.
- Storage operations must not block the main thread. Use asynchronous APIs (IndexedDB is async by nature).

### NFR2: Offline Capability

- All workspace features (F1–F8) must function without any network connection.
- AI chat (F9) degrades gracefully when offline: the UI shows a clear "offline" indicator; no error dialogs, no broken state.

### NFR3: Data Integrity

- No user data loss during normal operation.
- Graceful handling of storage quota limits (IndexedDB has browser-specific limits, typically 50%+ of available disk).
- Data operations should be transactional where possible (if a project deletion fails mid-way, the project should not be left in a corrupted state).

### NFR4: Visual Consistency

- All new UI components use the existing glass-morphism design language.
- All components respond correctly to theme changes (dark/light).
- No new color palette or visual paradigm introduced.

### NFR5: Maintainability

- Clear module boundaries between workspace features (projects, files, notes, tasks).
- No circular dependencies between modules.
- All cross-module communication through typed interfaces.
- Components remain under 300 lines. Extract logic into hooks or services when larger.

### NFR6: Browser Compatibility

- Primary target: Chromium-based browsers (Chrome, Edge, Brave).
- Secondary target: Firefox, Safari.
- IndexedDB is supported across all targets. Specific API features (e.g., Storage Buckets API) may require polyfills.

### NFR7: Accessibility (Baseline)

- All interactive elements must be keyboard-navigable.
- Panels must have proper focus management.
- ARIA labels on icon-only buttons.
- Full accessibility audit is a v1.0 concern, but v0.3.0 must not introduce accessibility regressions.

---

## 10. User Journey

### 10.1 First Launch

```
User opens AI OS → Boot screen → Desktop appears
  → Default project "My Workspace" is active
  → Dock shows: Files, Notes, Tasks, Chat, Settings
  → File browser panel shows empty project
  → User creates their first note → "Welcome to AI OS"
  → Note auto-saves → User closes browser
  → Reopens AI OS → Note is still there, project intact
```

### 10.2 Multi-Project Workflow

```
User has 2 projects: "Client A" and "Side Project"
  → Opens AI OS → Last active project ("Side Project") restores
  → Switches to "Client A" → File tree, notes, tasks update
  → Creates a task: "Send proposal"
  → Switches back to "Side Project" → Client A's task is not visible
  → Switches to Client A again → Task is still there, completed status preserved
```

### 10.3 AI Chat Alongside Workspace

```
User opens Chat panel and Notes panel side by side
  → Writes a question in Chat → AI responds (if online)
  → Copies a code snippet from AI response into a note
  → Saves the note → Continues chatting
  → Loses internet → Chat shows "offline" indicator
  → Notes, files, tasks continue working normally
  → Internet returns → Chat is functional again
```

### 10.4 Offline Workspace

```
User is on a train, no internet
  → Opens AI OS → Workspace loads from IndexedDB
  → Creates a new project → Adds files and tasks
  → Opens Chat → Sees "AI unavailable — no connection"
  → All other workspace features work normally
  → User closes laptop → Reopens later with internet
  → Workspace data is intact, Chat is functional again
```

---

## 11. Success Metrics

v0.3.0 is a planning-phase release. Traditional product metrics (DAU, retention, NPS) are premature. Success is measured by engineering quality and completeness.

### 11.1 Ship Criteria (Must Pass)

These are binary — the release ships only if all are true.

| # | Criterion | Measurement |
|---|---|---|
| S1 | All functional requirements (FR1–FR9) are implemented | Manual verification against each FR |
| S2 | Zero data loss across 10 consecutive browser session cycles | Automated or manual test: create data → close → reopen → verify, repeated |
| S3 | Workspace functions fully offline | Disconnect network → perform all workspace operations → verify |
| S4 | Existing v0.2.0 chat works without regression | Manual verification of chat send/receive/retry/stop/clear |
| S5 | No workspace module imports any AI provider SDK | Static analysis of import graph |
| S6 | Theme engine applies correctly to all new components | Visual inspection in dark and light mode |

### 11.2 Quality Signals (Aspirational)

| Signal | Target |
|---|---|
| Time to first meaningful action (create a note) | Under 5 seconds from boot |
| Panel open/close/drag latency | Under 50ms |
| Storage operation latency (save file, create task) | Under 100ms |
| Total bundle size (gzipped) | Under 500KB (excluding heavy dependencies) |

### 11.3 What Does NOT Define Success

- Number of AI providers supported. One (Gemini) behind the abstraction is sufficient.
- Feature parity with Notion, Obsidian, or Todoist. AI OS is not competing on feature count.
- User acquisition numbers. The audience is the development team and early testers.

---

## 12. Risks

### R1: Scope Creep into AI Features

**Risk:** During v0.3.0 development, the temptation to add AI-powered file search, smart notes, or Jarvis hooks will arise.

**Mitigation:** The Vision Lock explicitly excludes these (Section 11.3). Every feature must pass the AI Independence test (Section 8.3): "Does this feature work if every AI provider returns a 503?"

### R2: IndexedDB Complexity

**Risk:** IndexedDB's API is notoriously verbose and error-prone. Building a performant, reliable data layer on top of it requires careful abstraction.

**Mitigation:** Use a mature IndexedDB wrapper (e.g., idb, Dexie.js) rather than raw IndexedDB APIs. The abstraction layer must hide IndexedDB specifics from workspace components. Evaluate wrapper options before implementation begins.

### R3: Data Model Instability

**Risk:** The data model for projects, files, notes, and tasks is being defined for the first time. Getting it wrong means painful migrations later.

**Mitigation:** Design the schema with versioning from day one. Include a schema version field in the database. Plan for schema migrations as a first-class capability, not an afterthought.

### R4: Provider Abstraction Over-Engineering

**Risk:** Building a perfectly generic AI provider abstraction when only one provider (Gemini) is active. This can lead to speculative interfaces that don't match real provider requirements.

**Mitigation:** Design the abstraction by studying 2–3 real providers (Gemini, OpenAI, OpenRouter). Define the interface to fit what providers actually offer, not what might theoretically exist. Validate by implementing one additional adapter as a spike — but don't ship it if it isn't ready.

### R5: Performance Degradation with Scale

**Risk:** The workspace may feel fast with 1 project and 5 files but slow with 20 projects and 500 files.

**Mitigation:** Design the data layer with pagination and lazy loading from the start. The file tree should not load all files into memory at once. Test with realistic data volumes during development.

### R6: localStorage Migration

**Risk:** Existing v0.2.0 users have theme and wallpaper preferences in `localStorage`. Migrating to IndexedDB could lose these preferences.

**Mitigation:** Implement a one-time migration that reads existing `localStorage` values, writes them to the new storage layer, and then removes the old keys. Test the migration path explicitly.

### R7: Browser Storage Limits

**Risk:** IndexedDB storage limits vary by browser (Chrome: 80% of disk, Firefox: 2GB default, Safari: 1GB). Users may hit limits unknowingly.

**Mitigation:** Monitor storage usage and display a warning when approaching limits. Do not silently fail when storage is full.

---

## 13. Assumptions

These assumptions underpin the spec. If any are invalidated, the spec needs revision.

| # | Assumption | Impact if Wrong |
|---|---|---|
| A1 | IndexedDB is sufficient for v0.3.0 data storage needs. | Need to evaluate OPFS (Origin Private File System) or other alternatives. |
| A2 | A single-page application with client-side state (Zustand) can manage workspace complexity. | May need to consider a more robust state management pattern or move to a backend. |
| A3 | The existing Panel component can be extended to support multiple workspace apps. | May need a rewrite of the window management system. |
| A4 | Users will tolerate a virtual file system (no real FS access). | May lose users who expect native file integration. Acceptable for v0.3.0. |
| A5 | One AI provider (Gemini) is sufficient to validate the provider abstraction design. | May need to implement a second adapter to prove the abstraction works. Vision Lock Section 12.2 suggests this as a validation criterion. |
| A6 | The glass-morphism design language scales to productivity interfaces (file browsers, editors, task lists). | May need design adjustments. Productivity UIs need readability over aesthetics. |
| A7 | The development team can deliver all v0.3.0 features before moving to v0.4. | If not, the "Solve One Problem Completely" principle (Vision Lock 10.3) means we ship fewer features done well, not more features done poorly. |

---

## 14. Future Expansion

How v0.3.0 decisions enable future versions. These are NOT in scope — they explain why certain v0.3.0 decisions matter.

### v0.4 (Local Intelligence) ← Depends on v0.3.0

- The provider abstraction from F9 enables local model integration without workspace changes.
- The workspace memory (F6) can be extended with AI-generated context (recent queries, workspace summaries).
- The structured data layer (F7) enables AI-powered search across files, notes, and tasks.

### v0.5 (Developer Platform) ← Depends on v0.3.0

- The virtual file system (F2) provides the foundation for a code editor and terminal.
- The panel system (F8) supports developer tools as additional window types.
- The project model (F1) maps naturally to development project concepts.

### v0.6 (Plugin Ecosystem) ← Depends on v0.5

- The data abstraction layer provides stable APIs for plugins to read/write workspace data.
- The provider abstraction could be extended to allow community-contributed AI adapters.

### v0.7 (Jarvis) ← Depends on v0.4, v0.5, v0.6

- Jarvis needs: workspace data (v0.3.0), AI context (v0.4), developer tools (v0.5), and extensibility (v0.6).
- This is why Jarvis is v0.7 and not v0.3.0. The dependencies are structural, not arbitrary.

---

## 15. Architectural Decisions

Decisions made at the specification level. Implementation details are out of scope for this document.

### AD1: Notes Are Files, Not a Separate Entity

**Decision:** Notes are stored as `.md` or `.txt` files in the virtual file system — not as a separate database table or data model.

**Rationale:** This unifies the data model. A note and a file are the same thing. This avoids maintaining two parallel storage systems and makes it natural for the code editor (v0.5) to open notes.

**Trade-off:** Notes cannot have metadata (tags, categories) that files don't support. If note-specific metadata is needed, it should be stored as YAML frontmatter within the file, not as a parallel schema.

### AD2: Tasks Are a Separate Entity, Not Files

**Decision:** Tasks are stored as structured data in the persistence layer, not as files.

**Rationale:** Tasks have structured fields (title, status, priority, due date) that benefit from queryable storage. Storing tasks as files would require parsing file content to determine completion status, which is fragile. Tasks also need to be listed, filtered, and sorted — operations that are efficient in a database and slow in a file system.

**Trade-off:** This creates two data models (files and tasks) rather than one. The trade-off is justified by the query requirements.

### AD3: Project as the Top-Level Container

**Decision:** The project is the top-level organizational unit. Files, notes, and tasks belong to a project. There is no concept above "project."

**Rationale:** This mirrors how developers think (repositories, workspaces) and how productivity tools organize data (Notion workspaces, Todoist projects).

**Trade-off:** Users who want cross-project features (global search, cross-project tasks) will need to wait for a future version. This is acceptable — solving within-project organization completely is the v0.3.0 goal.

### AD4: Schema Versioning from Day One

**Decision:** The IndexedDB schema must include a version number. Every schema change must include a migration function.

**Rationale:** The data model will evolve across v0.3 → v0.4 → v0.5 → v1.0. Without versioned migrations, updating the app will break existing user data.

**Trade-off:** Adds development overhead for every schema change. Justified by the long-term cost of data migrations done ad-hoc.

### AD5: Provider Abstraction Scope

**Decision:** The provider abstraction defines a TypeScript interface for AI completion. v0.3.0 ships one adapter (Gemini). The interface is validated by implementing a second adapter as a spike — not as a shipped feature.

**Rationale:** Over-engineering the abstraction for providers we haven't tested leads to speculative interfaces. Under-engineering it means repeating the migration effort in v0.4. The middle path: design based on 2–3 real provider APIs, ship one, validate another.

**Trade-off:** Only one provider is usable in v0.3.0. This is acceptable — the abstraction's value is in preventing vendor lock-in for future versions.

### AD6: No Backend in v0.3.0

**Decision:** AI OS v0.3.0 is entirely client-side. No backend server, no database server, no API proxy.

**Rationale:** Adding a backend introduces deployment complexity, hosting costs, and authentication requirements. The client-side architecture is sufficient for v0.3.0's workspace features. API keys are used client-side (as in v0.2.0) — the security concern is documented but not solved until a backend exists.

**Trade-off:** API keys are exposed in the browser. This is a known, accepted risk for v0.3.0. A backend proxy is a future requirement.

### AD7: Mandatory Service Layer Rule

**Decision:** All data access follows a strict four-layer stack: Component → Store → Service → Repository → Dexie. No shortcuts permitted.

**Rationale:** When cloud sync is added (post v0.5), only the repository layer changes — services, stores, and components remain untouched. This separation also enables testability (repositories are mockable) and storage swappability (replacing Dexie requires changes only in the repository layer).

**Trade-off:** More files and more indirection for simple CRUD operations. A "create task" flow touches 4 layers instead of 2. This overhead is justified by the long-term architectural benefits — particularly the cloud sync readiness and testability it enables.

**Enforcement:** Components and stores must never import repositories or Dexie. Services must never import Dexie directly. Only repositories import Dexie. See [ENGINEERING_DECISIONS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md) Section 4.1.

---

*This specification defines what AI OS v0.3.0 will build. Implementation details belong in technical design documents. Every feature traces to the [Vision Lock](file:///c:/Users/ritik/jarvis/AI%20OS/docs/VISION_LOCK.md). Engineering decisions are frozen in [ENGINEERING_DECISIONS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md).*
