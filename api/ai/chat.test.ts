/**
 * AI OS — Gemini Chat API Route Tests
 *
 * Tests for the processChatRequest() server-side handler.
 * All Gemini API calls are mocked via fetch stubs.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processChatRequest } from './chat.js';

// ─── Helpers ─────────────────────────────────────────────────────────

const VALID_ENV = {
  GEMINI_API_KEY: 'test-server-key-xxx',
  GEMINI_MODEL: 'gemini-3.8-flash',
};

const VALID_BODY = {
  messages: [{ role: 'user', content: 'Hello' }],
};

function makeGeminiResponse(
  content: string,
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  },
) {
  return {
    choices: [{ message: { role: 'assistant', content } }],
    usage: usage ?? {
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
    },
  };
}

function mockFetchSuccess(body: object): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    }),
  );
}

function mockFetchHttpError(status: number): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: () => Promise.resolve({ error: { message: 'Error' } }),
    }),
  );
}

function mockFetchNetworkError(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockRejectedValue(new TypeError('fetch failed')),
  );
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('processChatRequest (Gemini API route)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ─── Config Validation ──────────────────────────────────────────

  describe('server config validation', () => {
    it('returns CONFIG_ERROR when GEMINI_API_KEY is missing', async () => {
      const result = await processChatRequest(VALID_BODY, {
        GEMINI_API_KEY: undefined,
        GEMINI_MODEL: 'gemini-3.8-flash',
      });

      expect(result.status).toBe(500);
      expect(result.body.code).toBe('CONFIG_ERROR');
    });

    it('returns CONFIG_ERROR when GEMINI_API_KEY is empty string', async () => {
      const result = await processChatRequest(VALID_BODY, {
        GEMINI_API_KEY: '   ',
        GEMINI_MODEL: 'gemini-3.8-flash',
      });

      expect(result.status).toBe(500);
      expect(result.body.code).toBe('CONFIG_ERROR');
    });
  });

  // ─── Request Validation ─────────────────────────────────────────

  describe('request validation', () => {
    it('returns API_ERROR when messages is missing', async () => {
      const result = await processChatRequest(
        {} as { messages: undefined },
        VALID_ENV,
      );

      expect(result.status).toBe(400);
      expect(result.body.code).toBe('API_ERROR');
    });

    it('returns API_ERROR when messages is not an array', async () => {
      const result = await processChatRequest(
        { messages: 'not an array' } as unknown as {
          messages: Array<{ role: string; content: string }>;
        },
        VALID_ENV,
      );

      expect(result.status).toBe(400);
      expect(result.body.code).toBe('API_ERROR');
    });

    it('returns API_ERROR when messages is empty array', async () => {
      const result = await processChatRequest(
        { messages: [] },
        VALID_ENV,
      );

      expect(result.status).toBe(400);
      expect(result.body.code).toBe('API_ERROR');
    });
  });

  // ─── Successful Response ────────────────────────────────────────

  describe('successful response', () => {
    it('returns content and usage from Gemini', async () => {
      mockFetchSuccess(
        makeGeminiResponse('Hello from Gemini!', {
          prompt_tokens: 50,
          completion_tokens: 100,
          total_tokens: 150,
        }),
      );

      const result = await processChatRequest(VALID_BODY, VALID_ENV);

      expect(result.status).toBe(200);
      expect(result.body.content).toBe('Hello from Gemini!');
      expect(result.body.usage).toEqual({
        inputTokens: 50,
        outputTokens: 100,
        totalTokens: 150,
      });
    });

    it('trims whitespace from response content', async () => {
      mockFetchSuccess(makeGeminiResponse('  Trimmed!  '));

      const result = await processChatRequest(VALID_BODY, VALID_ENV);

      expect(result.body.content).toBe('Trimmed!');
    });

    it('defaults token usage to 0 when not provided', async () => {
      mockFetchSuccess({
        choices: [{ message: { role: 'assistant', content: 'Hi' } }],
      });

      const result = await processChatRequest(VALID_BODY, VALID_ENV);

      expect(result.status).toBe(200);
      expect(result.body.usage).toEqual({
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      });
    });
  });

  // ─── System Prompt ──────────────────────────────────────────────

  describe('system prompt handling', () => {
    it('uses default system prompt when none provided', async () => {
      mockFetchSuccess(makeGeminiResponse('OK'));

      await processChatRequest(VALID_BODY, VALID_ENV);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);

      expect(body.messages[0].role).toBe('system');
      expect(body.messages[0].content).toContain('AI OS');
    });

    it('uses custom system prompt when provided', async () => {
      mockFetchSuccess(makeGeminiResponse('OK'));

      await processChatRequest(
        { ...VALID_BODY, systemPrompt: 'Custom prompt' },
        VALID_ENV,
      );

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);

      expect(body.messages[0]).toEqual({
        role: 'system',
        content: 'Custom prompt',
      });
    });

    it('filters out system messages from client messages', async () => {
      mockFetchSuccess(makeGeminiResponse('OK'));

      await processChatRequest(
        {
          messages: [
            { role: 'system', content: 'Should be filtered' },
            { role: 'user', content: 'Hello' },
          ],
        },
        VALID_ENV,
      );

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);

      // Default system prompt + user message only
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[0].content).toContain('AI OS');
      expect(body.messages[1].role).toBe('user');
    });
  });

  // ─── Model Configuration ───────────────────────────────────────

  describe('model configuration', () => {
    it('uses GEMINI_MODEL from env', async () => {
      mockFetchSuccess(makeGeminiResponse('OK'));

      await processChatRequest(VALID_BODY, {
        ...VALID_ENV,
        GEMINI_MODEL: 'gemini-3.5-flash',
      });

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);

      expect(body.model).toBe('gemini-3.5-flash');
    });

    it('defaults to gemini-3.8-flash when GEMINI_MODEL is not set', async () => {
      mockFetchSuccess(makeGeminiResponse('OK'));

      await processChatRequest(VALID_BODY, {
        GEMINI_API_KEY: 'test-key',
        GEMINI_MODEL: undefined,
      });

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]!.body as string);

      expect(body.model).toBe('gemini-3.8-flash');
    });
  });

  // ─── Gemini HTTP Error Mapping ──────────────────────────────────

  describe('Gemini HTTP error mapping', () => {
    it('maps 401 to AUTH_ERROR', async () => {
      mockFetchHttpError(401);

      const result = await processChatRequest(VALID_BODY, VALID_ENV);

      expect(result.status).toBe(401);
      expect(result.body.code).toBe('AUTH_ERROR');
    });

    it('maps 403 to AUTH_ERROR', async () => {
      mockFetchHttpError(403);

      const result = await processChatRequest(VALID_BODY, VALID_ENV);

      expect(result.status).toBe(403);
      expect(result.body.code).toBe('AUTH_ERROR');
    });

    it('maps 429 to RATE_LIMIT with retryable', async () => {
      mockFetchHttpError(429);

      const result = await processChatRequest(VALID_BODY, VALID_ENV);

      expect(result.status).toBe(429);
      expect(result.body.code).toBe('RATE_LIMIT');
      expect(result.body.retryable).toBe(true);
    });

    it('maps 500 to API_ERROR with retryable', async () => {
      mockFetchHttpError(500);

      const result = await processChatRequest(VALID_BODY, VALID_ENV);

      expect(result.status).toBe(502);
      expect(result.body.code).toBe('API_ERROR');
      expect(result.body.retryable).toBe(true);
    });

    it('maps 503 to API_ERROR with retryable', async () => {
      mockFetchHttpError(503);

      const result = await processChatRequest(VALID_BODY, VALID_ENV);

      expect(result.status).toBe(502);
      expect(result.body.code).toBe('API_ERROR');
      expect(result.body.retryable).toBe(true);
    });

    it('maps 400 to API_ERROR', async () => {
      mockFetchHttpError(400);

      const result = await processChatRequest(VALID_BODY, VALID_ENV);

      expect(result.status).toBe(400);
      expect(result.body.code).toBe('API_ERROR');
    });

    it('maps 404 to API_ERROR (model not found)', async () => {
      mockFetchHttpError(404);

      const result = await processChatRequest(VALID_BODY, VALID_ENV);

      expect(result.status).toBe(404);
      expect(result.body.code).toBe('API_ERROR');
    });
  });

  // ─── Empty / Malformed Responses ────────────────────────────────

  describe('empty and malformed responses', () => {
    it('returns EMPTY_RESPONSE with 502 for empty content', async () => {
      mockFetchSuccess(makeGeminiResponse(''));

      const result = await processChatRequest(VALID_BODY, VALID_ENV);

      expect(result.status).toBe(502);
      expect(result.body.code).toBe('EMPTY_RESPONSE');
      expect(result.body.retryable).toBe(true);
    });

    it('returns EMPTY_RESPONSE with 502 for empty choices', async () => {
      mockFetchSuccess({ choices: [] });

      const result = await processChatRequest(VALID_BODY, VALID_ENV);

      expect(result.status).toBe(502);
      expect(result.body.code).toBe('EMPTY_RESPONSE');
    });

    it('returns API_ERROR with 502 for malformed JSON from Gemini', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.reject(new SyntaxError('Invalid JSON')),
        }),
      );

      const result = await processChatRequest(VALID_BODY, VALID_ENV);

      expect(result.status).toBe(502);
      expect(result.body.code).toBe('API_ERROR');
      expect(result.body.retryable).toBe(true);
    });
  });

  // ─── Network Errors ─────────────────────────────────────────────

  describe('network errors', () => {
    it('returns NETWORK_ERROR with 502 on fetch failure', async () => {
      mockFetchNetworkError();

      const result = await processChatRequest(VALID_BODY, VALID_ENV);

      expect(result.status).toBe(502);
      expect(result.body.code).toBe('NETWORK_ERROR');
      expect(result.body.retryable).toBe(true);
    });
  });

  // ─── Security ───────────────────────────────────────────────────

  describe('security', () => {
    it('never includes the API key in any response body', async () => {
      // Test across all error scenarios
      const testKey = 'test-server-key-xxx';

      // Successful response
      mockFetchSuccess(makeGeminiResponse('Hello!'));
      const successResult = await processChatRequest(VALID_BODY, {
        GEMINI_API_KEY: testKey,
        GEMINI_MODEL: 'gemini-3.8-flash',
      });
      expect(JSON.stringify(successResult.body)).not.toContain(testKey);

      // Error response
      mockFetchHttpError(401);
      const errorResult = await processChatRequest(VALID_BODY, {
        GEMINI_API_KEY: testKey,
        GEMINI_MODEL: 'gemini-3.8-flash',
      });
      expect(JSON.stringify(errorResult.body)).not.toContain(testKey);

      // Config error (missing key)
      const configResult = await processChatRequest(VALID_BODY, {
        GEMINI_API_KEY: undefined,
      });
      expect(JSON.stringify(configResult.body)).not.toContain(testKey);
    });

    it('sends the API key to Gemini via Authorization header', async () => {
      mockFetchSuccess(makeGeminiResponse('OK'));

      await processChatRequest(VALID_BODY, VALID_ENV);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = callArgs[1]!.headers as Record<string, string>;

      expect(headers['Authorization']).toBe(
        `Bearer ${VALID_ENV.GEMINI_API_KEY}`,
      );
    });

    it('sends request to the correct Gemini URL', async () => {
      mockFetchSuccess(makeGeminiResponse('OK'));

      await processChatRequest(VALID_BODY, VALID_ENV);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      expect(callArgs[0]).toBe(
        'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      );
    });
  });
});
