/**
 * AI OS — Dock (Sprint 1D)
 *
 * Application launcher bar at the bottom of the shell.
 * Reads app list from the registry, but opens/focuses windows
 * through the windowManager.
 *
 * Click behavior:
 * - If app is not open → windowManager.open(appId)
 * - If app is singleton and already open → windowManager focuses existing
 *   (handled internally by windowManager.open)
 *
 * Active indicator reads from windowStore.
 */

import { windowManager } from '@shell/windowManager';
import { useWindowStore } from '@shell/windowStore';
import { listVisibleApps } from '@core/registry/registry';
import DockIcon from './DockIcon';

export default function Dock() {
  const windows = useWindowStore((s) => s.windows);
  const apps = listVisibleApps();

  return (
    <div className="glass glass-glow rounded-2xl px-3 py-2 flex items-center gap-2">
      {apps.map((app) => (
        <DockIcon
          key={app.id}
          icon={app.icon}
          label={app.name}
          onClick={() => windowManager.open(app.id)}
          active={windows.some((w) => w.appId === app.id)}
        />
      ))}
    </div>
  );
}
