/**
 * AI OS — Sidebar (Sprint 1A)
 *
 * Left-side shell panel containing:
 * - Active project name (or "No Project")
 * - Clock widget (relocated from desktop overlay)
 * - SystemStatus widget (relocated from desktop overlay)
 *
 * Recommendation 5: ONLY these three items. No additional widgets.
 * Collapsible with smooth animation.
 */

import { useState } from 'react';
import Clock from './Clock';
import SystemStatus from './SystemStatus';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  // Sprint 1B will wire this to projectStore.
  // For now, show "No Project" as the neutral state.
  const activeProjectName: string | null = null;

  return (
    <div className={`shell-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Collapse/Expand Toggle — positioned as first child for accessibility */}
      <button
        className="glass glass-hover rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          width: '100%',
          height: '28px',
          fontSize: '11px',
          color: 'var(--color-text-muted)',
          flexShrink: 0,
        }}
      >
        {collapsed ? '▶' : '◀ Collapse'}
      </button>

      {!collapsed && (
        <>
          {/* Active Project Section */}
          <div className="glass glass-glow rounded-lg sidebar-section">
            <div className="sidebar-project-label">Project</div>
            <div className="sidebar-project-name">
              {activeProjectName || 'No Project'}
            </div>
          </div>

          {/* Clock Widget */}
          <Clock />

          {/* System Status Widget */}
          <SystemStatus />
        </>
      )}
    </div>
  );
}

