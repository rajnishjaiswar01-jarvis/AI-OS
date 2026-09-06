# AI OS

> An AI-native workspace foundation built with React, TypeScript, and Vite.

AI OS is a browser-based desktop environment designed as the foundation for an AI-powered workspace. It features a window manager, app registry, project system, AI chat, and a glass-morphism design language — all built on a layered architecture with persistent storage.

## ✨ Features

### Desktop Shell
- 🖥️ **Window Manager** — Cascading windows with z-index ordering, focus tracking, minimize/restore
- 🧩 **App Registry** — Centralized app definitions with singleton enforcement and lazy loading
- ⚓ **Dock** — App launcher with active indicators and hover tooltips
- 📊 **Sidebar** — Collapsible panel with project context, clock, and system status
- 🎨 **Theme Engine** — Dark/light modes with CSS custom properties
- 🌌 **Dynamic Wallpapers** — Space and aurora gradient backgrounds
- 🚀 **Boot Screen** — Cinematic startup animation with phase indicators

### AI Integration
- 💬 **AI Chat** — Conversational AI powered by GPT Astra (Experiential Labs) with markdown rendering
- ✦ **AI Orb** — Ambient presence indicator with state-driven animations (ready, thinking, error)
- 📝 **Markdown Rendering** — Syntax-highlighted code blocks with copy support

### Workspace
- 📁 **Project System** — Create, rename, delete projects with Dexie persistence
- ⚙️ **Settings** — Theme, wallpaper, and system configuration
- 💾 **Persistence** — IndexedDB via Dexie.js with repository abstraction

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI** | React 19 + TypeScript |
| **Build** | Vite 8 |
| **State** | Zustand 5 |
| **Persistence** | Dexie.js (IndexedDB) |
| **AI** | Experiential Labs (GPT Astra) |
| **Styling** | Tailwind CSS 4 + CSS custom properties |
| **Testing** | Vitest + fake-indexeddb |
| **Linting** | oxlint |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Type checking
npm run typecheck

# Build for production
npm run build
```

## 📦 Architecture

```
src/
├── ai/                    # AI layer
│   ├── chat/              # Chat UI, service, and store
│   ├── config.ts          # AI configuration
│   └── providers/         # Provider registry and types
├── core/                  # Core infrastructure
│   ├── config/            # App-wide configuration
│   ├── db/                # Dexie database, types, repositories
│   ├── errors/            # Error handling
│   ├── hooks/             # Shared React hooks
│   ├── registry/          # App registry and boot-time registration
│   ├── types/             # Shared TypeScript types
│   └── utils/             # Utility functions
├── features/              # Feature modules
│   ├── files/             # File manager (Sprint 2)
│   ├── memory/            # Memory system (Sprint 2)
│   ├── notes/             # Notes app (Sprint 2)
│   ├── projects/          # Project CRUD + persistence
│   ├── settings/          # Settings panel + store
│   └── tasks/             # Task manager (Sprint 2)
├── shell/                 # Desktop shell
│   ├── components/        # Desktop, Window, Dock, TopBar, Sidebar, AiOrb
│   ├── shellStore.ts      # Boot lifecycle store
│   ├── windowManager.ts   # Window orchestration layer
│   ├── windowStore.ts     # Window state (Zustand)
│   └── windowTypes.ts     # Window data model
├── ui/                    # Reusable UI primitives
├── index.css              # Design tokens and layout system
└── main.tsx               # Entry point
```

### Layered Architecture

```
UI Components
    ↓
Window Manager (orchestration)
    ↓
Window Store (state)        App Registry (definitions)
    ↓
Repository Layer
    ↓
Dexie (IndexedDB)
```

**Key invariants:**
- Desktop is a pure renderer — never imports the app registry
- Components never mutate stores directly — always through service/manager layers
- Window Manager is the only orchestration layer between UI and Window Store
- See [WINDOW_MANAGER_INVARIANTS.md](docs/WINDOW_MANAGER_INVARIANTS.md) for the full list

## 🧪 Testing

87 tests across 4 test suites:

| Suite | Coverage |
|-------|----------|
| Window Manager | Lifecycle, singleton, focus, z-index, cascade, stress, edge cases |
| Window Store Selectors | Visible windows, app queries |
| Project Service | CRUD, persistence, hydration, cleanup |
| Database | Tables, CRUD, settings, memory |

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Interactive UI
```

## 🗺️ Roadmap

### v0.1 — UI Foundation ✅
Glass-morphism desktop, dock, top bar, theme engine, boot screen, wallpapers

### v0.2 — AI Core ✅
AI integration (GPT Astra via Experiential Labs), markdown rendering, AI Orb, error handling, token tracking

### v0.3 — Workspace Foundation 🔄
- **Sprint 0:** Dexie persistence, project CRUD ✅
- **Sprint 1A–1D:** Window Manager, app registry, shell layout ✅
- **Sprint 1E:** Stabilization — stress tests, edge cases, accessibility ✅
- **Sprint 2:** Notes, Files, Tasks, Memory ← *next*

### v0.4 — Local Intelligence
Context-aware AI, workspace-integrated suggestions

### v0.5 — Developer Platform
Plugin system, extensible app framework

### v1.0 — AI Operating Environment
Full workspace with persistent AI memory, multi-agent workflows

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [VISION_LOCK.md](docs/VISION_LOCK.md) | Product vision and constraints |
| [PRODUCT_SPECIFICATION.md](docs/PRODUCT_SPECIFICATION.md) | v0.3 feature specification |
| [ENGINEERING_DECISIONS.md](docs/ENGINEERING_DECISIONS.md) | Technical decisions and rationale |
| [ARCHITECTURE_REVIEW.md](docs/ARCHITECTURE_REVIEW.md) | Architecture review findings |
| [WINDOW_MANAGER_INVARIANTS.md](docs/WINDOW_MANAGER_INVARIANTS.md) | Window system rules |
| [VERSION_ROADMAP.md](docs/VERSION_ROADMAP.md) | Full version plan |
| [DEVELOPMENT_STANDARDS.md](docs/DEVELOPMENT_STANDARDS.md) | Code standards and patterns |

## 📄 License

MIT © AI OS Contributors
