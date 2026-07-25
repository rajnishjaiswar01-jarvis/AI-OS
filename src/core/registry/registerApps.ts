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

const Chat = lazy(() => import('@ai/chat/components/Chat'));
const SettingsPanel = lazy(() => import('@features/settings/components/SettingsPanel'));

// ─── Registration ────────────────────────────────────────────────────

export function registerBuiltinApps(): void {
  registerApp({
    id: 'chat',
    name: 'Chat',
    icon: '💬',
    component: Chat,
  });

  registerApp({
    id: 'settings',
    name: 'Settings',
    icon: '⚙️',
    component: SettingsPanel,
  });

  // Future apps will be registered here:
  // registerApp({ id: 'memory', name: 'Memory', icon: '🧠', component: Memory, experimental: true });
}
