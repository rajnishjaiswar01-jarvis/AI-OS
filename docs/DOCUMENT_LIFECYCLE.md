# AI OS — Document Lifecycle & Governance

> **Document Type:** Meta / Governance  
> **Status:** Active  
> **Last Updated:** 2026-07-18  
> **Audience:** All contributors who create, modify, or review documentation

This document defines the lifecycle of every document in AI OS — from creation through archival. It establishes the rules for when documents can change, who approves changes, and how changes are tracked.

**This is a governance document, not a specification.** It does not define product behavior — it defines documentation discipline.

---

## 1. Document Statuses

Every document in AI OS has exactly one status at any given time.

```text
Draft ──▶ Review ──▶ Approved ──▶ Frozen
                                    │
                                    ├──▶ Deprecated
                                    │
                                    └──▶ Archived
```

| Status | Meaning | Who Can Edit | Change Process |
|---|---|---|---|
| **Draft** | Work in progress. Content is incomplete or unvalidated. | Author | No approval needed. |
| **Review** | Content complete. Awaiting review and feedback. | Author + Reviewer | Comments and revisions only. |
| **Approved** | Reviewed and accepted. Content is authoritative but may evolve. | Any contributor | Changes require a documented reason in the commit message. |
| **Frozen** | Locked. Content is considered final for the current version scope. | Restricted (see Section 3) | Formal change process required (see Section 3). |
| **Deprecated** | No longer authoritative. Superseded by a newer document or decision. | No edits | Add deprecation notice at top. Do not delete. |
| **Archived** | Historical reference only. Moved out of active documentation. | No edits | Move to `docs/_archive/` with a date suffix. |

---

## 2. Status Transitions

### 2.1 Valid Transitions

```text
Draft       → Review       (author declares content complete)
Review      → Draft        (reviewer requests major revisions)
Review      → Approved     (reviewer approves)
Approved    → Frozen       (explicit freeze decision — documented in commit)
Frozen      → Approved     (unfreeze for updates — requires change process)
Approved    → Deprecated   (superseded by new document)
Frozen      → Deprecated   (superseded by new document)
Deprecated  → Archived     (moved to archive after one version cycle)
```

### 2.2 Invalid Transitions

- Draft → Frozen (cannot freeze without review)
- Archived → any status (archived documents are permanent history)
- Deprecated → Approved (create a new document instead of reviving)

---

## 3. Frozen Document Change Process

Frozen documents represent locked decisions. Changing them requires explicit justification.

### When a Frozen Document Needs to Change

| Trigger | Example |
|---|---|
| Implementation reveals an incorrect assumption | Database schema doesn't support a required query pattern |
| New requirement invalidates a frozen decision | User feedback demands a feature that contradicts a product principle |
| Technology constraint forces a pivot | A frozen library choice has a critical security vulnerability |

### Change Process

1. **Create an ADR** (if the change is architectural) or document the change reason in the commit message.
2. **Update the document** with the change.
3. **Update the `Last Updated` date** in the document header.
4. **Update the Document Status Table** in [README.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/README.md) with the new review date.
5. **Notify stakeholders** — if the change affects downstream documents, update those references.

### Change Log Format

When modifying a Frozen document, add a change entry at the bottom of the document:

```markdown
---

## Change Log

| Date | Change | Reason | Impact |
|---|---|---|---|
| 2026-07-18 | Initial freeze | — | — |
| YYYY-MM-DD | [What changed] | [Why] | [Which downstream docs affected] |
```

---

## 4. Current Document Inventory

> **Cross-reference:** For the full document index with links, purposes, and dependency chains, see [README.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/README.md). For phase tracking, see [DOCUMENTATION_PHASES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/DOCUMENTATION_PHASES.md).

### Status Summary

| Document Group | Count | Status |
|---|---|---|
| Product Foundation | 4 | 🔒 Frozen |
| Engineering Decisions | 2 | 🔒 Frozen |
| Technical Architecture | 7 | 🔒 Frozen |
| ADRs | 9 | 🔒 Accepted (Frozen) |
| Development Standards | 1 | ✅ Approved |
| Security Architecture | 1 | 🔒 Frozen |
| UX Architecture | 6 | 🔒 Frozen |
| Visual Design System | 6 | ✅ Approved |
| Performance Budget | 1 | ✅ Approved |
| Meta / Governance | 3 | ✅ Active |
| **Total** | **40** | — |

---

## 5. Documentation Freeze Declaration

**Effective:** 2026-07-18

As of this date, the AI OS documentation set is considered **implementation-ready**. The following rules apply:

### What Is Frozen

- All Phase 1 through Phase 4A documents are **Frozen**.
- No new specification documents will be created proactively.

### What Remains Active

- Phase 4B (Visual Design System) documents are **Approved** — they may evolve as implementation reveals refinements.
- Module Specifications (Phase 5) will be written **parallel to implementation**, not before it.
- This governance document and the documentation index ([README.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/README.md)) remain **Active**.

### The One Rule

> **Do not create new documents unless implementation genuinely reveals a gap.**
>
> If a gap is found:
> 1. Can it be addressed by updating an existing document? → Update.
> 2. Does it require a new architectural decision? → Create an ADR.
> 3. Does it require an entirely new specification? → Create it, but justify why existing docs are insufficient.

---

## 6. Naming Conventions

All documentation files follow these rules:

| Rule | Example |
|---|---|
| UPPER_SNAKE_CASE for filenames | `DESIGN_TOKENS.md`, `VISION_LOCK.md` |
| Numbered prefix for ordered docs within a phase directory | `00_DESIGN_PRINCIPLES.md`, `01_DESIGN_TOKENS.md` |
| ADR format: `ADR-NNN-Title.md` | `ADR-001-Use-Dexie.md` |
| Phase directories use numbered prefixes | `04_UX/`, `05_DESIGN/` |

---

## 7. Document Header Template

Every document must include this header:

```markdown
# AI OS — [Document Title]

> **Document Type:** [Specification / Architecture / ADR / Meta]  
> **Phase:** [1 / 1.5 / 2 / 2.5 / 3 / 4A / 4B / 5 / 6]  
> **Status:** [Draft / Review / Approved / Frozen]  
> **Last Updated:** [YYYY-MM-DD]  
> **Depends On:** [Links to dependency documents]  
> **Audience:** [Who should read this]
```

---

*This is a governance document. It defines process, not product. For the documentation index, see [README.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/README.md). For phase tracking, see [DOCUMENTATION_PHASES.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/DOCUMENTATION_PHASES.md).*
