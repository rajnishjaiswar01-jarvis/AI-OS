/**
 * AI OS — AI Service
 *
 * Reusable service for all AI interactions. Every feature (Chat, Voice,
 * File Analysis, Code Generation, Automation) calls generateResponse().
 *
 * All provider implementation details are hidden behind this module.
 * The rest of the application never communicates directly with the AI API.
 *
 * Architecture: The client sends messages to /api/ai/chat (our own server
 * proxy). The server holds the API key, calls Gemini, and returns the
 * response. No API key or external URL ever reaches the browser.
 */

import { AI_CONFIG, DEFAULT_SYSTEM_PROMPT, validateAiConfig } from '@ai/config';

// ─── Public Types ────────────────────────────────────────────────────

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface AiResponse {
  content: string;
  usage: AiUsage;
}

export interface GenerateOptions {
  /** Override the default system prompt */
  systemPrompt?: string;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
}

// ─── Error Types ─────────────────────────────────────────────────────

export type AiErrorCode = 'CONFIG_ERROR' | 'AUTH_ERROR' | 'RATE_LIMIT' | 'NETWORK_ERROR' | 'API_ERROR' | 'EMPTY_RESPONSE' | 'CANCELLED';

export class AiServiceError extends Error {
  readonly code: AiErrorCode;
  readonly retryable: boolean;

  constructor(message: string, code: AiErrorCode, retryable: boolean = false) {
    super(message);
    this.name = 'AiServiceError';
    this.code = code;
    this.retryable = retryable;
  }
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Generate an AI response from a conversation history.
 *
 * @param messages - Conversation messages (user/assistant turns)
 * @param options  - Optional system prompt override and abort signal
 * @returns        - AI response content and token usage
 *
 * @example
 * ```ts
 * const response = await generateResponse([
 *   { role: 'user', content: 'Hello!' }
 * ]);
 * console.log(response.content);
 * console.log(response.usage.totalTokens);
 * ```
 */
export async function generateResponse(
  messages: AiMessage[],
  options: GenerateOptions = {},
): Promise<AiResponse> {
  // Validate configuration before making any request
  try {
    validateAiConfig();
  } catch (error) {
    throw new AiServiceError(
      (error as Error).message,
      'CONFIG_ERROR',
    );
  }

  // Check for pre-aborted signal
  if (options.signal?.aborted) {
    throw new AiServiceError('Request was cancelled.', 'CANCELLED');
  }

  const systemPrompt = options.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;

  // Build request body for our server proxy
  // Only send user/assistant messages — the server prepends the system prompt
  const requestBody = {
    messages: messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    systemPrompt,
  };

  try {
    const response = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: options.signal,
    });

    // Parse the response body
    const data = await response.json();

    // Server returns { error, code, retryable? } on failure
    if (!response.ok) {
      throw new AiServiceError(
        data.error ?? 'Something went wrong.',
        data.code ?? 'API_ERROR',
        data.retryable ?? false,
      );
    }

    // Server returns { content, usage } on success
    const content = data.content;

    if (!content) {
      throw new AiServiceError(
        'The AI returned an empty response. Please try again.',
        'EMPTY_RESPONSE',
        true,
      );
    }

    const usage: AiUsage = {
      inputTokens: data.usage?.inputTokens ?? 0,
      outputTokens: data.usage?.outputTokens ?? 0,
      totalTokens: data.usage?.totalTokens ?? 0,
    };

    return { content, usage };
  } catch (error) {
    // Re-throw our own errors
    if (error instanceof AiServiceError) {
      throw error;
    }

    // Handle abort
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AiServiceError('Request was cancelled.', 'CANCELLED');
    }

    // Network errors (can't reach our own /api/ai/chat)
    const err = error as Error & { message?: string };
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
      throw new AiServiceError(
        'Unable to connect. Please check your internet connection and try again.',
        'NETWORK_ERROR',
        true,
      );
    }

    // Generic fallback
    throw new AiServiceError(
      err.message || 'Something went wrong. Please try again.',
      'API_ERROR',
      true,
    );
  }
}
