/**
 * AI OS — CodeBlock Component
 *
 * Reusable, theme-aware code block with syntax highlighting, copy button,
 * and language badge. Designed for use across AI OS applications:
 * Chat, Terminal, Notes, Documentation Viewer, File Preview, etc.
 *
 * Theme is read from the centralised Zustand appStore — no DOM queries.
 */

import { useState, type ReactNode } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAppStore } from '../stores/appStore';

// ─── Language Alias Mapping ──────────────────────────────────────────

/** Resolves common language aliases to their canonical Prism identifier. */
const LANGUAGE_ALIASES: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  md: 'markdown',
  yml: 'yaml',
};

/** User-friendly display names for language badges. */
const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  bash: 'Bash',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  markdown: 'Markdown',
  yaml: 'YAML',
  sql: 'SQL',
  rust: 'Rust',
  go: 'Go',
  java: 'Java',
  csharp: 'C#',
  cpp: 'C++',
  c: 'C',
  ruby: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  dart: 'Dart',
  lua: 'Lua',
  r: 'R',
  plaintext: 'Plain Text',
  text: 'Plain Text',
};

/**
 * Resolves a raw language string (from a fenced code block) into a
 * canonical Prism language identifier.
 */
function resolveLanguage(raw: string | undefined): string {
  if (!raw) return '';
  const lower = raw.toLowerCase();
  return LANGUAGE_ALIASES[lower] ?? lower;
}

/** Returns a user-friendly display name for a resolved language. */
function getDisplayName(resolved: string): string {
  if (!resolved) return '';
  return LANGUAGE_DISPLAY_NAMES[resolved] ?? resolved;
}

// ─── Copy Button ─────────────────────────────────────────────────────

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: fail silently
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        flex items-center gap-1 px-2 py-1 rounded-md text-[11px]
        transition-all duration-200 cursor-pointer
        ${copied
          ? 'bg-green-500/20 text-green-400'
          : 'bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
        }
        ${className}
      `}
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

// ─── CodeBlock Component ─────────────────────────────────────────────

export interface CodeBlockProps {
  /** The raw code string to display. */
  code: string;
  /** Language identifier (raw alias or canonical). Resolved automatically. */
  language?: string;
  /** Render as inline code instead of a fenced block. */
  inline?: boolean;
  /** Show the copy button. Defaults to `true`. */
  showCopyButton?: boolean;
}

/**
 * Reusable code block component for AI OS.
 *
 * - Fenced blocks: syntax-highlighted with language badge, copy button,
 *   and dark/light theme support via the Zustand appStore.
 * - Inline code: styled monospace span.
 *
 * @example
 * ```tsx
 * <CodeBlock code="const x = 1;" language="ts" />
 * <CodeBlock code="pip install flask" language="bash" showCopyButton={false} />
 * <CodeBlock code="variable" inline />
 * ```
 */
export default function CodeBlock({
  code,
  language,
  inline = false,
  showCopyButton = true,
}: CodeBlockProps) {
  const theme = useAppStore((s) => s.theme);
  const resolvedLang = resolveLanguage(language);
  const displayName = getDisplayName(resolvedLang);

  // ── Inline code ────────────────────────────────────────────────────
  if (inline) {
    return (
      <code className="px-1.5 py-0.5 rounded-md bg-white/10 text-[var(--color-primary-light)] text-[0.85em] font-mono">
        {code}
      </code>
    );
  }

  // ── Fenced code block ──────────────────────────────────────────────
  const syntaxTheme = theme === 'light' ? oneLight : oneDark;

  return (
    <div className="code-block-wrapper group relative my-3 rounded-lg overflow-hidden border border-[var(--color-border)]">
      {/* Header — language badge + copy button */}
      {(displayName || showCopyButton) && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-[var(--color-border)]">
          {displayName ? (
            <span className="text-[11px] font-mono text-[var(--color-text-muted)] tracking-wider">
              {displayName}
            </span>
          ) : (
            <span />
          )}
          {showCopyButton && <CopyButton text={code} />}
        </div>
      )}

      {/* Syntax-highlighted code */}
      <SyntaxHighlighter
        style={syntaxTheme}
        language={resolvedLang || undefined}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: theme === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.3)',
          fontSize: '0.8rem',
          lineHeight: '1.6',
        }}
        codeTagProps={{
          style: {
            fontFamily: "'JetBrains Mono', monospace",
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// ─── Markdown Integration Helper ─────────────────────────────────────

/**
 * Adapter for `react-markdown`'s `code` component mapping.
 *
 * Detects fenced vs inline code from the `className` prop and delegates
 * to the CodeBlock component.
 *
 * @example
 * ```tsx
 * <ReactMarkdown components={{ code: MarkdownCodeAdapter }}>
 *   {content}
 * </ReactMarkdown>
 * ```
 */
export function MarkdownCodeAdapter({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');

  if (!match) {
    // Inline code — no language class
    return <CodeBlock code={codeString} inline />;
  }

  // Fenced code block
  return <CodeBlock code={codeString} language={match[1]} />;
}
