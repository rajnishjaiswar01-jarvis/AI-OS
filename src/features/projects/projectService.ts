/**
 * AI OS — Project Service
 *
 * Business logic, validation, and orchestration for projects.
 * This is the "brain" of the projects feature.
 *
 * Flow: Component → projectService → projectRepository → Dexie
 *                                   → projectStore (on success)
 *
 * Rule: Persist first, then update store.
 *       If persistence fails, store state is unchanged.
 *
 * @see SYSTEM_ARCHITECTURE.md §2.3 — Service Layer
 * @see STATE_ARCHITECTURE.md §5 — Persistence Sync Pattern
 */

import { projectRepository } from './projectRepository';
import { useProjectStore } from './projectStore';
import { DomainError } from '@core/errors/DomainError';
import type { Project } from '@core/db/types';

// ─── Project Service ─────────────────────────────────────────────────

export const projectService = {
  /**
   * Load all projects from the database into the store.
   * Called during boot to hydrate project state.
   */
  async loadProjects(): Promise<void> {
    const projects = await projectRepository.findAll();
    useProjectStore.getState().setProjects(projects);
  },

  /**
   * Create a new project.
   *
   * 1. Validate name
   * 2. Generate UUID
   * 3. Persist to Dexie
   * 4. Update store
   * 5. Set as active project
   */
  async createProject(name: string): Promise<Project> {
    // Validate
    const trimmed = name.trim();
    if (!trimmed) {
      throw new DomainError('VALIDATION_ERROR', 'Project name cannot be empty.');
    }

    if (trimmed.length > 100) {
      throw new DomainError('VALIDATION_ERROR', 'Project name must be 100 characters or less.');
    }

    // Build entity
    const now = new Date().toISOString();
    const project: Project = {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: now,
      updatedAt: now,
    };

    // Persist first
    await projectRepository.save(project);

    // Then update store
    const store = useProjectStore.getState();
    store.addProject(project);
    store.setActiveProject(project.id);

    return project;
  },

  /**
   * Rename an existing project.
   *
   * 1. Validate name
   * 2. Verify project exists
   * 3. Persist updated record
   * 4. Update store
   */
  async renameProject(id: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new DomainError('VALIDATION_ERROR', 'Project name cannot be empty.');
    }

    if (trimmed.length > 100) {
      throw new DomainError('VALIDATION_ERROR', 'Project name must be 100 characters or less.');
    }

    const existing = await projectRepository.findById(id);
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Project not found.');
    }

    // Don't update if name hasn't changed
    if (existing.name === trimmed) return;

    const updatedAt = new Date().toISOString();
    const updated: Project = { ...existing, name: trimmed, updatedAt };

    // Persist first
    await projectRepository.save(updated);

    // Then update store
    useProjectStore.getState().updateProject(id, { name: trimmed, updatedAt });
  },

  /**
   * Delete a project.
   *
   * 1. Persist deletion
   * 2. Remove from store
   * 3. If deleted project was active, clear active
   *
   * Note: In Sprint 2+, this will also cascade-delete files and tasks.
   */
  async deleteProject(id: string): Promise<void> {
    // Persist first
    await projectRepository.remove(id);

    // Then update store (removeProject handles active project clearing)
    useProjectStore.getState().removeProject(id);
  },

  /**
   * Set the active project.
   * Called when user clicks a project in the list.
   */
  setActiveProject(id: string | null): void {
    useProjectStore.getState().setActiveProject(id);
  },

  /**
   * Get the currently active project.
   * Reads directly from store state.
   */
  getActiveProject(): Project | null {
    const { projects, activeProjectId } = useProjectStore.getState();
    if (!activeProjectId) return null;
    return projects.find((p) => p.id === activeProjectId) ?? null;
  },
};
