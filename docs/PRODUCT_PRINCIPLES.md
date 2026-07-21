# AI OS — Product Principles

> **Document Type:** Engineering & Product Decision Framework  
> **Version:** v0.3.0  
> **Status:** Active  
> **Last Updated:** 2026-07-10  
> **Depends On:** [VISION_LOCK.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/VISION_LOCK.md)  
> **Audience:** All contributors making design, engineering, or product decisions

These principles are the decision framework for AI OS. When two valid approaches exist, these principles determine which one wins. They are ordered by priority — if two principles conflict, the higher-ranked principle takes precedence.

---

## Principle 1: Workspace First

### Purpose

The workspace is the product. Every other capability — AI, plugins, developer tools, Jarvis — is a layer on top of it. If the workspace is broken, nothing else matters.

### Reasoning

AI OS began as a UI shell (v0.1) with an AI chat (v0.2). The risk is that AI features become the perceived product, making the workspace a secondary concern. This principle inverts that: the workspace is primary, AI is supplementary. A user who never configures an AI provider should still find AI OS useful for organizing projects, files, notes, and tasks.

### Practical Impact

- Workspace features receive development priority over AI enhancements.
- If a workspace bug and an AI bug are reported simultaneously, the workspace bug is fixed first.
- No release should ship improved AI features with degraded workspace stability.

### Engineering Rule

> **No workspace module may import from the AI layer.** Dependencies flow from AI → Workspace (read-only), never Workspace → AI. Enforced via import linting or manual code review.

---

## Principle 2: AI is Optional

### Purpose

Every AI-powered feature must degrade gracefully when AI is unavailable. The product must never feel broken without an API key, without internet, or when every AI provider returns a 503.

### Reasoning

This is the AI Independence Principle from the Vision Lock (Section 8). It exists because:
- Users may not have API keys configured.
- API providers experience outages.
- Future local models (v0.4) may have different availability characteristics.
- The product must be testable and demonstrable without AI dependencies.

### Practical Impact

- AI chat shows "Not configured" or "Offline" — never an error dialog or broken UI.
- Features that require AI are clearly labeled as AI-dependent.
- The boot sequence, desktop, and all workspace apps load successfully with zero AI configuration.

### Engineering Rule

> **Before any feature ships, answer: "Does this work if every AI provider returns a 503?" If the answer is "the workspace becomes unusable," redesign the feature.**

---

## Principle 3: Privacy by Default

### Purpose

User data stays local unless the user explicitly chooses otherwise. No telemetry, no analytics, no data collection without informed consent.

### Reasoning

AI OS stores personal projects, notes, tasks, and (eventually) conversations. This is sensitive data. Users must trust that their workspace data is not being transmitted, stored remotely, or analyzed without their knowledge.

### Practical Impact

- All workspace data is stored client-side (IndexedDB).
- No third-party analytics or tracking scripts.
- AI API calls transmit conversation content to the provider — this must be clearly communicated to the user, not hidden.
- Future cloud sync (if added) must be opt-in, never default.

### Engineering Rule

> **No data leaves the user's device unless (a) the user initiated the action (e.g., sending a chat message) and (b) the destination is visible to the user (e.g., the selected AI provider). Silent data transmission is prohibited.**

---

## Principle 4: Security by Design

### Purpose

Security is a design constraint, not a post-launch patch. Every data flow, storage decision, and external communication must consider security implications from the start.

### Reasoning

v0.3.0 has a known security gap: API keys are stored client-side in environment variables and exposed in the browser. This is documented and accepted as a temporary architecture (see aiService.ts). However, this acceptance must not normalize insecure patterns. Every version should reduce the attack surface, not expand it.

### Practical Impact

- API keys are stored in `.env` files excluded from version control (`.gitignore`).
- No secrets are hardcoded in source files.
- Future versions must introduce a backend proxy to avoid exposing API keys in the browser.
- The virtual filesystem sandboxes file operations — no access to the real filesystem.

### Engineering Rule

> **Every external API call must be auditable: what data is sent, to whom, and why. New external dependencies require a security review before adoption.**

---

## Principle 5: Modular Architecture

### Purpose

Every feature area is an independent module with clear boundaries. Modules communicate through typed interfaces, not direct imports of internal logic.

### Reasoning

AI OS will grow from 6 modules (v0.3.0) to potentially dozens (v1.0+). Without modular boundaries, changes in one area (e.g., task management) will cascade into unrelated areas (e.g., file system). Modules must be replaceable, testable, and deployable independently (where applicable).

### Practical Impact

- Each workspace feature (projects, files, notes, tasks, settings, memory) has its own store, its own types, and its own components directory.
- Cross-module communication goes through exported interfaces, not internal state access.
- The AI layer is a module that can be entirely removed without modifying workspace code.

### Engineering Rule

> **If removing module A causes module B to fail compilation, there is an undeclared dependency. Either declare it as an explicit interface or refactor to remove it. No implicit coupling.**

---

## Principle 6: Extensible Platform

### Purpose

The architecture must accommodate future growth — plugins (v0.6), developer tools (v0.5), Jarvis (v0.7) — without requiring rewrites of the core.

### Reasoning

AI OS has an 8-version roadmap. Decisions made in v0.3.0 will be lived with through v1.0. If the data layer can't support plugins, or the provider abstraction can't accommodate local models, those become expensive rewrites. Extensibility doesn't mean building plugin APIs now — it means not closing the door on them.

### Practical Impact

- Data models include a schema version for future migrations.
- The persistence layer is behind an interface (not tied to IndexedDB internals).
- The AI provider abstraction is interface-based, allowing new adapters without core changes.
- The window management system accepts arbitrary panel content, not a hardcoded list of apps.

### Engineering Rule

> **Design interfaces for tomorrow's requirements; implement for today's. If a v0.3.0 decision would prevent a v0.5 capability, flag it for review. But do not build v0.5 features in v0.3.0.**

---

## Principle 7: User Control

### Purpose

The user is always in control of their workspace. No automated action should occur without the user's ability to understand, undo, or prevent it.

### Reasoning

AI-augmented environments risk "magic" behaviors that users don't understand or can't control. AI OS must avoid this. Every action — whether user-initiated or AI-suggested — must be transparent and reversible where possible.

### Practical Impact

- Destructive actions (delete project, delete file) require confirmation.
- AI suggestions (future) are presented as suggestions, never auto-applied.
- Settings changes take effect immediately and are reversible.
- No background processes that modify user data without visibility.

### Engineering Rule

> **Every state mutation triggered by something other than a direct user action must be (a) visible in the UI and (b) undoable or preventable. No silent data modifications.**

---

## Principle 8: Consistency

### Purpose

The product should feel like one cohesive environment, not a collection of independent apps glued together.

### Reasoning

AI OS uses a desktop metaphor with multiple "apps" (file browser, notes, tasks, chat, settings). Each runs in a panel. The risk is that each app develops its own interaction patterns, color schemes, and behaviors. Consistency means: if you know how one panel works, you know how they all work.

### Practical Impact

- All panels share the same header, close/minimize behavior, and drag mechanics.
- All forms use the same input components, button styles, and spacing.
- All destructive actions use the same confirmation pattern.
- The theme engine applies uniformly — no app opts out of theming.
- Error states follow a consistent pattern across all apps.

### Engineering Rule

> **New UI components must be built from the existing component library (GlassButton, GlassCard, Input, Panel). If a new pattern is needed, it is added to the library — not inlined in a single app.**

---

## Principle 9: Progressive Enhancement

### Purpose

Start simple. Add complexity only when users demonstrate a need for it. Every feature begins as its minimal useful version and grows through usage feedback.

### Reasoning

The Vision Lock (Section 10.3) states: "It is better to ship a complete file manager than a half-built file manager plus a half-built terminal." Progressive enhancement applies this principle within features, not just across them. A task manager with create/complete/delete is more valuable than one with subtasks, tags, priorities, and calendar sync — but buggy.

### Practical Impact

- v0.3.0 tasks have: title, status, creation date. Optional: description, priority, due date. No subtasks, no recurring tasks, no assignees.
- v0.3.0 notes have: markdown editing. No templates, no tags, no backlinks.
- v0.3.0 files have: tree view, CRUD. No search, no preview, no version history.
- Each feature is complete at its current level, not a skeleton of a fuller version.

### Engineering Rule

> **Features ship when they are complete at their defined scope level. "We'll finish this in the next release" is a scope reduction, not a plan. If a feature can't be completed at its minimal scope, it is cut — not shipped incomplete.**

---

## Principle 10: Provider Independence

### Purpose

AI OS must never be locked to a single AI provider. Switching providers must be a configuration change, not a codebase rewrite.

### Reasoning

The Vision Lock (Section 9.3) mandates a provider abstraction layer. This principle extends beyond architecture into product philosophy: the user should choose their AI provider (or use none), not the product. This also protects the project from provider-specific risks: pricing changes, API deprecations, terms of service changes, and regional availability.

### Practical Impact

- The AI provider interface defines capabilities generically (text generation, not Gemini-specific features).
- Provider-specific features (e.g., Gemini's grounding) are exposed as optional capabilities, not core requirements.
- The settings UI (future) allows users to select their provider and enter their own API key.
- The product never surfaces a specific provider's branding in core UI elements.

### Engineering Rule

> **The provider abstraction interface must be defined by workspace needs, not by what a specific provider offers. If a feature requires a provider-specific capability, it is marked as provider-dependent and degrades gracefully when that provider is not selected.**

---

## Principle 11: Foundation Before Features

### Purpose

Infrastructure and architectural decisions must be settled before feature development begins. Building features on unstable foundations leads to rework.

### Reasoning

v0.3.0 introduces the persistence layer, the data model, the provider abstraction, and the module structure. These are the foundations that v0.4–v1.0 build on. If the data model is wrong, every feature built on it will need migration. If the persistence layer leaks IndexedDB semantics, swapping to OPFS or SQLite will require touching every component.

### Practical Impact

- v0.3.0 development sequence: (1) persistence layer + data model, (2) provider abstraction, (3) project management, (4) file system, (5) notes, (6) tasks, (7) settings migration + memory, (8) window management improvements.
- Foundation items (1, 2) must be reviewed and approved before feature items (3–8) begin.
- Schema changes after feature development has started require a migration plan.

### Engineering Rule

> **Foundational modules (persistence, data model, provider abstraction) must be code-reviewed and integration-tested before any feature module depends on them. No feature work proceeds on an unreviewed foundation.**

---

## Conflict Resolution

When principles conflict, use priority order (Principle 1 outranks Principle 11). Common conflicts and their resolutions:

| Conflict | Resolution |
|---|---|
| **Extensible Platform** vs. **Foundation Before Features** | Don't build extension points in v0.3.0. Design interfaces that *allow* extension — but implement only what's needed now. |
| **Progressive Enhancement** vs. **Consistency** | A feature can start simple, but its simple version must still follow the design system. "Progressive" applies to feature depth, not visual quality. |
| **User Control** vs. **Performance** | If showing a confirmation dialog adds 200ms to a workflow, keep the dialog. User control outranks perceived performance. |
| **Provider Independence** vs. **AI is Optional** | Both reinforce each other. If only one is achievable, **AI is Optional** wins — a workspace that works without AI is more important than a workspace that supports multiple AI providers. |
| **Security by Design** vs. **No Backend (current)** | The known gap (client-side API keys) is documented and accepted for v0.3.0. It does not justify delaying the workspace release. It does require a backend in a future version. |

---

*These principles are the decision framework for AI OS. When in doubt, reference them in order. Every engineering decision, code review comment, and feature debate should be traceable to one of these principles.*
