# AI OS — Documentation Index

> **Document Type:** Documentation Index  
> **Status:** Active  
> **Last Updated:** 2026-07-18  
> **Audience:** All contributors, reviewers, and new team members

This is the entry point for all AI OS documentation. Every specification, decision record, and architectural document is listed here with its purpose, status, and dependencies.

Start here. Read what you need. Skip what you don't.

---

## How to Navigate

1. **New to the project?** Start with [VISION_LOCK.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/VISION_LOCK.md) → [PRODUCT_SPECIFICATION.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/PRODUCT_SPECIFICATION.md) → [PRODUCT_PRINCIPLES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/PRODUCT_PRINCIPLES.md).
2. **Building a feature?** Read the relevant module spec in `06_MODULES/` (when available), then check [DEVELOPMENT_STANDARDS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/DEVELOPMENT_STANDARDS.md).
3. **Making an architectural decision?** Check existing [ADRs](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ADR/) and [ENGINEERING_DECISIONS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md) first.
4. **Designing UI?** Start with [UX_PRINCIPLES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/00_UX_PRINCIPLES.md), then read the relevant UX architecture doc.
5. **Tracking documentation progress?** See [DOCUMENTATION_PHASES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/DOCUMENTATION_PHASES.md).

---

## 1. Product Foundation

| Document | Purpose | Status |
|---|---|---|
| [VISION_LOCK.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/VISION_LOCK.md) | Product identity, what AI OS is and is not, scope boundaries | ✅ Active |
| [PRODUCT_SPECIFICATION.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/PRODUCT_SPECIFICATION.md) | What v0.3.0 builds — features, personas, success criteria | ✅ Active |
| [PRODUCT_PRINCIPLES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/PRODUCT_PRINCIPLES.md) | Decision framework — when two valid approaches exist, these decide | ✅ Active |
| [VERSION_ROADMAP.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/VERSION_ROADMAP.md) | Product versions v0.1–v1.0 with scope, dependencies, success criteria | ✅ Active |

---

## 2. Engineering Decisions

| Document | Purpose | Status |
|---|---|---|
| [ENGINEERING_DECISIONS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md) | Frozen technology choices — framework, DB, state, patterns | ✅ Frozen |
| [ARCHITECTURE_REVIEW.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ARCHITECTURE_REVIEW.md) | Phase 1 review findings and resolutions | ✅ Closed |

---

## 3. Technical Foundation

| Document | Purpose | Status | Depends On |
|---|---|---|---|
| [SYSTEM_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/SYSTEM_ARCHITECTURE.md) | Four-zone architecture, layer boundaries, module rules | ✅ Active | VISION_LOCK, ENGINEERING_DECISIONS |
| [DATABASE_DESIGN.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/DATABASE_DESIGN.md) | Dexie schema, tables, indexes, migration strategy | ✅ Active | ENGINEERING_DECISIONS |
| [STATE_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/STATE_ARCHITECTURE.md) | Zustand stores, state shape, hydration, selectors | ✅ Active | ENGINEERING_DECISIONS, SYSTEM_ARCHITECTURE |
| [SERVICE_REPOSITORY_LAYER.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/SERVICE_REPOSITORY_LAYER.md) | Service and repository patterns, data access rules | ✅ Active | SYSTEM_ARCHITECTURE, DATABASE_DESIGN |
| [INTERFACE_CONTRACTS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/INTERFACE_CONTRACTS.md) | TypeScript interfaces for all domain models | ✅ Active | DATABASE_DESIGN |
| [FOLDER_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/FOLDER_ARCHITECTURE.md) | Project folder structure, file placement rules | ✅ Active | SYSTEM_ARCHITECTURE |
| [AI_LAYER_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/AI_LAYER_ARCHITECTURE.md) | Provider abstraction, adapter pattern, AI layer isolation | ✅ Active | SYSTEM_ARCHITECTURE, ENGINEERING_DECISIONS |

---

## 4. ADRs & Development Standards

| Document | Purpose | Status |
|---|---|---|
| [DEVELOPMENT_STANDARDS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/DEVELOPMENT_STANDARDS.md) | Naming conventions, import rules, code patterns | ✅ Active |
| [ADR-001: Use Dexie](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ADR/ADR-001-Use-Dexie.md) | IndexedDB via Dexie.js | ✅ Accepted |
| [ADR-002: Repository Pattern](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ADR/ADR-002-Repository-Pattern.md) | Data access abstraction | ✅ Accepted |
| [ADR-003: Provider Abstraction](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ADR/ADR-003-Provider-Abstraction.md) | AI provider-agnostic interface | ✅ Accepted |
| [ADR-004: Blob Storage](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ADR/ADR-004-Blob-Storage.md) | File content as Blobs | ✅ Accepted |
| [ADR-005: Zustand](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ADR/ADR-005-Zustand.md) | Client-side state management | ✅ Accepted |
| [ADR-006: UUID v4](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ADR/ADR-006-UUID-v4.md) | ID generation strategy | ✅ Accepted |
| [ADR-007: Feature-Based Folders](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ADR/ADR-007-Feature-Based-Folders.md) | Project structure organization | ✅ Accepted |
| [ADR-008: Error Boundaries](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ADR/ADR-008-Error-Boundaries.md) | Per-panel crash isolation | ✅ Accepted |
| [ADR-009: Single Tab](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ADR/ADR-009-Single-Tab.md) | Multi-tab prevention | ✅ Accepted |

---

## 5. Security

| Document | Purpose | Status | Depends On |
|---|---|---|---|
| [SECURITY_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase3/SECURITY_ARCHITECTURE.md) | Threat model, security rules, mitigation strategies | ✅ Active | VISION_LOCK, ENGINEERING_DECISIONS, SYSTEM_ARCHITECTURE |

---

## 6. UX Architecture

| Document | Purpose | Status | Depends On |
|---|---|---|---|
| [UX_PRINCIPLES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/00_UX_PRINCIPLES.md) | UX decision framework — guides all interaction design | ✅ Active | VISION_LOCK, PRODUCT_PRINCIPLES |
| [NAVIGATION_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/01_NAVIGATION_ARCHITECTURE.md) | How users move through AI OS | ✅ Active | UX_PRINCIPLES, SYSTEM_ARCHITECTURE |
| [LAYOUT_SYSTEM.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/02_LAYOUT_SYSTEM.md) | Spatial organization, panels, responsive behavior | ✅ Active | NAVIGATION_ARCHITECTURE, SYSTEM_ARCHITECTURE |
| [INTERACTION_MODEL.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/03_INTERACTION_MODEL.md) | Input methods, drag/drop, selection, editing, feedback | ✅ Active | NAVIGATION_ARCHITECTURE, LAYOUT_SYSTEM |
| [ACCESSIBILITY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/04_ACCESSIBILITY.md) | WCAG compliance, focus management, screen reader support | ✅ Active | INTERACTION_MODEL, LAYOUT_SYSTEM |
| [KEYBOARD_SHORTCUTS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/04_UX/05_KEYBOARD_SHORTCUTS.md) | Single source of truth for all keyboard shortcuts | ✅ Active | NAVIGATION_ARCHITECTURE, INTERACTION_MODEL |

---

## 7. Performance

| Document | Purpose | Status | Depends On |
|---|---|---|---|
| [PERFORMANCE_BUDGET.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/PERFORMANCE_BUDGET.md) | Target metrics that constrain design and implementation | ✅ Active | SYSTEM_ARCHITECTURE |

---

## 8. Visual Design System *(Phase 4B)*

| Document | Purpose | Status | Depends On |
|---|---|---|---|
| [DESIGN_PRINCIPLES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/00_DESIGN_PRINCIPLES.md) | Visual philosophy — glass, dark-first, depth, motion, color, typography, consistency | ✅ Active | UX_PRINCIPLES, VISION_LOCK |
| [DESIGN_TOKENS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/01_DESIGN_TOKENS.md) | Colors, spacing, elevation, shadows | ✅ Active | DESIGN_PRINCIPLES |
| [TYPOGRAPHY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/02_TYPOGRAPHY.md) | Type scale, font usage, hierarchy | ✅ Active | DESIGN_TOKENS |
| [ICONOGRAPHY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/03_ICONOGRAPHY.md) | Icon system, style guide | ✅ Active | DESIGN_TOKENS |
| [MOTION_SYSTEM.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/04_MOTION_SYSTEM.md) | Animation principles, timing, easing | ✅ Active | DESIGN_TOKENS, DESIGN_PRINCIPLES, ACCESSIBILITY |
| [COMPONENT_LIBRARY.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/05_DESIGN/05_COMPONENT_LIBRARY.md) | Component inventory, variants, states | ✅ Active | DESIGN_TOKENS, TYPOGRAPHY, ICONOGRAPHY, MOTION_SYSTEM |

---

## 9. Module Specifications *(Phase 5 — Planned)*

| Document | Purpose | Status |
|---|---|---|
| WORKSPACE_MODULE.md | Workspace lifecycle, behavior, data flow | ⏳ Planned |
| FILES_MODULE.md | File system behavior, operations, constraints | ⏳ Planned |
| NOTES_MODULE.md | Note editing, saving, linking | ⏳ Planned |
| TASKS_MODULE.md | Task management, states, filtering | ⏳ Planned |
| MEMORY_MODULE.md | Workspace memory behavior | ⏳ Planned |
| CHAT_MODULE.md | Chat behavior, AI integration points | ⏳ Planned |
| SETTINGS_MODULE.md | Settings schema, persistence | ⏳ Planned |

---

## Meta Documents

| Document | Purpose | Status |
|---|---|---|
| [DOCUMENTATION_PHASES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/DOCUMENTATION_PHASES.md) | Documentation phase tracker — completion status and dependencies | ✅ Active |
| [DOCUMENT_LIFECYCLE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/DOCUMENT_LIFECYCLE.md) | Document governance — statuses, change process, freeze rules | ✅ Active |
| [README.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/README.md) | This document — documentation index | ✅ Active |

---

## Document Status Table

| Document Group | Status | Last Review |
|---|---|---|
| Vision Lock | 🔒 Locked | 2026-07 |
| Product Specification | 🔒 Locked | 2026-07 |
| Product Principles | 🔒 Locked | 2026-07 |
| Version Roadmap | 🔒 Locked | 2026-07 |
| Engineering Decisions | 🔒 Frozen | 2026-07 |
| Architecture (Phase 2) | 🔒 Locked | 2026-07 |
| ADRs (9 records) | 🔒 Accepted | 2026-07 |
| Development Standards | ✅ Active | 2026-07 |
| Security Architecture | 🔒 Locked | 2026-07 |
| UX Architecture (Phase 4A) | 🔒 Locked | 2026-07 |
| Visual Design (Phase 4B) | ✅ Active | 2026-07 |
| Performance Budget | ✅ Active | 2026-07 |
| Module Specifications | ⏳ Planned | — |

> **Status key:** 🔒 Locked = no changes without review. ✅ Active = maintained, may evolve. ⏳ Planned = not yet written.

---

## Document Dependency Flow

```text
VISION_LOCK
    │
    ├──▶ PRODUCT_SPECIFICATION
    ├──▶ PRODUCT_PRINCIPLES
    ├──▶ VERSION_ROADMAP
    │
    └──▶ ENGINEERING_DECISIONS
              │
              ├──▶ SYSTEM_ARCHITECTURE ──▶ all phase2/ docs
              ├──▶ SECURITY_ARCHITECTURE
              ├──▶ ADRs (9 records)
              ├──▶ DEVELOPMENT_STANDARDS
              │
              └──▶ UX_PRINCIPLES
                      │
                      ├──▶ NAVIGATION_ARCHITECTURE
                      │       │
                      │       ├──▶ LAYOUT_SYSTEM
                      │       │       │
                      │       │       └──▶ INTERACTION_MODEL
                      │       │               │
                      │       │               └──▶ ACCESSIBILITY ◄──┐
                      │       │                                     │
                      │       └──▶ KEYBOARD_SHORTCUTS               │
                      │                                             │
                      │       PERFORMANCE_BUDGET                    │
                      │                                             │
                      └──▶ DESIGN_PRINCIPLES                       │
                              │                                     │
                              └──▶ DESIGN_TOKENS                   │
                                      │                             │
                                      ├──▶ TYPOGRAPHY               │
                                      ├──▶ ICONOGRAPHY              │
                                      │                             │
                                      └──▶ MOTION_SYSTEM ───────────┘
                                              │
                                              └──▶ COMPONENT_LIBRARY
                                                      │
                                                      └──▶ (Phase 5: Module Specs)
```

---

*This index is maintained as documentation evolves. If you add a new document, add it here.*
