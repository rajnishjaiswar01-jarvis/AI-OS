/**
 * AI OS — Shell Store
 *
 * Manages desktop shell state: boot status.
 * Window management has been migrated to windowStore (Sprint 1D).
 *
 * The shell store now only tracks boot status.
 * All window lifecycle (open, close, focus, minimize, restore)
 * is handled by windowStore + windowManager.
 */

import { create } from 'zustand';

interface ShellState {
  // Boot
  booted: boolean;
  setBooted: () => void;
}

export const useShellStore = create<ShellState>(() => ({
  // Boot
  booted: false,
  setBooted: () => useShellStore.setState({ booted: true }),
}));
