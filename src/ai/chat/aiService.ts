/**
 * AI OS — AI Service
 *
 * Reusable service for all AI interactions. Every feature (Chat, Voice,
 * File Analysis, Code Generation, Automation) calls generateResponse().
 *
 * All provider implementation details are hidden behind this module.
 * The rest of the application never communicates directly with the AI API.
 *
 * ⚠️ TEMPORARY ARCHITECTURE:
 * Currently calls the AI API directly from the browser using VITE_*
 * env vars (exposed in the client bundle). Will be migrated to a
 * secure backend/serverless proxy in a future version.
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

// ─── OpenAI-compatible API Types ─────────────────────────────────────

interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAiRequestBody {
  model: string;
  messages: OpenAiMessage[];
}

interface OpenAiChoice {
  message: {
    role: string;
    content: string;
  };
}

interface OpenAiUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenAiResponse {
  choices: OpenAiChoice[];
  usage?: OpenAiUsage;
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

  // Build OpenAI-compatible messages array
  // System prompt goes as the first message with role 'system'
  const openAiMessages: OpenAiMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
  ];

  const requestBody: OpenAiRequestBody = {
    model: AI_CONFIG.model!,
    messages: openAiMessages,
  };

  const url = `${AI_CONFIG.baseUrl}/chat/completions`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: options.signal,
    });

    // Handle HTTP errors
    if (!response.ok) {
      handleHttpError(response.status);
    }

    const data: OpenAiResponse = await response.json();

    // Extract content
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new AiServiceError(
        'The AI returned an empty response. Please try again.',
        'EMPTY_RESPONSE',
        true,
      );
    }

    // Extract usage (default to 0 if not provided)
    const usage: AiUsage = {
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
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

    // Handle specific API errors
    const err = error as Error & { status?: number; message?: string };

    // Network errors
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
      throw new AiServiceError(
        'Unable to connect. Please check your internet connection and try again.',
        'NETWORK_ERROR',
        true,
      );
    }

    // Check error message for common patterns
    const message = err.message?.toLowerCase() ?? '';

    if (message.includes('api key') || message.includes('unauthorized') || message.includes('permission')) {
      throw new AiServiceError(
        'Invalid API key. Please check your VITE_AI_API_KEY in .env.',
        'AUTH_ERROR',
      );
    }

    if (message.includes('rate limit') || message.includes('quota')) {
      throw new AiServiceError(
        'Rate limit reached. Please wait a moment and try again.',
        'RATE_LIMIT',
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

// ─── Internal Helpers ────────────────────────────────────────────────

function handleHttpError(status: number): never {
  switch (status) {
    case 400:
      throw new AiServiceError(
        'Invalid request. Please try rephrasing your message.',
        'API_ERROR',
      );

    case 401:
    case 403:
      throw new AiServiceError(
        'Invalid API key. Please check your VITE_AI_API_KEY in .env.',
        'AUTH_ERROR',
      );

    case 429:
      throw new AiServiceError(
        'Rate limit reached. Please wait a moment and try again.',
        'RATE_LIMIT',
        true,
      );

    case 500:
    case 502:
    case 503:
      throw new AiServiceError(
        'The AI service is temporarily unavailable. Please try again shortly.',
        'API_ERROR',
        true,
      );

    default:
      throw new AiServiceError(
        `Request failed (${status}). Please try again.`,
        'API_ERROR',
        true,
      );
  }
}
