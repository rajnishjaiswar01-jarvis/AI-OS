/**
 * AI OS — AI Provider Interface
 *
 * Provider-agnostic abstraction for AI interactions.
 * All AI providers (Experiential Labs, OpenAI, local models) implement this interface.
 *
 * The rest of the application communicates through this contract,
 * never directly with any AI SDK.
 */

// ─── Message Types ───────────────────────────────────────────────────

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ─── Response Types ──────────────────────────────────────────────────

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface AiResponse {
  content: string;
  usage: AiUsage;
}

// ─── Options ─────────────────────────────────────────────────────────

export interface GenerateOptions {
  /** Override the default system prompt */
  systemPrompt?: string;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
}

// ─── Provider Interface ──────────────────────────────────────────────

/**
 * Contract that every AI provider must implement.
 *
 * @example
 * ```ts
 * class AstraProvider implements AiProvider {
 *   readonly id = 'astra';
 *   readonly name = 'GPT Astra';
 *   // ...
 * }
 * ```
 */
export interface AiProvider {
  /** Unique identifier for this provider (e.g., 'astra', 'openai', 'local') */
  readonly id: string;

  /** Human-readable display name (e.g., 'GPT Astra') */
  readonly name: string;

  /** Generate a response from conversation history */
  generate(messages: AiMessage[], options?: GenerateOptions): Promise<AiResponse>;

  /** Check if the provider is properly configured and ready to use */
  isConfigured(): boolean;
}
