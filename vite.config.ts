import { defineConfig } from 'vite'
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

// ─── Vite Config ─────────────────────────────────────────────────────

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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
