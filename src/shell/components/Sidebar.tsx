/**
 * AI OS — Sidebar (Sprint 1A + 1B)
 *
 * Left-side shell panel containing:
 * - Active project name (wired to projectStore)
 * - Clock widget (relocated from desktop overlay)
 * - SystemStatus widget (relocated from desktop overlay)
 *
 * Recommendation 5: ONLY these three items. No additional widgets.
 * Collapsible with smooth animation.
 */

import { useState } from 'react';
import { useProjectStore } from '@features/projects/projectStore';
import Clock from './Clock';
import SystemStatus from './SystemStatus';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  // Read active project from store
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const activeProject = activeProjectId
    ? projects.find((p) => p.id === activeProjectId)
    : null;

  return (
    <div className={`shell-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Collapse/Expand Toggle */}
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
              {activeProject ? activeProject.name : 'No Project'}
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

