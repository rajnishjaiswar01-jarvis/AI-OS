# ADR-008: Per-Panel React Error Boundaries

> **Status:** ✅ Accepted  
> **Date:** 2026-07-10  
> **Deciders:** Project Owner + Principal Architect

---

## Context

AI OS renders multiple "apps" (file browser, notes, tasks, chat, settings) as panels on a desktop. Each panel is an independent React component tree. Without error boundaries, a rendering error in any single panel crashes the **entire** application — all panels, the dock, and the top bar disappear.

## Options Considered

| Option | Pros | Cons |
|---|---|---|
| **No error boundaries** | Zero effort | Single component crash takes down entire app. Unacceptable for a multi-panel workspace. |
| **Single global error boundary** | Catches all crashes | Shows one error screen for the entire app. User loses all panels, not just the broken one. |
| **Per-panel error boundaries** | Crash is isolated to the affected panel. Other panels, dock, and top bar continue working. | Must wrap every panel. Slightly more component nesting. |

## Decision

**Per-panel error boundaries.** Every panel is wrapped in a React Error Boundary. A crash in one panel shows an error fallback within that panel. All other panels remain functional.

## Consequences

### Positive

- **Crash isolation.** File browser crashes → chat and tasks still work. User can close the broken panel and reopen it.
- **Better user experience.** "Something went wrong in this panel" is far less disruptive than a white screen.
- **Debuggable.** The error boundary catches the error and can log component stack, making diagnosis easier.

### Negative

- **Minor component overhead.** One extra wrapper per panel. Negligible performance impact.
- **Error state design needed.** Each panel needs an error fallback UI (retry button, error message). Small design effort.

## References

- [ENGINEERING_DECISIONS.md Section 7.1](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md)
- [SYSTEM_ARCHITECTURE.md Section 6](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/SYSTEM_ARCHITECTURE.md)
