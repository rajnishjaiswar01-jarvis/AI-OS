/**
 * AI OS — AI Provider Interface
 *
 * Provider-agnostic abstraction for AI interactions.
 * All AI providers (Gemini, OpenAI, local models) implement this interface.
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
 * class GeminiProvider implements AiProvider {
 *   readonly id = 'gemini';
 *   readonly name = 'Google Gemini';
 *   // ...
 * }
 * ```
 */
export interface AiProvider {
  /** Unique identifier for this provider (e.g., 'gemini', 'openai', 'local') */
  readonly id: string;

  /** Human-readable display name (e.g., 'Google Gemini') */
  readonly name: string;

  /** Generate a response from conversation history */
  generate(messages: AiMessage[], options?: GenerateOptions): Promise<AiResponse>;

  /** Check if the provider is properly configured and ready to use */
  isConfigured(): boolean;
}
