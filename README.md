# AI OS

> A next-generation, AI-powered operating system interface built with React, TypeScript, and Vite.

AI OS reimagines the desktop experience with a futuristic, glass-morphism UI driven by artificial intelligence. It features a fully interactive desktop environment with a dock, top bar, windowed apps, themes, wallpapers, and an AI assistant — all running in the browser.

## ✨ Features

- 🖥️ **Desktop Environment** — Draggable, resizable windowed panels
- 🎨 **Theme Engine** — Dark / Light mode with smooth transitions
- 🌌 **Dynamic Wallpapers** — Space and Aurora gradient backgrounds
- 💬 **AI Chat** — Conversational interface (AI backend coming in v0.2.0)
- ✦ **AI Orb** — Ambient, interactive AI presence indicator
- ⚙️ **Settings Panel** — Theme toggle, wallpaper picker, system info
- 🕐 **Clock Widget** — Real-time clock on the desktop
- 🚀 **Boot Screen** — Cinematic startup animation

## 🛠️ Tech Stack

- **React 19** + **TypeScript**
- **Vite** — Lightning-fast dev server and build tool
- **Zustand** — Lightweight state management
- **CSS Variables** — Theming with custom properties
- **Tailwind CSS** — Utility-first styling

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📦 Project Structure

```
src/
├── apps/              # Windowed applications
│   ├── Chat/          # AI Chat interface
│   └── Settings/      # System settings panel
├── components/        # Shared UI components
│   ├── AiOrb.tsx      # AI presence orb
│   ├── BootScreen.tsx # Startup animation
│   ├── ClockWidget.tsx
│   ├── Desktop.tsx    # Main desktop layout
│   ├── Dock.tsx       # macOS-style dock
│   ├── Panel.tsx      # Draggable window panel
│   ├── TopBar.tsx     # System top bar
│   └── ...
├── stores/            # Zustand state stores
├── types/             # TypeScript type definitions
├── index.css          # Global styles & design tokens
└── main.tsx           # App entry point
```

## 🗺️ Roadmap

### Version 0.1.0 — Desktop Foundation ✅
- Glass-morphism desktop environment
- Dock, top bar, and windowed panel system
- Theme engine (dark/light) with wallpaper selection
- Boot screen animation
- Clock widget and system status indicators

### Version 0.2.0 — AI Integration
- Connect AI assistant backend (LLM API)
- Real-time AI chat with streaming responses
- AI Orb activation with context-aware interactions
- Smart command palette

### Version 0.3.0 — Voice Assistant & Voice Prompt Engine
- Voice input/output for AI interactions
- Wake-word detection
- Voice-driven command execution
- Text-to-speech responses

### Version 0.4.0 — App Ecosystem
- File manager with virtual filesystem
- Terminal emulator
- Notes and code editor apps
- App marketplace / plugin system

### Version 0.5.0 — Multi-Agent Workflows
- Multiple AI agents with specialized roles
- Agent-to-agent communication
- Task delegation and parallel execution
- Workflow automation builder

### Version 1.0.0 — Production Release
- Performance optimization and accessibility
- PWA support with offline capabilities
- End-to-end encryption for AI interactions
- Public API and developer SDK

## 📄 License

MIT © AI OS Contributors
