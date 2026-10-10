/**
 * AI OS — Gemini Chat API Route
 *
 * Vercel serverless function that proxies chat requests to Gemini's
 * OpenAI-compatible endpoint. The GEMINI_API_KEY is server-side only —
 * it never reaches the browser.
 *
 * Local development: called by the Vite devApiPlugin() middleware.
 * Production: deployed as a Vercel serverless function at /api/ai/chat.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Constants ───────────────────────────────────────────────────────

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

const DEFAULT_MODEL = 'gemini-3.8-flash';

/**
 * Default system prompt — duplicated from src/ai/config.ts so the
 * server can apply it without depending on client code.
 */
const DEFAULT_SYSTEM_PROMPT = `You are the built-in AI assistant of AI OS — a next-generation web-based operating system.

# Identity

- You are an integrated part of AI OS, not an external chatbot.
- Never describe yourself as any underlying model, provider, or company name unless the user explicitly asks.
- Never expose implementation details, SDK names, or provider information.
- Never repeatedly introduce yourself. Just be helpful.
- If asked who you are, say you are the AI core of AI OS.

# Language Matching

- Detect both the user's language AND their writing script.
- Mirror the user's writing script whenever possible.

Rules:
- If the user writes in English, reply in English.
- If the user writes Hindi using the English alphabet (Hinglish / Roman Hindi), reply in Roman Hindi using the English alphabet.
- Never convert Roman Hindi into Devanagari automatically.
- Use Devanagari only if the user actually writes in Devanagari.
- If the user mixes English and Hindi naturally, reply in the same mixed style.
- For any other language, reply in that same language and script.
- Match the user's tone and writing style.
- Never force a different script than the one used by the user.

Example:
User: "mujhe fullstack sikhna h"
Correct: "Bilkul! Fullstack development sikhna ek bahut acchi skill hai..."
Wrong: "बिल्कुल! फुलस्टैक..."

# Conversation Style

- Friendly, modern, natural, and helpful.
- Technically accurate without being verbose.
- Avoid robotic or overly formal language.
- Vary sentence openings naturally — never start every response the same way.
- Do not repeat greetings or re-introduce yourself across messages.

# Coding Assistance

When helping with programming:
1. Explain the approach briefly.
2. Provide clean, production-quality code.
3. Highlight important implementation details after the code.
- Prefer scalable, maintainable solutions.
- Follow TypeScript best practices when applicable.
- Use fenced code blocks with language identifiers.

# General Rules

- Answer directly. Be concise by default; elaborate only when asked.
- Use Markdown formatting (headings, lists, bold, tables) when it improves clarity.
- Maintain context from the current conversation session.
- Never invent facts, fabricate file paths, URLs, or system information.
- Never claim actions that were not performed.

The user should always feel they are talking to the native AI of their operating system — intelligent, fast, and trustworthy.`;

// ─── Types ───────────────────────────────────────────────────────────

interface ChatRequestBody {
  messages?: Array<{ role: string; content: string }>;
  systemPrompt?: string;
}

interface ProcessResult {
  status: number;
  body: Record<string, unknown>;
}

// ─── Core Logic ──────────────────────────────────────────────────────

/**
 * Process a chat request. Shared by both the Vercel handler and the
 * Vite dev middleware.
 *
 * @param reqBody - The parsed request body from the client
 * @param env    - Server-side environment variables (API key, model)
 */
export async function processChatRequest(
  reqBody: ChatRequestBody,
  env: { GEMINI_API_KEY?: string; GEMINI_MODEL?: string },
): Promise<ProcessResult> {
  // 1. Validate server config
  if (!env.GEMINI_API_KEY?.trim()) {
    return {
      status: 500,
      body: {
        error:
          'Server AI configuration error. GEMINI_API_KEY is not set.',
        code: 'CONFIG_ERROR',
      },
    };
  }

  // 2. Validate request body
  if (!reqBody || !Array.isArray(reqBody.messages)) {
    return {
      status: 400,
      body: {
        error:
          'Invalid request: "messages" must be an array.',
        code: 'API_ERROR',
      },
    };
  }

  if (reqBody.messages.length === 0) {
    return {
      status: 400,
      body: {
        error: 'Invalid request: "messages" must not be empty.',
        code: 'API_ERROR',
      },
    };
  }

  // 3. Build OpenAI-compatible messages array
  const systemPrompt = reqBody.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
  const model = env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

  const openAiMessages = [
    { role: 'system', content: systemPrompt },
    ...reqBody.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content })),
  ];

  // 4. Call Gemini
  let geminiRes: Response;
  try {
    geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GEMINI_API_KEY}`,
      },
      body: JSON.stringify({ model, messages: openAiMessages }),
    });
  } catch {
    return {
      status: 502,
      body: {
        error:
          'Unable to connect to the AI service. Please try again.',
        code: 'NETWORK_ERROR',
        retryable: true,
      },
    };
  }

  // 5. Map Gemini HTTP errors
  if (!geminiRes.ok) {
    // Try to extract the upstream error message for diagnostics
    let upstreamMsg: string | undefined;
    try {
      const errBody: unknown = await geminiRes.json();
      // OpenAI-compat endpoint may return [{error:{…}}] (array) or {error:{…}}
      const errObj = Array.isArray(errBody) ? errBody[0] : errBody;
      upstreamMsg =
        (errObj as Record<string, unknown>)?.error &&
        typeof (errObj as Record<string, unknown>).error === 'object'
          ? ((errObj as Record<string, unknown>).error as Record<string, unknown>)
              ?.message as string | undefined
          : undefined;
    } catch {
      // Ignore — fall through to generic error
    }

    return mapGeminiError(geminiRes.status, upstreamMsg);
  }

  // 6. Parse response
  let data: Record<string, unknown>;
  try {
    data = (await geminiRes.json()) as Record<string, unknown>;
  } catch {
    return {
      status: 502,
      body: {
        error: 'Received malformed response from AI service.',
        code: 'API_ERROR',
        retryable: true,
      },
    };
  }

  // 7. Extract content
  const choices = data.choices as
    | Array<{ message?: { content?: string } }>
    | undefined;
  const content = choices?.[0]?.message?.content?.trim();

  if (!content) {
    return {
      status: 502,
      body: {
        error: 'The AI returned an empty response. Please try again.',
        code: 'EMPTY_RESPONSE',
        retryable: true,
      },
    };
  }

  // 8. Extract usage
  const rawUsage = data.usage as
    | {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      }
    | undefined;

  const usage = {
    inputTokens: rawUsage?.prompt_tokens ?? 0,
    outputTokens: rawUsage?.completion_tokens ?? 0,
    totalTokens: rawUsage?.total_tokens ?? 0,
  };

  return { status: 200, body: { content, usage } };
}

// ─── Error Mapping ───────────────────────────────────────────────────

function mapGeminiError(
  status: number,
  upstreamMsg?: string,
): ProcessResult {
  switch (status) {
    case 400:
      return {
        status: 400,
        body: {
          error:
            upstreamMsg ??
            'Invalid request. Please try rephrasing your message.',
          code: 'API_ERROR',
        },
      };

    case 401:
    case 403:
      return {
        status: status,
        body: {
          error:
            'AI authentication error. Please check server configuration.',
          code: 'AUTH_ERROR',
        },
      };

    case 404:
      return {
        status: 404,
        body: {
          error:
            upstreamMsg ??
            'The requested AI model was not found. Please check server configuration.',
          code: 'API_ERROR',
        },
      };

    case 429:
      return {
        status: 429,
        body: {
          error: 'Rate limit reached. Please wait a moment and try again.',
          code: 'RATE_LIMIT',
          retryable: true,
        },
      };

    case 500:
    case 502:
    case 503:
      return {
        status: 502,
        body: {
          error:
            'The AI service is temporarily unavailable. Please try again shortly.',
          code: 'API_ERROR',
          retryable: true,
        },
      };

    default:
      return {
        status: 502,
        body: {
          error:
            upstreamMsg ??
            `AI service request failed (${status}). Please try again.`,
          code: 'API_ERROR',
          retryable: true,
        },
      };
  }
}

// ─── Vercel Handler ──────────────────────────────────────────────────

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({
      error: 'Method not allowed.',
      code: 'API_ERROR',
    });
    return;
  }

  const result = await processChatRequest(
    req.body as ChatRequestBody,
    {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      GEMINI_MODEL: process.env.GEMINI_MODEL,
    },
  );

  res.status(result.status).json(result.body);
}
