# ADR-003: Provider Abstraction for AI Layer

> **Status:** ✅ Accepted  
> **Date:** 2026-07-10  
> **Deciders:** Project Owner + Principal Architect

---

## Context

AI OS v0.2 hard-codes Gemini as the only AI provider. `aiService.ts` directly imports `@google/genai`. `ai.ts` references Gemini-specific environment variables. This creates vendor lock-in: switching to OpenAI, OpenRouter, or a local model would require rewriting the AI service, chat logic, and any code that references Gemini-specific types.

The Vision Lock (Sections 8, 9) mandates that (a) the workspace works without AI, and (b) AI providers are swappable.

## Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Keep Gemini hard-coded** | Zero effort, works now | Vendor lock-in, violates Vision Lock, switching providers later is a rewrite |
| **Simple adapter pattern** | One interface, one adapter per provider. Registry selects active adapter. | Requires up-front interface design. Risk of speculative abstraction. |
| **Plugin-based providers** | Providers as dynamically loaded plugins | Over-engineering for v0.3.0. Plugin system doesn't exist until v0.6. |
| **LangChain/Vercel AI SDK** | Pre-built multi-provider abstraction | External dependency, heavy, opinionated, may not align with our patterns |

## Decision

**Simple adapter pattern with a provider registry.** v0.3.0 scope is text completion only — no streaming, function calling, vision, or embeddings.

```text
AIProvider (interface)
├── generateCompletion()
├── capabilities()
└── isConfigured()

GeminiAdapter implements AIProvider
ProviderRegistry manages adapters
```

## Consequences

### Positive

- Gemini dependency contained to one file (`geminiAdapter.ts`). No other file imports `@google/genai`.
- Adding OpenRouter or OpenAI requires implementing one adapter — zero workspace code changes.
- `capabilities()` method allows features to check what the active provider supports before calling it.
- AI Independence Principle enforced: `registry.getActive()` returns `null` when no provider is configured.

### Negative

- v0.3.0 ships with only one working adapter (Gemini). Abstraction isn't fully validated until a second adapter exists.
- Interface design risk: the interface is based on Gemini's capabilities. Other providers may need different request shapes.
- Overhead: simple chat now goes through 3 layers (chatService → registry → adapter) instead of 1.

### Mitigations

- Validate the interface by reviewing OpenAI and OpenRouter API docs during design — even without building full adapters.
- Keep the interface minimal (text completion only). Add capabilities (streaming, function calling) as optional extensions in v0.4.

## References

- [ENGINEERING_DECISIONS.md Section 6](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md)
- [AI_LAYER_ARCHITECTURE.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/AI_LAYER_ARCHITECTURE.md)
- [Vision Lock Sections 8, 9](file:///c:/Users/ritik/jarvis/AI%20OS/docs/VISION_LOCK.md)
