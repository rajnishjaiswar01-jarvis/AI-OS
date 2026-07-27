/**
 * AI OS — Window Component
 *
 * Renders a single window instance on the desktop canvas.
 * Handles window chrome (title bar, controls) and delegates
 * app content resolution to the windowManager.
 *
 * The Window component:
 * - Positions itself absolutely within the desktop-canvas
 * - Renders the app component from the registry (via windowManager)
 * - Handles focus, minimize, and close through windowManager
 * - Shows open/close animations
 *
 * Sprint 1D scope: No drag, no resize, no maximize.
 *
 * @see Sprint 1D — Window Manager
 */

import { useEffect, useState, Suspense, type ComponentType } from 'react';
import { windowManager } from '@shell/windowManager';
import type { WindowInstance } from '@shell/windowTypes';

// ─── Props ───────────────────────────────────────────────────────────

interface WindowProps {
  window: WindowInstance;
}

// ─── Component ───────────────────────────────────────────────────────

export default function Window({ window: win }: WindowProps) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  // Resolve the app component via windowManager (keeps registry behind the manager)
  const AppComponent = windowManager.getAppComponent(win.appId) as ComponentType | null;
  const appIcon = windowManager.getAppIcon(win.appId);

  // Entry animation
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => windowManager.close(win.id), 200);
  };

  const handleMinimize = () => {
    setClosing(true);
    setTimeout(() => windowManager.minimize(win.id), 200);
  };

  const handleFocus = () => {
    windowManager.focus(win.id);
  };

  if (!AppComponent) return null;

  return (
    <div
      className={`
        window glass glass-glow
        ${mounted && !closing ? 'animate-slide-up' : ''}
        ${closing ? 'animate-slide-down' : ''}
      `}
      style={{
        left: win.position.x,
        top: win.position.y,
        width: win.size.width,
        height: win.size.height,
        zIndex: win.zIndex,
        maxWidth: 'calc(100% - 32px)',
        maxHeight: 'calc(100% - 32px)',
      }}
      onMouseDown={handleFocus}
    >
      {/* ─── Title Bar ──────────────────────────────────────────── */}
      <div className="window-titlebar">
        <div className="flex items-center gap-2 min-w-0">
          {appIcon && <span className="text-sm flex-shrink-0">{appIcon}</span>}
          <span className="text-sm font-medium text-[var(--color-text-secondary)] truncate">
            {win.title}
          </span>
        </div>

        <div className="window-controls">
          {/* Minimize */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMinimize();
            }}
            className="
              w-6 h-6 rounded-full flex items-center justify-center
              hover:bg-yellow-500/20 text-[var(--color-text-muted)] hover:text-yellow-400
              transition-all duration-200 cursor-pointer text-xs
            "
            title="Minimize"
          >
            ─
          </button>

          {/* Close */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="
              w-6 h-6 rounded-full flex items-center justify-center
              hover:bg-red-500/20 text-[var(--color-text-muted)] hover:text-red-400
              transition-all duration-200 cursor-pointer
            "
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ─── App Content ────────────────────────────────────────── */}
      <div className="window-content">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-sm">
              Loading…
            </div>
          }
        >
          <AppComponent />
        </Suspense>
      </div>
    </div>
  );
}
