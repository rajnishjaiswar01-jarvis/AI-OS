# AI OS — Version Roadmap

> **Document Type:** Version Roadmap  
> **Version:** v0.3.0  
> **Status:** Active  
> **Last Updated:** 2026-07-10  
> **Depends On:** [VISION_LOCK.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/VISION_LOCK.md)  
> **Audience:** All contributors, architects, and project planners

This roadmap defines the purpose, scope, dependencies, and success criteria for every planned version of AI OS from v0.1 through v1.0.

Each version builds on the previous one and delivers independent value. No version exists solely as scaffolding for a future version (Vision Lock, Section 10.2).

---

## Version Dependency Graph

```text
v0.1 UI Foundation
  │
  └──▶ v0.2 AI Core
         │
         └──▶ v0.3 Workspace Foundation
                │
                ├──▶ v0.4 Local Intelligence
                │     │
                │     └──▶ v0.5 Developer Platform
                │           │
                │           └──▶ v0.6 Plugin Ecosystem
                │                 │
                │                 └──▶ v0.7 Jarvis Preview
                │                       │
                └───────────────────────┴──▶ v1.0 AI Operating Environment
```

---

## v0.1 — UI Foundation ✅

### Goal

Establish the visual identity and desktop metaphor that all future versions build upon.

### Major Features

- Glass-morphism desktop environment
- Dock with app launcher icons
- Top bar with system status, clock, and theme controls
- Draggable, closable window panels
- Theme engine (dark/light mode) with CSS custom properties
- Dynamic wallpaper system (space, aurora gradients)
- Cinematic boot screen animation
- Clock widget
- System status indicators
- Reusable UI primitives: GlassButton, GlassCard, Input, Widget

### Purpose

AI OS needs a visual identity before it can be a workspace. The desktop metaphor provides familiarity; the glass-morphism design language provides differentiation. This version answers the question: "What does AI OS look and feel like?"

### Why It Exists

Without a consistent visual foundation, every subsequent feature would need to independently solve theming, layout, windowing, and styling. v0.1 centralizes these concerns so that future versions focus on functionality, not aesthetics.

### Dependencies

None. This is the first version.

### Success Criteria ✅

- [x] Desktop loads with dock, top bar, and wallpaper.
- [x] Panels open from dock, are draggable, and closable.
- [x] Theme toggle switches between dark and light mode.
- [x] Boot screen animation plays on first load.
- [x] The design language is visually cohesive and differentiated from default browser UI.

---

## v0.2 — AI Core ✅

### Goal

Integrate conversational AI into the workspace, establishing the AI service layer and chat experience.

### Major Features

- Gemini AI integration with session conversation memory
- Chat app with full conversation UI
- Markdown rendering with syntax-highlighted code blocks
- Reusable CodeBlock component with copy-to-clipboard
- Retry response and stop generation controls
- Token usage tracking per message and per session
- AI personality system with Hinglish/Roman Hindi language matching
- Smart auto-scroll behavior
- Production-ready error handling with typed error codes
- AI status indicators (ready, thinking, error)

### Purpose

This version answers: "What does it feel like to talk to AI OS?" The chat is the first AI touchpoint — but it is built as a service layer, not just a UI. The `aiService.ts` module encapsulates all Gemini communication, making it possible (and required) to abstract it later.

### Why It Exists

AI is in the product's name. v0.2 proves the concept works: users can have meaningful conversations with an AI integrated into their workspace. However, the AI is currently a standalone chat — not yet contextually aware of the workspace. That integration comes after the workspace exists (v0.4+).

### Dependencies

- v0.1 (UI Foundation): Panels, theming, dock, desktop layout.

### Success Criteria ✅

- [x] User can send messages and receive AI responses.
- [x] Conversation history is maintained within a session.
- [x] Code blocks render with syntax highlighting and copy button.
- [x] Users can retry failed responses and stop in-progress generation.
- [x] Token usage is tracked and displayed.
- [x] Errors are handled gracefully — no raw error dumps.

### Technical Debt Carried Forward

| Debt Item | Impact | Resolution Target |
|---|---|---|
| Gemini SDK directly imported in `aiService.ts` | Prevents provider switching | v0.3.0 (provider abstraction) |
| API key exposed client-side via `import.meta.env` | Security risk | v0.5+ (backend proxy) |
| Chat history not persisted across sessions | User loses conversations on refresh | v0.3.0 or v0.4 |
| AI config hardcoded to Gemini env vars | Cannot support multiple providers | v0.3.0 (provider abstraction) |

---

## v0.3 — Workspace Foundation 🔄 (Current)

### Goal

Transform AI OS from a UI shell with a chat feature into a functional workspace where users can perform real organizational work.

### Major Features

- **Project Management:** Create, open, switch, rename, delete projects.
- **Virtual File System:** Tree-view file browser with create, rename, move, delete operations. Client-side storage (IndexedDB).
- **Notes:** Markdown note creation and editing within projects. Notes are files in the virtual FS.
- **Task Management:** Create, complete, edit, delete tasks within a project context.
- **Settings Migration:** Existing theme/wallpaper settings migrated from raw `localStorage` to structured storage.
- **Workspace Memory:** Local, persistent memory for recent projects, recent files, and workspace-level metadata.
- **Workspace Persistence:** All data (projects, files, notes, tasks, settings, memory) persists across browser sessions via IndexedDB.
- **Window Management Improvements:** Panel enhancements to support multiple workspace apps simultaneously.
- **AI Provider Abstraction:** Gemini integration migrated behind a provider-agnostic interface. The workspace has zero direct dependencies on any AI SDK.

### Purpose

This is the most important version in the roadmap. It builds the structural backbone — the data layer, the organizational model, the persistence story — that every subsequent version depends on. v0.4 cannot add AI intelligence without workspace data to operate on. v0.5 cannot add developer tools without a file system. v0.7 cannot introduce Jarvis without a workspace to assist with.

### Why It Exists

v0.1 and v0.2 proved that AI OS can look good and chat. v0.3 proves it can be useful. After this version, AI OS is no longer a demo — it's a tool.

### Dependencies

- v0.1 (UI Foundation): Panel system, theming, dock, desktop layout.
- v0.2 (AI Core): Chat app, AI service (to be abstracted).

### Explicitly Out of Scope

| Excluded | Rationale |
|---|---|
| Jarvis | v0.7. Workspace must mature first. |
| Voice I/O | Not a workspace primitive. |
| Terminal, code editor | Developer tooling (v0.5). |
| Plugin system | Requires stable APIs (v0.6). |
| Cloud sync | Local-first priority. |
| AI-powered workspace features | v0.4 concern. Workspace data must exist before AI can operate on it. |
| Real filesystem access | Virtual FS only. Real FS has browser compatibility and security concerns. |

### Success Criteria

- [ ] User can create a project, add files, write notes, and manage tasks.
- [ ] All workspace data persists across browser sessions.
- [ ] v0.2 chat works without regression.
- [ ] All workspace features work fully offline.
- [ ] No workspace module imports any AI provider SDK.
- [ ] Provider abstraction validated by implementing a second adapter as a spike.
- [ ] Theme engine applies to all new components.
- [ ] Storage operations complete in under 100ms perceived latency.

### Architectural Decisions

| Decision | Rationale |
|---|---|
| Notes are files (`.md`/`.txt`), not a separate data model | Unified data model. Code editor (v0.5) can open notes natively. |
| Tasks are structured data, not files | Tasks need querying (filter, sort, aggregate). |
| Project is the top-level container | Mirrors developer mental models. No concept above "project" in v0.3.0. |
| IndexedDB with abstraction layer | Async, queryable, swappable. Raw `localStorage` insufficient. |
| Schema versioning from day one | Prevents data migration nightmares in v0.4+. |

---

## v0.4 — Local Intelligence

### Goal

Bring AI capabilities into the workspace itself — not just as a chat panel, but as intelligence embedded in workspace operations.

### Major Features

- **AI-powered file search:** Semantic search across files and notes within a project.
- **Smart workspace summaries:** AI-generated project summaries based on files, notes, and tasks.
- **Local model support:** On-device AI models integrated through the provider abstraction (from v0.3.0).
- **Offline AI features:** Capabilities that work without an internet connection, using local models.
- **AI memory:** Extending workspace memory with AI-generated context (conversation summaries, inferred project metadata).
- **Provider UI:** Settings panel for selecting AI provider, entering API keys, and managing model preferences.

### Purpose

This is the version where "AI" in "AI OS" starts earning its name beyond chat. AI becomes contextually useful — it knows about the user's files, understands their notes, and can search semantically rather than by keyword.

### Why It Exists

v0.3.0 built the workspace data. v0.4 makes AI aware of that data. This sequence is intentional: intelligence is only valuable when it has context. An AI that can search your files is useful. An AI that has no files to search is useless.

### Dependencies

- v0.3.0 (Workspace Foundation): Structured data layer, virtual file system, provider abstraction.
- v0.2 (AI Core): Chat infrastructure, AI service patterns.

### Success Criteria

- [ ] User can search files/notes semantically (not just keyword match).
- [ ] At least one local model runs through the provider abstraction.
- [ ] AI features degrade to non-AI alternatives when offline and no local model is available.
- [ ] Provider selection is configurable via the Settings app (not just env vars).
- [ ] Workspace continues to function normally if all AI features are disabled.

---

## v0.5 — Developer Platform

### Goal

Add developer-specific tools that turn AI OS from a general workspace into a development environment.

### Major Features

- **Terminal emulator:** In-browser terminal for running commands. Scope TBD (may require backend or WASM-based approach).
- **Code editor:** Syntax-highlighted editor for source files within the virtual FS. Consider integrating Monaco (VS Code's editor) or CodeMirror.
- **File system enhancements:** File search, file preview, file type detection, syntax highlighting in file browser.
- **Developer-oriented workspace templates:** Project templates for common setups (web app, API, docs site).
- **Backend proxy (optional):** Server-side component that secures API key handling and enables filesystem access.

### Purpose

Developers are the primary users of AI OS. v0.5 gives them tools that make AI OS a viable development surface — not a replacement for VS Code, but a complement.

### Why It Exists

After v0.4, AI OS has: a workspace, AI intelligence, and local model support. What it lacks is the tools developers actually use: a terminal and a code editor. v0.5 fills this gap. It also potentially introduces the first backend component, which is required for secure API key handling and real filesystem access.

### Dependencies

- v0.3.0 (Workspace Foundation): Virtual file system, panel system, project model.
- v0.4 (Local Intelligence): AI-powered code assistance benefits from local models.

### Key Decision: Backend Introduction

v0.5 is the natural point to introduce an optional backend:

- **Terminal emulation** likely requires a server process (or WASM sandbox).
- **Real filesystem access** is more reliable via a local server than via the browser File System Access API.
- **API key security** is fully solved only with a server-side proxy.

This decision needs validation during v0.4 development. If a WASM-based approach is viable, the backend may shift to v0.6.

### Success Criteria

- [ ] User can write and edit code files within AI OS.
- [ ] User can execute at least basic terminal commands.
- [ ] AI can provide code assistance (autocomplete, explain, refactor) using the provider abstraction.
- [ ] API keys are no longer exposed client-side (if backend ships).

---

## v0.6 — Plugin Ecosystem

### Goal

Open AI OS to third-party contributions through a stable plugin API and marketplace.

### Major Features

- **Plugin API:** Documented, versioned API for third-party extensions. Plugins can add panels, dock items, commands, and data types.
- **Plugin runtime sandbox:** Plugins execute in isolation. A misbehaving plugin cannot crash the workspace or access another plugin's data.
- **App marketplace:** Discovery and installation of community-built plugins (local or hosted).
- **Community AI provider adapters:** Third parties can implement new AI provider adapters using the provider abstraction.
- **Theme plugins:** Community-created themes beyond the built-in dark/light modes.

### Purpose

AI OS cannot build everything. The plugin ecosystem allows the community to extend the workspace for their specific needs — whether that's a Pomodoro timer, a Kanban board, or an integration with an external service.

### Why It Exists

Extensibility is earned, not assumed (Vision Lock, Section 10.4). The plugin API can only be stable after the core product has stabilized through v0.3–v0.5. Shipping a plugin API on an unstable core leads to breaking changes that damage community trust.

### Dependencies

- v0.5 (Developer Platform): Developers need tools (terminal, code editor) to build plugins.
- v0.3.0 (Workspace Foundation): Stable data layer and module boundaries define what plugins can access.

### Success Criteria

- [ ] A third-party developer can build and install a plugin that adds a new panel to AI OS.
- [ ] Plugins cannot access workspace data outside their declared permissions.
- [ ] The plugin API is versioned — breaking changes increment the major version.
- [ ] At least 3 example plugins ship to demonstrate API capabilities.

### Risk

The plugin API is the hardest thing to get right because once published, it becomes a contract with external developers. Breaking it has high cost. This is why it's v0.6 — after 5 versions of core development have stabilized the internal architecture.

---

## v0.7 — Jarvis Preview

### Goal

Introduce Jarvis — a personal AI assistant that deeply understands the workspace, anticipates user needs, and takes action with permission.

### Major Features

- **Workspace-aware AI assistant:** Jarvis can read project files, notes, tasks, and memory to provide contextual assistance.
- **Action execution:** Jarvis can perform workspace operations (create files, update tasks, search notes) with user approval.
- **Natural language workspace interaction:** "Show me all incomplete tasks across projects" or "Create a note summarizing today's work."
- **Proactive suggestions:** Jarvis may suggest actions based on workspace activity (e.g., "You have 3 overdue tasks in Project X"). These are suggestions, never auto-applied.
- **Multi-provider support:** Jarvis works with any provider configured through the abstraction layer.

### Purpose

This is the version that fulfills the "AI" promise in "AI OS." Jarvis is not a chatbot — it's an assistant that lives inside the workspace and understands the user's digital life within AI OS.

### Why Jarvis Starts at v0.7 — Not Earlier

This is a deliberate architectural decision, not a scheduling compromise. Jarvis has structural dependencies on nearly every previous version:

| Dependency | What Jarvis Needs | Which Version Provides It |
|---|---|---|
| Workspace data | Files, notes, tasks to read and understand | v0.3.0 |
| AI intelligence layer | Contextual AI that can reason about data | v0.4 |
| Developer tools | Terminal access for action execution | v0.5 |
| Plugin architecture | Extensible action system for third-party capabilities | v0.6 |

Building Jarvis before these exist leads to one of two outcomes:
1. **A fake Jarvis:** An AI chatbot relabeled as "assistant" with no real workspace integration. Impressive in a demo, useless in practice.
2. **A tightly-coupled Jarvis:** An assistant built directly on immature internals, creating dependencies that prevent the core from evolving. Every change to the file system or task model breaks Jarvis.

Neither outcome is acceptable. Jarvis starts at v0.7 because that's when the platform is mature enough to support a real assistant — not a toy.

### Dependencies

- v0.6 (Plugin Ecosystem): Jarvis actions benefit from the plugin action system.
- v0.4 (Local Intelligence): Contextual AI capabilities, local model support.
- v0.3.0 (Workspace Foundation): All workspace data Jarvis needs to be useful.

### Success Criteria

- [ ] Jarvis can answer questions about workspace content ("What files did I modify today?").
- [ ] Jarvis can execute workspace actions with explicit user approval.
- [ ] Jarvis works with at least 2 different AI providers (including local models if available).
- [ ] Users can disable Jarvis entirely — the workspace continues to function normally.
- [ ] No Jarvis-specific code exists in core workspace modules (Principle 5: Modular Architecture).

### Naming Note

"Jarvis" is the internal codename. The shipped feature name may differ. The name should not reference external IP.

---

## v1.0 — AI Operating Environment

### Goal

Production-grade release. AI OS is stable, performant, accessible, and ready for general use.

### Major Features

- **Performance optimization:** Bundle size reduction, lazy loading, render optimization. Target: sub-2-second initial load.
- **Accessibility audit:** WCAG 2.1 AA compliance. Screen reader support, keyboard navigation, high-contrast mode.
- **PWA support:** Install as a desktop app. Offline-first with service worker caching.
- **Stable public API:** Versioned APIs for plugins and integrations. Backward compatibility commitment.
- **End-to-end encryption:** Optional encryption for workspace data at rest and AI communications in transit.
- **Onboarding experience:** Guided first-run experience for non-technical users.
- **Documentation site:** User-facing documentation, developer docs for plugin API, contribution guide.
- **Error recovery:** Automated backup and restore for workspace data. Crash recovery without data loss.

### Purpose

v1.0 is the transition from "developer tool" to "product." Everything before v1.0 is built primarily for the development team and early adopters. v1.0 is built for users who don't know (or care) what IndexedDB is.

### Why It Exists

Shipping a v0.7 and calling it done would leave AI OS as a technically impressive project that non-technical users can't use. v1.0 is the polish pass: performance, accessibility, reliability, and documentation that transforms a project into a product.

### Dependencies

- All previous versions. v1.0 is the stabilization and polish of everything built in v0.1–v0.7.

### Success Criteria

- [ ] AI OS loads in under 2 seconds on a mid-range device.
- [ ] WCAG 2.1 AA compliance for all core workspace features.
- [ ] PWA installable on Chrome, Edge, Firefox, and Safari.
- [ ] Plugin API is documented and versioned with a stability commitment.
- [ ] Data recovery from backup works after simulated data corruption.
- [ ] A non-technical user can complete the onboarding and create a project within 3 minutes.

---

## Rejected Scope (Will Not Build)

These features have been considered and deliberately excluded from the roadmap through v1.0.

| Feature | Reason for Rejection |
|---|---|
| **Native desktop app (Electron/Tauri)** | Adds build complexity, platform-specific bugs, and distribution overhead. The browser-based approach is sufficient through v1.0. Reconsider post-v1.0 if user demand justifies it. |
| **Mobile-first design** | AI OS is desktop-first by design (Vision Lock, Section 3). Mobile is a responsive improvement, not a primary target. |
| **Real-time collaboration** | Multiplayer introduces conflict resolution, presence indicators, and infrastructure. This is a post-v1.0 concern requiring its own design phase. |
| **Custom AI model training** | AI OS uses pre-trained models. Fine-tuning or training is outside the product's scope. |
| **Blockchain / decentralized storage** | No justified use case. Adding complexity without solving a real user problem. |
| **Proprietary cloud lock-in** | All data remains user-owned and locally stored. Cloud sync (if added) must use open formats and allow export. |

---

## Roadmap Summary

| Version | Name | Key Deliverable | Status |
|---|---|---|---|
| v0.1 | UI Foundation | Desktop metaphor, design language | ✅ Shipped |
| v0.2 | AI Core | Conversational AI, chat experience | ✅ Shipped |
| **v0.3** | **Workspace Foundation** | **Projects, files, notes, tasks, persistence, provider abstraction** | **🔄 Planning** |
| v0.4 | Local Intelligence | Contextual AI, local models, semantic search | ⏳ Planned |
| v0.5 | Developer Platform | Terminal, code editor, backend (optional) | ⏳ Planned |
| v0.6 | Plugin Ecosystem | Plugin API, marketplace, community extensions | ⏳ Planned |
| v0.7 | Jarvis Preview | Personal AI assistant with workspace awareness | ⏳ Planned |
| v1.0 | AI Operating Environment | Production release: performance, accessibility, stability | ⏳ Planned |

---

*Each version builds on the previous one. Skipping versions is not permitted — each layer depends on the one below it. This roadmap is the authoritative version, superseding any prior roadmap in the [README.md](file:///c:/Users/ritik/jarvis/AI%20OS/README.md).*
