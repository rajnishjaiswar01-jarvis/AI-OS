/**
 * AI OS — Markdown Renderer
 *
 * Renders AI responses as rich markdown with syntax-highlighted code blocks,
 * copy buttons, and styling that matches the glassmorphism design system.
 *
 * Code blocks are delegated to the shared CodeBlock component
 * (`src/components/CodeBlock.tsx`) for reusability across AI OS apps.
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MarkdownCodeAdapter } from '../../components/CodeBlock';

// ─── Markdown Renderer ───────────────────────────────────────────────

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks and inline code — shared CodeBlock component
          code: MarkdownCodeAdapter,

          // Headings
          h1({ children }) {
            return <h1 className="text-lg font-bold mt-4 mb-2 text-[var(--color-text)]">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-base font-semibold mt-3 mb-1.5 text-[var(--color-text)]">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-sm font-semibold mt-2.5 mb-1 text-[var(--color-text)]">{children}</h3>;
          },

          // Paragraph
          p({ children }) {
            return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
          },

          // Lists
          ul({ children }) {
            return <ul className="list-disc list-inside mb-2 space-y-0.5 pl-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside mb-2 space-y-0.5 pl-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },

          // Links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-primary-light)] hover:underline"
              >
                {children}
              </a>
            );
          },

          // Blockquote
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-[var(--color-primary)] pl-3 my-2 text-[var(--color-text-secondary)] italic">
                {children}
              </blockquote>
            );
          },

          // Horizontal rule
          hr() {
            return <hr className="my-3 border-[var(--color-border)]" />;
          },

          // Table
          table({ children }) {
            return (
              <div className="overflow-x-auto my-2 rounded-lg border border-[var(--color-border)]">
                <table className="w-full text-sm">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-white/5">{children}</thead>;
          },
          th({ children }) {
            return <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3 py-1.5 border-b border-[var(--color-border)]">{children}</td>;
          },

          // Strong / Emphasis
          strong({ children }) {
            return <strong className="font-semibold text-[var(--color-text)]">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic">{children}</em>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
