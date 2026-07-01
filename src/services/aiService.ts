/**
 * AI OS — AI Service
 *
 * Reusable service for all AI interactions. Every feature (Chat, Voice,
 * File Analysis, Code Generation, Automation) calls generateResponse().
 *
 * All Gemini implementation details are hidden behind this module.
 * The rest of the application never communicates directly with Gemini.
 *
 * ⚠️ TEMPORARY ARCHITECTURE:
 * Currently calls Gemini directly from the browser. Will be migrated
 * to a secure backend/serverless proxy in a future version.
 */

import { GoogleGenAI } from '@google/genai';
import { AI_CONFIG, DEFAULT_SYSTEM_PROMPT, validateAiConfig } from '../config/ai';

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

// ─── Gemini Client (lazy singleton) ──────────────────────────────────

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: AI_CONFIG.apiKey! });
  }
  return _client;
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

  // Convert conversation history to Gemini Content format
  // Filter out system messages (handled via systemInstruction)
  // Gemini uses 'user' and 'model' roles (not 'assistant')
  const geminiContents = messages
    .filter((msg) => msg.role !== 'system')
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: msg.content }],
    }));

  // Set up abort handling
  const abortPromise = options.signal
    ? new Promise<never>((_, reject) => {
        const onAbort = () => {
          reject(new AiServiceError('Request was cancelled.', 'CANCELLED'));
        };
        options.signal!.addEventListener('abort', onAbort, { once: true });
      })
    : null;

  try {
    const client = getClient();



    const requestPromise = client.models.generateContent({
      model: AI_CONFIG.model!,
      contents: geminiContents,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    // Race between the API call and abort signal
    const response = abortPromise
      ? await Promise.race([requestPromise, abortPromise])
      : await requestPromise;

    // Extract content
    const content = response.text?.trim();

    if (!content) {
      throw new AiServiceError(
        'The AI returned an empty response. Please try again.',
        'EMPTY_RESPONSE',
        true,
      );
    }

    // Extract usage (default to 0 if not provided)
    const usageMetadata = response.usageMetadata;
    const usage: AiUsage = {
      inputTokens: usageMetadata?.promptTokenCount ?? 0,
      outputTokens: usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens: usageMetadata?.totalTokenCount ?? 0,
    };

    return { content, usage };
  } catch (error) {
    // Re-throw our own errors
    if (error instanceof AiServiceError) {
      throw error;
    }

    // Handle specific Gemini API errors
    const err = error as Error & { status?: number; message?: string };

    // Network errors
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
      throw new AiServiceError(
        'Unable to connect. Please check your internet connection and try again.',
        'NETWORK_ERROR',
        true,
      );
    }

    // Map HTTP status codes from Gemini error responses
    const status = err.status;
    if (status) {
      handleHttpError(status);
    }

    // Check error message for common patterns
    const message = err.message?.toLowerCase() ?? '';

    if (message.includes('api key') || message.includes('unauthorized') || message.includes('permission')) {
      throw new AiServiceError(
        'Invalid API key. Please check your VITE_GEMINI_API_KEY in .env.',
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
        'Invalid API key. Please check your VITE_GEMINI_API_KEY in .env.',
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
