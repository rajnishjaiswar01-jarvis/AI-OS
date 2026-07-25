/**
 * AI OS — Desktop (Sprint 1A)
 *
 * Root shell layout using CSS Grid with four zones:
 *   TopBar  → shell-topbar
 *   Sidebar → shell-sidebar (contains project name, clock, system status)
 *   Canvas  → desktop-canvas (windows render here)
 *   Dock    → shell-dock
 *
 * This replaces the v0.2 flat layout where widgets were absolute-positioned.
 */

import { Suspense } from 'react';
import { useShellStore } from '@shell/shellStore';
import { useSettingsStore } from '@features/settings/settingsStore';
import { getApp } from '@core/registry/registry';
import TopBar from './TopBar';
import Dock from './Dock';
import Sidebar from './Sidebar';
import AiOrb from './AiOrb';

export default function Desktop() {
  const wallpaper = useSettingsStore((s) => s.wallpaper);
  const openApps = useShellStore((s) => s.openApps);

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

        {/* Open App Panels — dynamically rendered from registry */}
        {/* Sprint 1D will replace this with <WindowCanvas /> */}
        <Suspense fallback={null}>
          {openApps.map((appId) => {
            const app = getApp(appId);
            if (!app) return null;
            const AppComponent = app.component;
            return <AppComponent key={appId} />;
          })}
        </Suspense>
      </div>

      {/* ─── Dock Zone ────────────────────────────────────────────── */}
      <div className="shell-dock">
        <Dock />
      </div>
    </div>
  );
}

