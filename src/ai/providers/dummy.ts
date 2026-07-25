/**
 * AI OS — Dummy AI Provider
 *
 * Returns canned responses for testing and offline development.
 * Validates that the provider interface and registry work correctly
 * without requiring any external API keys or network access.
 */

import type { AiProvider, AiMessage, AiResponse, GenerateOptions } from './types';

// ─── Canned Responses ────────────────────────────────────────────────

const RESPONSES: Record<string, string> = {
  hello: 'Hello! I\'m the AI OS dummy provider. I return pre-configured responses for testing.',
  help: 'Available test commands: "hello", "help", "version". Anything else gets a default response.',
  version: 'Dummy Provider v1.0.0 — Built for AI OS Sprint 0B testing.',
};

const DEFAULT_RESPONSE = 'This is a dummy response. The dummy provider is working correctly.';

// ─── Provider Implementation ─────────────────────────────────────────

export const dummyProvider: AiProvider = {
  id: 'dummy',
  name: 'Dummy Provider',

  async generate(messages: AiMessage[], options?: GenerateOptions): Promise<AiResponse> {
    // Respect cancellation
    if (options?.signal?.aborted) {
      throw new Error('Request was cancelled.');
    }

    // Get the last user message
    const lastUserMessage = messages
      .filter((m) => m.role === 'user')
      .pop();

    const userText = lastUserMessage?.content.toLowerCase().trim() ?? '';

    // Look up canned response or use default
    const content = RESPONSES[userText] ?? DEFAULT_RESPONSE;

    // Simulate realistic usage metrics
    const inputTokens = messages.reduce((sum, m) => sum + m.content.length, 0);
    const outputTokens = content.length;

    return {
      content,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
    };
  },

  isConfigured(): boolean {
    // Dummy provider is always configured — no API key needed
    return true;
  },
};
