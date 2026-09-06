/**
 * AI OS — AI Service Tests
 *
 * Tests for the migrated AI service using OpenAI-compatible API
 * via Experiential Labs (GPT Astra). All API calls are mocked.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateResponse, AiServiceError } from './aiService';
import type { AiMessage } from './aiService';

// ─── Mock Configuration ──────────────────────────────────────────────

// Mock the config module so we control API key/model/baseUrl
vi.mock('@ai/config', () => ({
  AI_CONFIG: {
    apiKey: 'test-api-key-12345',
    baseUrl: 'https://api.experientiallabs.ai/v1',
    model: 'gpt-6-astra',
  },
  DEFAULT_SYSTEM_PROMPT: 'You are a test AI assistant.',
  isAiConfigured: () => true,
  validateAiConfig: vi.fn(),
}));

// ─── Helpers ─────────────────────────────────────────────────────────

function mockFetchResponse(body: object, status = 200): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }));
}

function mockFetchError(error: Error): void {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
}

function makeOpenAiResponse(content: string, usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }) {
  return {
    choices: [{ message: { role: 'assistant', content } }],
    usage: usage ?? { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('aiService (GPT Astra via Experiential Labs)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ─── Request Construction ────────────────────────────────────────

  describe('request construction', () => {
    it('sends request to the correct base URL', async () => {
      mockFetchResponse(makeOpenAiResponse('Hello!'));

      await generateResponse([{ role: 'user', content: 'Hi' }]);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.experientiallabs.ai/v1/chat/completions',
        expect.any(Object),
      );
    });

    it('sends the correct model in the request body', async () => {
      mockFetchResponse(makeOpenAiResponse('Hello!'));

      await generateResponse([{ role: 'user', content: 'Hi' }]);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);
      expect(body.model).toBe('gpt-6-astra');
    });

    it('sends Bearer authorization header with the API key', async () => {
      mockFetchResponse(makeOpenAiResponse('Hello!'));

      await generateResponse([{ role: 'user', content: 'Hi' }]);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = callArgs[1]!.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer test-api-key-12345');
    });

    it('sends Content-Type application/json', async () => {
      mockFetchResponse(makeOpenAiResponse('Hello!'));

      await generateResponse([{ role: 'user', content: 'Hi' }]);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = callArgs[1]!.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('uses POST method', async () => {
      mockFetchResponse(makeOpenAiResponse('Hello!'));

      await generateResponse([{ role: 'user', content: 'Hi' }]);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      expect(callArgs[1]!.method).toBe('POST');
    });

    it('does not send Gemini-specific parameters', async () => {
      mockFetchResponse(makeOpenAiResponse('Hello!'));

      await generateResponse([{ role: 'user', content: 'Hi' }]);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);

      // No Gemini-specific fields
      expect(body).not.toHaveProperty('contents');
      expect(body).not.toHaveProperty('config');
      expect(body).not.toHaveProperty('systemInstruction');
      expect(body).not.toHaveProperty('generationConfig');
      expect(body).not.toHaveProperty('safetySettings');

      // Only expected fields
      expect(Object.keys(body)).toEqual(['model', 'messages']);
    });
  });

  // ─── System Prompt Handling ──────────────────────────────────────

  describe('system prompt handling', () => {
    it('includes the default system prompt as the first message', async () => {
      mockFetchResponse(makeOpenAiResponse('Hello!'));

      await generateResponse([{ role: 'user', content: 'Hi' }]);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);

      expect(body.messages[0]).toEqual({
        role: 'system',
        content: 'You are a test AI assistant.',
      });
    });

    it('uses a custom system prompt when provided', async () => {
      mockFetchResponse(makeOpenAiResponse('Hello!'));

      await generateResponse(
        [{ role: 'user', content: 'Hi' }],
        { systemPrompt: 'Custom system prompt' },
      );

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);

      expect(body.messages[0]).toEqual({
        role: 'system',
        content: 'Custom system prompt',
      });
    });
  });

  // ─── Conversation History / Message Conversion ───────────────────

  describe('message conversion', () => {
    it('converts conversation history to OpenAI message format', async () => {
      mockFetchResponse(makeOpenAiResponse('Sure!'));

      const messages: AiMessage[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'Help me' },
      ];

      await generateResponse(messages);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);

      // System prompt first, then conversation
      expect(body.messages).toHaveLength(4); // 1 system + 3 conversation
      expect(body.messages[1]).toEqual({ role: 'user', content: 'Hello' });
      expect(body.messages[2]).toEqual({ role: 'assistant', content: 'Hi there!' });
      expect(body.messages[3]).toEqual({ role: 'user', content: 'Help me' });
    });

    it('uses "assistant" role (not "model" like Gemini)', async () => {
      mockFetchResponse(makeOpenAiResponse('Response'));

      const messages: AiMessage[] = [
        { role: 'user', content: 'Q' },
        { role: 'assistant', content: 'A' },
      ];

      await generateResponse(messages);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);

      const roles = body.messages.map((m: { role: string }) => m.role);
      expect(roles).not.toContain('model');
      expect(roles).toContain('assistant');
    });

    it('filters out system messages from conversation history', async () => {
      mockFetchResponse(makeOpenAiResponse('OK'));

      const messages: AiMessage[] = [
        { role: 'system', content: 'This should be filtered' },
        { role: 'user', content: 'Hello' },
      ];

      await generateResponse(messages);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);

      // Only the default system prompt + user message
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[0].content).toBe('You are a test AI assistant.');
      expect(body.messages[1].role).toBe('user');
    });
  });

  // ─── Successful Response Parsing ─────────────────────────────────

  describe('response parsing', () => {
    it('returns the response content', async () => {
      mockFetchResponse(makeOpenAiResponse('Hello from Astra!'));

      const result = await generateResponse([{ role: 'user', content: 'Hi' }]);

      expect(result.content).toBe('Hello from Astra!');
    });

    it('trims whitespace from response content', async () => {
      mockFetchResponse(makeOpenAiResponse('  Hello!  '));

      const result = await generateResponse([{ role: 'user', content: 'Hi' }]);

      expect(result.content).toBe('Hello!');
    });

    it('parses token usage from the response', async () => {
      mockFetchResponse(makeOpenAiResponse('OK', {
        prompt_tokens: 50,
        completion_tokens: 100,
        total_tokens: 150,
      }));

      const result = await generateResponse([{ role: 'user', content: 'Hi' }]);

      expect(result.usage).toEqual({
        inputTokens: 50,
        outputTokens: 100,
        totalTokens: 150,
      });
    });

    it('defaults token usage to 0 when not provided', async () => {
      mockFetchResponse({ choices: [{ message: { role: 'assistant', content: 'Hi' } }] });

      const result = await generateResponse([{ role: 'user', content: 'Hi' }]);

      expect(result.usage).toEqual({
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      });
    });
  });

  // ─── Empty Response Handling ─────────────────────────────────────

  describe('empty response handling', () => {
    it('throws EMPTY_RESPONSE for empty content', async () => {
      mockFetchResponse(makeOpenAiResponse(''));

      await expect(
        generateResponse([{ role: 'user', content: 'Hi' }])
      ).rejects.toThrow(AiServiceError);

      try {
        await generateResponse([{ role: 'user', content: 'Hi' }]);
      } catch (err) {
        expect((err as AiServiceError).code).toBe('EMPTY_RESPONSE');
        expect((err as AiServiceError).retryable).toBe(true);
      }
    });

    it('throws EMPTY_RESPONSE when choices array is empty', async () => {
      mockFetchResponse({ choices: [] });

      await expect(
        generateResponse([{ role: 'user', content: 'Hi' }])
      ).rejects.toThrow(AiServiceError);
    });
  });

  // ─── HTTP Error Handling ─────────────────────────────────────────

  describe('HTTP error handling', () => {
    it('throws AUTH_ERROR for 401', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Unauthorized' } }),
      }));

      try {
        await generateResponse([{ role: 'user', content: 'Hi' }]);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AiServiceError);
        expect((err as AiServiceError).code).toBe('AUTH_ERROR');
      }
    });

    it('throws AUTH_ERROR for 403', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({}),
      }));

      try {
        await generateResponse([{ role: 'user', content: 'Hi' }]);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as AiServiceError).code).toBe('AUTH_ERROR');
      }
    });

    it('throws RATE_LIMIT for 429', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({}),
      }));

      try {
        await generateResponse([{ role: 'user', content: 'Hi' }]);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as AiServiceError).code).toBe('RATE_LIMIT');
        expect((err as AiServiceError).retryable).toBe(true);
      }
    });

    it('throws API_ERROR for 500', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      }));

      try {
        await generateResponse([{ role: 'user', content: 'Hi' }]);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as AiServiceError).code).toBe('API_ERROR');
        expect((err as AiServiceError).retryable).toBe(true);
      }
    });

    it('throws API_ERROR for 400', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({}),
      }));

      try {
        await generateResponse([{ role: 'user', content: 'Hi' }]);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as AiServiceError).code).toBe('API_ERROR');
      }
    });
  });

  // ─── Network Error Handling ──────────────────────────────────────

  describe('network error handling', () => {
    it('throws NETWORK_ERROR for fetch failures', async () => {
      const fetchError = new TypeError('Failed to fetch');
      mockFetchError(fetchError);

      try {
        await generateResponse([{ role: 'user', content: 'Hi' }]);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AiServiceError);
        expect((err as AiServiceError).code).toBe('NETWORK_ERROR');
        expect((err as AiServiceError).retryable).toBe(true);
      }
    });
  });

  // ─── Abort / Cancellation ────────────────────────────────────────

  describe('abort and cancellation', () => {
    it('throws CANCELLED for pre-aborted signal', async () => {
      const controller = new AbortController();
      controller.abort();

      try {
        await generateResponse(
          [{ role: 'user', content: 'Hi' }],
          { signal: controller.signal },
        );
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AiServiceError);
        expect((err as AiServiceError).code).toBe('CANCELLED');
      }
    });

    it('throws CANCELLED when fetch is aborted mid-request', async () => {
      const abortError = new DOMException('The operation was aborted.', 'AbortError');
      mockFetchError(abortError);

      await expect(
        generateResponse(
          [{ role: 'user', content: 'Hi' }],
          { signal: new AbortController().signal },
        ),
      ).rejects.toThrow('cancelled');
    });

    it('passes the abort signal to fetch', async () => {
      mockFetchResponse(makeOpenAiResponse('Hello!'));

      const controller = new AbortController();
      await generateResponse(
        [{ role: 'user', content: 'Hi' }],
        { signal: controller.signal },
      );

      const callArgs = vi.mocked(fetch).mock.calls[0];
      expect(callArgs[1]!.signal).toBe(controller.signal);
    });
  });

  // ─── Config Validation ───────────────────────────────────────────

  describe('config validation', () => {
    it('throws CONFIG_ERROR when validateAiConfig fails', async () => {
      const { validateAiConfig } = await import('@ai/config');
      vi.mocked(validateAiConfig).mockImplementation(() => {
        throw new Error('API key not configured');
      });

      try {
        await generateResponse([{ role: 'user', content: 'Hi' }]);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AiServiceError);
        expect((err as AiServiceError).code).toBe('CONFIG_ERROR');
      }
    });
  });
});
