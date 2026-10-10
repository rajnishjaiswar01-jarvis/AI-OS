/**
 * AI OS — AI Service Tests
 *
 * Tests for the AI service using the server proxy architecture.
 * The client calls /api/ai/chat — no API key or external URL in the bundle.
 * All fetch calls to the proxy endpoint are mocked.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateResponse, AiServiceError } from './aiService';
import type { AiMessage } from './aiService';

// ─── Mock Configuration ──────────────────────────────────────────────

// Mock the config module — client only knows the proxy endpoint
vi.mock('@ai/config', () => ({
  AI_CONFIG: {
    endpoint: '/api/ai/chat',
  },
  DEFAULT_SYSTEM_PROMPT: 'You are a test AI assistant.',
  isAiConfigured: () => true,
  validateAiConfig: vi.fn(),
}));

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Mock a successful fetch response from the server proxy.
 * Server returns pre-processed { content, usage }.
 */
function mockProxySuccess(body: object, status = 200): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }));
}

/**
 * Mock an error response from the server proxy.
 * Server returns { error, code, retryable? }.
 */
function mockProxyError(
  status: number,
  body: { error: string; code: string; retryable?: boolean },
): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  }));
}

function mockFetchError(error: Error): void {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
}

function makeProxyResponse(
  content: string,
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number },
) {
  return {
    content,
    usage: usage ?? { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('aiService (Gemini via server proxy)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ─── Request Construction ────────────────────────────────────────

  describe('request construction', () => {
    it('sends request to the /api/ai/chat proxy endpoint', async () => {
      mockProxySuccess(makeProxyResponse('Hello!'));

      await generateResponse([{ role: 'user', content: 'Hi' }]);

      expect(fetch).toHaveBeenCalledWith(
        '/api/ai/chat',
        expect.any(Object),
      );
    });

    it('does not send any authorization header', async () => {
      mockProxySuccess(makeProxyResponse('Hello!'));

      await generateResponse([{ role: 'user', content: 'Hi' }]);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = callArgs[1]!.headers as Record<string, string>;
      expect(headers).not.toHaveProperty('Authorization');
    });

    it('does not include API key in request body', async () => {
      mockProxySuccess(makeProxyResponse('Hello!'));

      await generateResponse([{ role: 'user', content: 'Hi' }]);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);
      expect(JSON.stringify(body)).not.toContain('api_key');
      expect(JSON.stringify(body)).not.toContain('apiKey');
      expect(JSON.stringify(body)).not.toContain('API_KEY');
    });

    it('does not include model in request body (server decides)', async () => {
      mockProxySuccess(makeProxyResponse('Hello!'));

      await generateResponse([{ role: 'user', content: 'Hi' }]);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);
      expect(body).not.toHaveProperty('model');
    });

    it('sends Content-Type application/json', async () => {
      mockProxySuccess(makeProxyResponse('Hello!'));

      await generateResponse([{ role: 'user', content: 'Hi' }]);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = callArgs[1]!.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('uses POST method', async () => {
      mockProxySuccess(makeProxyResponse('Hello!'));

      await generateResponse([{ role: 'user', content: 'Hi' }]);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      expect(callArgs[1]!.method).toBe('POST');
    });

    it('sends messages and systemPrompt in request body', async () => {
      mockProxySuccess(makeProxyResponse('Hello!'));

      await generateResponse([{ role: 'user', content: 'Hi' }]);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);

      expect(body).toHaveProperty('messages');
      expect(body).toHaveProperty('systemPrompt');
      expect(Object.keys(body)).toEqual(['messages', 'systemPrompt']);
    });
  });

  // ─── System Prompt Handling ──────────────────────────────────────

  describe('system prompt handling', () => {
    it('includes the default system prompt in request body', async () => {
      mockProxySuccess(makeProxyResponse('Hello!'));

      await generateResponse([{ role: 'user', content: 'Hi' }]);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);

      expect(body.systemPrompt).toBe('You are a test AI assistant.');
    });

    it('uses a custom system prompt when provided', async () => {
      mockProxySuccess(makeProxyResponse('Hello!'));

      await generateResponse(
        [{ role: 'user', content: 'Hi' }],
        { systemPrompt: 'Custom system prompt' },
      );

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);

      expect(body.systemPrompt).toBe('Custom system prompt');
    });
  });

  // ─── Conversation History / Message Conversion ───────────────────

  describe('message conversion', () => {
    it('converts conversation history to message format', async () => {
      mockProxySuccess(makeProxyResponse('Sure!'));

      const messages: AiMessage[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'Help me' },
      ];

      await generateResponse(messages);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);

      // 3 conversation messages (no system — that's in systemPrompt field)
      expect(body.messages).toHaveLength(3);
      expect(body.messages[0]).toEqual({ role: 'user', content: 'Hello' });
      expect(body.messages[1]).toEqual({ role: 'assistant', content: 'Hi there!' });
      expect(body.messages[2]).toEqual({ role: 'user', content: 'Help me' });
    });

    it('filters out system messages from conversation history', async () => {
      mockProxySuccess(makeProxyResponse('OK'));

      const messages: AiMessage[] = [
        { role: 'system', content: 'This should be filtered' },
        { role: 'user', content: 'Hello' },
      ];

      await generateResponse(messages);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);

      // Only the user message (system messages are filtered, systemPrompt field used instead)
      expect(body.messages).toHaveLength(1);
      expect(body.messages[0].role).toBe('user');
    });
  });

  // ─── Successful Response Parsing ─────────────────────────────────

  describe('response parsing', () => {
    it('returns the response content', async () => {
      mockProxySuccess(makeProxyResponse('Hello from Gemini!'));

      const result = await generateResponse([{ role: 'user', content: 'Hi' }]);

      expect(result.content).toBe('Hello from Gemini!');
    });

    it('parses token usage from the server response', async () => {
      mockProxySuccess(makeProxyResponse('OK', {
        inputTokens: 50,
        outputTokens: 100,
        totalTokens: 150,
      }));

      const result = await generateResponse([{ role: 'user', content: 'Hi' }]);

      expect(result.usage).toEqual({
        inputTokens: 50,
        outputTokens: 100,
        totalTokens: 150,
      });
    });

    it('defaults token usage to 0 when not provided', async () => {
      mockProxySuccess({ content: 'Hi' });

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
      mockProxySuccess({ content: '', usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 } });

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

    it('throws EMPTY_RESPONSE when content is undefined', async () => {
      mockProxySuccess({ usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 } });

      await expect(
        generateResponse([{ role: 'user', content: 'Hi' }])
      ).rejects.toThrow(AiServiceError);
    });
  });

  // ─── Server Error Handling ──────────────────────────────────────

  describe('server error handling', () => {
    it('throws AUTH_ERROR from server 401', async () => {
      mockProxyError(401, {
        error: 'AI authentication error.',
        code: 'AUTH_ERROR',
      });

      try {
        await generateResponse([{ role: 'user', content: 'Hi' }]);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AiServiceError);
        expect((err as AiServiceError).code).toBe('AUTH_ERROR');
      }
    });

    it('throws RATE_LIMIT from server 429', async () => {
      mockProxyError(429, {
        error: 'Rate limit reached.',
        code: 'RATE_LIMIT',
        retryable: true,
      });

      try {
        await generateResponse([{ role: 'user', content: 'Hi' }]);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as AiServiceError).code).toBe('RATE_LIMIT');
        expect((err as AiServiceError).retryable).toBe(true);
      }
    });

    it('throws API_ERROR from server 500', async () => {
      mockProxyError(500, {
        error: 'Server configuration error.',
        code: 'CONFIG_ERROR',
      });

      try {
        await generateResponse([{ role: 'user', content: 'Hi' }]);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AiServiceError);
        expect((err as AiServiceError).code).toBe('CONFIG_ERROR');
      }
    });

    it('throws API_ERROR from server 502', async () => {
      mockProxyError(502, {
        error: 'AI service unavailable.',
        code: 'API_ERROR',
        retryable: true,
      });

      try {
        await generateResponse([{ role: 'user', content: 'Hi' }]);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as AiServiceError).code).toBe('API_ERROR');
        expect((err as AiServiceError).retryable).toBe(true);
      }
    });

    it('uses fallback error values when server response is incomplete', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      }));

      try {
        await generateResponse([{ role: 'user', content: 'Hi' }]);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AiServiceError);
        expect((err as AiServiceError).code).toBe('API_ERROR');
        expect((err as AiServiceError).retryable).toBe(false);
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
      mockProxySuccess(makeProxyResponse('Hello!'));

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
