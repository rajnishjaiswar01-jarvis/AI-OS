/**
 * AI OS — App Registration (Boot-time)
 *
 * Registers all built-in apps at application startup.
 * Called once from main.tsx before React renders.
 *
 * Future apps (Notes, Tasks, Files, Memory) will be registered here
 * as they are implemented in subsequent sprints.
 */

import { lazy } from 'react';
import { registerApp } from './registry';

// ─── Lazy-loaded App Components ──────────────────────────────────────

const ProjectsPanel = lazy(() => import('@features/projects/components/ProjectsPanel'));
const Chat = lazy(() => import('@ai/chat/components/Chat'));
const SettingsPanel = lazy(() => import('@features/settings/components/SettingsPanel'));
const NotesPanel = lazy(() => import('@features/notes/components/NotesPanel'));
const TasksPanel = lazy(() => import('@features/tasks/components/TasksPanel'));
const FilesPanel = lazy(() => import('@features/files/components/FilesPanel'));

// ─── Registration ────────────────────────────────────────────────────

export function registerBuiltinApps(): void {
  registerApp({
    id: 'projects',
    name: 'Projects',
    icon: '📁',
    component: ProjectsPanel,
    singleton: true,
    defaultSize: { width: 420, height: 520 },
  });

  registerApp({
    id: 'chat',
    name: 'Chat',
    icon: '💬',
    component: Chat,
    singleton: true,
    defaultSize: { width: 480, height: 600 },
  });

  registerApp({
    id: 'notes',
    name: 'Notes',
    icon: '📝',
    component: NotesPanel,
    singleton: true,
    defaultSize: { width: 680, height: 520 },
  });

  registerApp({
    id: 'tasks',
    name: 'Tasks',
    icon: '✅',
    component: TasksPanel,
    singleton: true,
    defaultSize: { width: 680, height: 520 },
  });

  registerApp({
    id: 'files',
    name: 'Files',
    icon: '📂',
    component: FilesPanel,
    singleton: true,
    defaultSize: { width: 720, height: 560 },
  });

  registerApp({
    id: 'settings',
    name: 'Settings',
    icon: '⚙️',
    component: SettingsPanel,
    singleton: true,
    defaultSize: { width: 480, height: 560 },
  });

  // Future apps will be registered here:
  // registerApp({ id: 'memory', name: 'Memory', icon: '🧠', component: Memory, experimental: true });
}
