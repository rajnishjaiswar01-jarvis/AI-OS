import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { execSync } from 'node:child_process'

// ─── Build Metadata ──────────────────────────────────────────────────

function getGitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

// ─── Dev API Plugin ──────────────────────────────────────────────────
// Handles /api/ai/chat during local development so the Vite dev server
// is the only process needed (single terminal). In production, Vercel
// deploys api/ai/chat.ts as a serverless function instead.

function devApiPlugin(): Plugin {
  return {
    name: 'ai-os-dev-api',
    configureServer(server) {
      // Load ALL env vars from .env (including non-VITE_ ones)
      const env = loadEnv('development', process.cwd(), '');

      server.middlewares.use('/api/ai/chat', async (req, res, _next) => {
        // Only POST allowed
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed.', code: 'API_ERROR' }));
          return;
        }

        // Parse request body (handle malformed JSON safely)
        let body: unknown;
        try {
          let rawBody = '';
          for await (const chunk of req) rawBody += chunk;
          body = JSON.parse(rawBody);
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Malformed request body.', code: 'API_ERROR' }));
          return;
        }

        // Call the shared handler
        try {
          const { processChatRequest } = await import('./api/ai/chat.js');
          const result = await processChatRequest(
            body as { messages?: Array<{ role: string; content: string }>; systemPrompt?: string },
            {
              GEMINI_API_KEY: env.GEMINI_API_KEY,
              GEMINI_MODEL: env.GEMINI_MODEL,
            },
          );

          res.statusCode = result.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result.body));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: 'Internal server error.',
            code: 'API_ERROR',
          }));
        }
      });
    },
  };
}

// ─── Vite Config ─────────────────────────────────────────────────────

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    devApiPlugin(),
  ],
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __BUILD_HASH__: JSON.stringify(getGitHash()),
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@features': path.resolve(__dirname, './src/features'),
      '@ai': path.resolve(__dirname, './src/ai'),
      '@shell': path.resolve(__dirname, './src/shell'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@': path.resolve(__dirname, './src'),
    },
  },
})

