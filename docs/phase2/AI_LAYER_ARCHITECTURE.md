# AI OS — AI Layer Architecture

> **Document Type:** Technical Foundation  
> **Phase:** 2.8  
> **Status:** Active  
> **Last Updated:** 2026-07-10  
> **Depends On:** [VISION_LOCK.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/VISION_LOCK.md) (Sections 8, 9), [ENGINEERING_DECISIONS.md](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md) (Section 6)

---

## 1. Architectural Position

The AI Layer is an **optional, self-contained module** that sits alongside the workspace — not inside it.

```text
┌────────────────────────┐     ┌────────────────────────┐
│   Workspace Modules    │     │      AI Module          │
│                        │     │                         │
│  projects/             │     │  providers/             │
│  files/                │◄────│    types.ts             │
│  tasks/        reads   │     │    geminiAdapter.ts     │
│  settings/    context  │     │    registry.ts          │
│  memory/               │     │  chat/                  │
│                        │     │    chatService.ts       │
│                        │     │    chatStore.ts         │
│                        │     │    components/           │
│                        │     │  config.ts              │
└────────────────────────┘     └────────────┬───────────┘
                                            │
                                  ┌─────────▼───────────┐
                                  │  Provider Abstraction │
                                  │        │              │
                                  │  ┌─────┼─────┬──────┐│
                                  │  ▼     ▼     ▼      ▼│
                                  │ Gemini OR  OpenAI Local│
                                  │       Router    Models│
                                  └───────────────────────┘
```

**Boundary rules (from Vision Lock Section 9.4):**

| Direction | Allowed? |
|---|---|
| AI Layer → reads workspace data via exported interfaces | ✅ |
| Workspace → imports AI modules | ❌ Prohibited |
| AI Layer → External provider APIs | ✅ |
| Workspace → External provider APIs | ❌ Prohibited |

---

## 2. Provider Abstraction

### 2.1 Provider Interface (v0.3.0 — Text Completion Only)

```typescript
interface AIProvider {
  /** Unique identifier for this provider */
  readonly id: string;

  /** Human-readable display name */
  readonly name: string;

  /** What this provider supports */
  capabilities(): ProviderCapabilities;

  /** Validate that the provider is configured (has API key, etc.) */
  isConfigured(): boolean;

  /** Generate a text completion */
  generateCompletion(request: CompletionRequest): Promise<CompletionResponse>;
}

interface ProviderCapabilities {
  textCompletion: boolean;
  streaming: boolean;           // false for all v0.3.0 adapters
  functionCalling: boolean;     // false for all v0.3.0 adapters
  vision: boolean;              // false for all v0.3.0 adapters
  embeddings: boolean;          // false for all v0.3.0 adapters
}
```

### 2.2 Request / Response Types

```typescript
interface CompletionRequest {
  messages: ConversationMessage[];
  systemPrompt?: string;
  signal?: AbortSignal;
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface CompletionResponse {
  content: string;
  usage: TokenUsage;
  providerId: string;           // Which provider generated this response
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}
```

### 2.3 Provider Error Type

```typescript
class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly providerId: string;
  readonly retryable: boolean;

  constructor(
    message: string,
    code: ProviderErrorCode,
    providerId: string,
    retryable = false
  ) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.providerId = providerId;
    this.retryable = retryable;
  }
}

type ProviderErrorCode =
  | 'NOT_CONFIGURED'       // No API key
  | 'AUTH_ERROR'            // Invalid API key
  | 'RATE_LIMIT'            // Rate limited
  | 'NETWORK_ERROR'         // Cannot reach provider
  | 'PROVIDER_ERROR'        // Provider-side failure (500, 503)
  | 'EMPTY_RESPONSE'        // Provider returned empty content
  | 'CANCELLED'             // Request aborted by user
  | 'UNSUPPORTED';          // Requested capability not supported
```

---

## 3. Provider Registry

### 3.1 Registry Pattern

The registry manages all available providers. Services request the active provider from the registry — they never instantiate adapters directly.

```typescript
interface ProviderRegistry {
  /** Register a new provider adapter */
  register(provider: AIProvider): void;

  /** Get all registered providers */
  getAll(): AIProvider[];

  /** Get the currently active provider (selected by user/config) */
  getActive(): AIProvider | null;

  /** Set the active provider by ID */
  setActive(providerId: string): void;

  /** Get a specific provider by ID */
  getById(id: string): AIProvider | undefined;

  /** Check if any provider is configured and available */
  isAnyAvailable(): boolean;
}
```

### 3.2 Registration Flow (Boot)

```text
initializationService.boot()
    │
    ├── Register built-in providers:
    │   ├── providerRegistry.register(new GeminiAdapter())
    │   ├── // providerRegistry.register(new OpenRouterAdapter())  (future)
    │   └── // providerRegistry.register(new OpenAIAdapter())       (future)
    │
    ├── Read activeProviderId from settingsRepository
    │
    └── providerRegistry.setActive(activeProviderId)
        │
        └── If no active provider → AI features show "not configured"
            Workspace continues to function normally
```

---

## 4. Gemini Adapter (v0.3.0 Reference Implementation)

### 4.1 Migration from v0.2

The existing `aiService.ts` is **replaced** by:
1. The `AIProvider` interface (generic).
2. `GeminiAdapter` (Gemini-specific implementation of `AIProvider`).
3. `ProviderRegistry` (selects and provides the active adapter).
4. `chatService` (orchestrates chat using the registry, not Gemini directly).

### 4.2 Adapter Structure

```typescript
class GeminiAdapter implements AIProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';

  private client: GoogleGenAI | null = null;

  capabilities(): ProviderCapabilities {
    return {
      textCompletion: true,
      streaming: false,        // v0.3.0 scope
      functionCalling: false,
      vision: false,
      embeddings: false,
    };
  }

  isConfigured(): boolean {
    return Boolean(this.getApiKey()?.trim() && this.getModel()?.trim());
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    // 1. Validate configuration
    // 2. Convert messages to Gemini format
    // 3. Call Gemini API
    // 4. Map response to CompletionResponse
    // 5. Handle errors → throw ProviderError
  }

  private getApiKey(): string | undefined {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }

  private getModel(): string {
    return import.meta.env.VITE_GEMINI_MODEL ?? 'gemini-2.5-flash';
  }
}
```

**Key difference from v0.2:** Gemini-specific imports (`@google/genai`), error handling, and message format conversion are entirely contained within `GeminiAdapter`. No other file in the codebase imports from `@google/genai`.

---

## 5. Chat Service

The chat service orchestrates conversations. It uses the provider registry — not a specific adapter.

```typescript
// src/ai/chat/chatService.ts

interface ChatService {
  sendMessage(content: string, signal?: AbortSignal): Promise<void>;
  retryLastMessage(signal?: AbortSignal): Promise<void>;
  clearConversation(): void;
  isAvailable(): boolean;
}
```

### 5.1 sendMessage Flow

```text
chatService.sendMessage("Hello")
    │
    ├── 1. Add user message to chatStore
    ├── 2. Set chatStore.isLoading = true
    ├── 3. Get active provider from registry
    │      └── If null → throw ProviderError('NOT_CONFIGURED')
    ├── 4. Build CompletionRequest from chatStore.messages
    ├── 5. provider.generateCompletion(request)
    │      ├── Success → Add assistant message to chatStore
    │      │            → Update token usage
    │      └── Failure → Set chatStore.error
    └── 6. Set chatStore.isLoading = false
```

### 5.2 AI Independence Validation

```text
provider = registry.getActive()

if (provider === null):
    → chatStore.setError("No AI provider configured")
    → UI shows "AI not available" indicator
    → ALL workspace features continue working ✅

if (provider.isConfigured() === false):
    → chatStore.setError("API key not set")
    → UI shows configuration instructions
    → ALL workspace features continue working ✅

if (network is offline):
    → provider.generateCompletion() throws NETWORK_ERROR
    → chatStore.setError("You're offline")
    → ALL workspace features continue working ✅
```

---

## 6. Configuration

### 6.1 Current (v0.3.0) — Environment Variables

```text
# Provider: Gemini
VITE_GEMINI_API_KEY=your-api-key
VITE_GEMINI_MODEL=gemini-2.5-flash

# Provider: OpenRouter (future)
# VITE_OPENROUTER_API_KEY=your-api-key
# VITE_OPENROUTER_MODEL=model-name

# Provider: OpenAI (future)
# VITE_OPENAI_API_KEY=your-api-key
# VITE_OPENAI_MODEL=gpt-4o
```

### 6.2 Future (v0.4+) — Settings UI

The `activeProviderId` setting (stored in Dexie via `settingsRepository`) determines which provider is active. v0.4 adds a Settings panel where users configure providers, enter API keys, and select models — replacing environment variables for provider configuration.

---

## 7. Adding a New Provider (Adapter Guide)

To add support for a new AI provider:

1. Create `src/ai/providers/[name]Adapter.ts`.
2. Implement the `AIProvider` interface.
3. Register in the initialization service: `providerRegistry.register(new NewAdapter())`.
4. Add configuration (env vars or settings) for API key and model.

**No workspace code changes required.** This is the provider abstraction's core value.

```typescript
// Example: OpenRouter adapter (future)
class OpenRouterAdapter implements AIProvider {
  readonly id = 'openrouter';
  readonly name = 'OpenRouter';

  capabilities(): ProviderCapabilities { /* ... */ }
  isConfigured(): boolean { /* ... */ }
  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> { /* ... */ }
}
```

---

## Document Metadata

| | |
|---|---|
| **Dependencies** | Vision Lock (AI Independence Principle, Conceptual Architecture), Engineering Decisions (provider scope: text completion only, AI layer separation) |
| **Used By** | Chat components (via chatService), Interface Contracts (provider types), Shell (AI status indicators) |
| **Future Versions** | v0.4 adds streaming, local model adapter. v0.5 may add function calling. v0.6 enables community-contributed adapters via plugin API. v0.7 Jarvis uses provider abstraction for all AI interactions. |
| **Breaking Change Risk** | **Medium** — Adding capabilities to the interface (streaming, function calling) must be additive (optional fields, new methods with defaults). Removing or changing `generateCompletion` signature would break all adapters. |
