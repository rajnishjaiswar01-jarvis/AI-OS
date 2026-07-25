/**
 * AI OS — Project Store
 *
 * Pure Zustand state container for project data.
 * NO side effects. NO Dexie access. NO API calls.
 * All mutations are called by projectService after successful persistence.
 *
 * @see SYSTEM_ARCHITECTURE.md §2.2 — Store Layer
 * @see STATE_ARCHITECTURE.md §2.1 — useProjectStore
 */

import { create } from 'zustand';
import type { Project } from '@core/db/types';

// ─── Store Interface ─────────────────────────────────────────────────

interface ProjectState {
  /** All projects loaded from DB */
  projects: Project[];
  /** Currently active project ID (null = no project selected) */
  activeProjectId: string | null;

  // Pure mutations (called by projectService, NEVER directly by components)
  setProjects: (projects: Project[]) => void;
  setActiveProject: (id: string | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
}

// ─── Store ───────────────────────────────────────────────────────────

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProjectId: null,

  setProjects: (projects: Project[]) => set({ projects }),

  setActiveProject: (id: string | null) => set({ activeProjectId: id }),

  addProject: (project: Project) =>
    set((state) => ({
      projects: [project, ...state.projects],
    })),

  updateProject: (id: string, updates: Partial<Project>) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  removeProject: (id: string) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      // If deleted project was active, clear active
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
    })),
}));
