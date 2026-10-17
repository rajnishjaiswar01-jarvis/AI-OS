# AI OS v0.3.0 — Workspaces & Gemini AI

## Added
- Desktop foundation: boot screen, top bar, dock, sidebar, window manager
- Window management: open, close, minimize, restore, focus, cascade positioning
- Singleton window enforcement for built-in apps
- Projects workspace: create, rename, delete, active project persistence
- Notes workspace: create, rename, edit, soft-delete, autosave state tracking
- Tasks workspace: create, edit, set status, soft-delete, status filtering
- Files workspace: create files and folders, rename, edit content, soft-delete
- Single-level folder hierarchy with cascade folder deletion
- File name uniqueness enforcement (case-insensitive, scope-aware)
- Gemini AI chat through server-side API proxy
- Server-side API key protection (key never reaches the browser)
- Chat Markdown rendering with syntax-highlighted code blocks
- Copy code button in code blocks
- Request cancellation (stop generation)
- Retry and regenerate responses
- Token usage tracking (per-message and session)
- Smart auto-scroll (respects user scroll position)
- Full error handling with typed error codes and retryable flags
- Project deletion cascade: notes, tasks, and files atomically removed
- Dark and light theme support
- Settings panel

## Technical
- React 19
- TypeScript (strict)
- Zustand (state management)
- Dexie (IndexedDB persistence)
- Gemini API (server-side proxy via OpenAI-compatible endpoint)
- Vite (build tooling)
- Vitest (268 tests)
- Vercel (serverless deployment)
