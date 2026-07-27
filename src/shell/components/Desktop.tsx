/**
 * AI OS — Desktop (Sprint 1D)
 *
 * Root shell layout using CSS Grid with four zones:
 *   TopBar  → shell-topbar
 *   Sidebar → shell-sidebar (contains project name, clock, system status)
 *   Canvas  → desktop-canvas (windows render here)
 *   Dock    → shell-dock
 *
 * The Desktop is a pure renderer. It reads window state from windowStore
 * and delegates app resolution to the Window component (which uses windowManager).
 * Desktop never imports the app registry directly.
 */

import { Suspense, useMemo } from 'react';
import { useWindowStore } from '@shell/windowStore';
import { WindowState } from '@shell/windowTypes';
import { useSettingsStore } from '@features/settings/settingsStore';
import TopBar from './TopBar';
import Dock from './Dock';
import Sidebar from './Sidebar';
import AiOrb from './AiOrb';
import Window from './Window';

export default function Desktop() {
  const wallpaper = useSettingsStore((s) => s.wallpaper);
  const windows = useWindowStore((s) => s.windows);

  // Derive visible windows from raw state (avoids new-reference infinite loop)
  const visibleWindows = useMemo(
    () =>
      windows
        .filter((w) => w.state !== WindowState.Minimized)
        .sort((a, b) => a.zIndex - b.zIndex),
    [windows]
  );

  return (
    <div
      className={`
        shell-layout
        wallpaper-${wallpaper}
        transition-all duration-500
        animate-fade-in
      `}
    >
      {/* Animated aurora overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(79, 140, 255, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 60%, rgba(139, 92, 246, 0.1) 0%, transparent 60%)
          `,
          animation: 'auroraShift 15s ease-in-out infinite',
          backgroundSize: '200% 200%',
          zIndex: 0,
        }}
      />

      {/* ─── TopBar Zone ──────────────────────────────────────────── */}
      <div className="shell-topbar">
        <TopBar />
      </div>

      {/* ─── Sidebar Zone ─────────────────────────────────────────── */}
      <Sidebar />

      {/* ─── Desktop Canvas (Window Rendering Area) ───────────────── */}
      <div className="desktop-canvas">
        {/* AI Orb — floats on the canvas */}
        <AiOrb />

        {/* Windows — rendered from windowStore */}
        <Suspense fallback={null}>
          {visibleWindows.map((win) => (
            <Window key={win.id} window={win} />
          ))}
        </Suspense>
      </div>

      {/* ─── Dock Zone ────────────────────────────────────────────── */}
      <div className="shell-dock">
        <Dock />
      </div>
    </div>
  );
}
