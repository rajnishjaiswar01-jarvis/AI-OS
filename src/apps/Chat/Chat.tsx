/**
 * AI OS — Chat App
 *
 * Full AI chat with real LLM responses via Gemini.
 * Orchestration lives here (not in the store):
 *   Chat.tsx → aiService.generateResponse() → chatStore (state mutations)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Panel from '../../components/Panel';
import MarkdownRenderer from './MarkdownRenderer';
import { useChatStore } from '../../stores/chatStore';
import { generateResponse, AiServiceError } from '../../services/aiService';
import { isAiConfigured } from '../../config/ai';
import type { ChatMessage } from '../../types';
import type { AiMessage } from '../../services/aiService';

// ─── Helpers ─────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Copy raw text to clipboard */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ─── Copy Response Button ────────────────────────────────────────────

function CopyResponseButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="
        p-1 rounded-md transition-all duration-200 cursor-pointer
        opacity-0 group-hover:opacity-100
        hover:bg-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]
      "
      title={copied ? 'Copied!' : 'Copy response'}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
    </button>
  );
}

// ─── Retry / Regenerate Button ───────────────────────────────────────

function RetryRegenerateButton({ onClick, isRetry = false }: { onClick: () => void; isRetry?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`
        p-1 rounded-md transition-all duration-200 cursor-pointer
        hover:bg-white/10
        ${isRetry
          ? 'text-red-400/80 hover:text-red-400'
          : 'opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
        }
      `}
      title={isRetry ? 'Retry' : 'Regenerate response'}
    >
      {isRetry ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      )}
    </button>
  );
}

// ─── Welcome Screen ──────────────────────────────────────────────────

function WelcomeScreen() {
  const configured = isAiConfigured();

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-sm space-y-4">
        <div className="text-4xl mb-2">✦</div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Welcome to AI OS
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Your intelligent operating system assistant. Ask me anything — I understand
          every language naturally.
        </p>
        {!configured && (
          <div className="glass rounded-xl p-3 text-xs text-yellow-400/90 border border-yellow-400/20">
            <span className="font-medium">⚠ Not configured</span>
            <p className="mt-1 text-[var(--color-text-muted)]">
              Add your Gemini API key to <code className="px-1 py-0.5 rounded bg-white/10 font-mono text-[10px]">.env</code> to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chat Component ──────────────────────────────────────────────────

export default function Chat() {
  const {
    messages,
    isLoading,
    error,
    sessionTokens,
    addMessage,
    setLoading,
    setError,
    setAiStatus,
    addTokenUsage,
    removeLastAssistantMessage,
    clearChat,
    clearError,
  } = useChatStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const userScrolledUpRef = useRef(false);

  // ─── Smart Auto-scroll ───────────────────────────────────────────
  // Only auto-scroll if the user hasn't manually scrolled up.

  const scrollToBottom = useCallback(() => {
    if (!userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Detect manual scroll: if user scrolls up, stop auto-scrolling.
  // Resume auto-scrolling when they scroll back near the bottom.
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 80;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    userScrolledUpRef.current = distanceFromBottom > threshold;
  }, []);

  // ─── Auto-resize textarea ────────────────────────────────────────

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  // ─── Cleanup abort controller on unmount ─────────────────────────

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // ─── Stop Generation ─────────────────────────────────────────────

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setLoading(false);
    setAiStatus('ready');
  }, [setLoading, setAiStatus]);

  // ─── Send Message (orchestration lives here) ─────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Cancel any in-flight request
    abortControllerRef.current?.abort();

    // Create user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    // Update state
    setInput('');
    addMessage(userMessage);
    setLoading(true);
    setAiStatus('thinking');
    clearError();

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Build conversation history for the API
    const conversationHistory: AiMessage[] = [
      ...messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: text },
    ];

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await generateResponse(conversationHistory, {
        signal: abortController.signal,
      });

      // Don't update state if this request was cancelled
      if (abortController.signal.aborted) return;

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        tokenUsage: response.usage,
      };

      addMessage(assistantMessage);
      addTokenUsage(response.usage);
      setAiStatus('ready');
    } catch (err) {
      // Don't update state if cancelled
      if (err instanceof AiServiceError && err.code === 'CANCELLED') return;

      const errorMessage = err instanceof AiServiceError
        ? err.message
        : 'Something went wrong. Please try again.';

      // Add error as an assistant message for inline display
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
        isError: true,
      };

      addMessage(errorMsg);
      setError(errorMessage);
      setAiStatus('error');

      // Auto-recover orb status after 3 seconds
      setTimeout(() => {
        setAiStatus('ready');
      }, 3000);
    } finally {
      setLoading(false);
    }
  }, [input, isLoading, messages, addMessage, setLoading, setAiStatus, clearError, setError, addTokenUsage]);

  // ─── Regenerate last response ────────────────────────────────────

  const handleRegenerate = useCallback(async () => {
    if (isLoading) return;

    // Find the last user message index
    const lastUserMsgIndex = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserMsgIndex === -1) return;

    // Remove last assistant message
    removeLastAssistantMessage();

    // Cancel any in-flight request
    abortControllerRef.current?.abort();

    // Set loading state
    setLoading(true);
    setAiStatus('thinking');
    clearError();

    // Build conversation history up to (and including) the last user message
    const messagesUpToLastUser = messages.slice(0, messages.length - lastUserMsgIndex);
    const conversationHistory: AiMessage[] = messagesUpToLastUser.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await generateResponse(conversationHistory, {
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) return;

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        tokenUsage: response.usage,
      };

      addMessage(assistantMessage);
      addTokenUsage(response.usage);
      setAiStatus('ready');
    } catch (err) {
      if (err instanceof AiServiceError && err.code === 'CANCELLED') return;

      const errorMessage = err instanceof AiServiceError
        ? err.message
        : 'Something went wrong. Please try again.';

      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
        isError: true,
      };

      addMessage(errorMsg);
      setError(errorMessage);
      setAiStatus('error');

      setTimeout(() => {
        setAiStatus('ready');
      }, 3000);
    } finally {
      setLoading(false);
    }
  }, [isLoading, messages, removeLastAssistantMessage, addMessage, setLoading, setAiStatus, clearError, setError, addTokenUsage]);

  // ─── Keyboard handling ───────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Is last assistant message? (for regenerate button) ──────────

  const isLastAssistantMessage = (msg: ChatMessage) => {
    if (msg.role !== 'assistant') return false;
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    return lastAssistant?.id === msg.id;
  };

  // ─── Render ──────────────────────────────────────────────────────

  const hasMessages = messages.length > 0;

  return (
    <Panel appId="chat" title="Chat" width="520px" height="620px">
      <div className="flex flex-col h-full">
        {/* Header bar with New Chat button */}
        {hasMessages && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-text-muted)]">
              {messages.filter((m) => m.role === 'user').length} messages
            </span>
            <button
              onClick={clearChat}
              className="
                text-[11px] px-2.5 py-1 rounded-lg
                glass glass-hover cursor-pointer
                text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]
                transition-all duration-200
              "
            >
              New Chat
            </button>
          </div>
        )}

        {/* Messages Area or Welcome Screen */}
        {!hasMessages ? (
          <WelcomeScreen />
        ) : (
          <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${msg.role === 'assistant' ? 'group' : ''}`}>
                  <div
                    className={`
                      px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                      ${
                        msg.role === 'user'
                          ? 'bg-primary/20 border border-primary/20 rounded-br-md'
                          : msg.isError
                            ? 'glass rounded-bl-md border-red-500/20 bg-red-500/5'
                            : 'glass rounded-bl-md'
                      }
                    `}
                  >
                    {msg.role === 'user' ? (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    ) : msg.isError ? (
                      <div className="flex items-start gap-2 text-red-400">
                        <span className="text-sm mt-0.5 flex-shrink-0">⚠</span>
                        <span>{msg.content}</span>
                      </div>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}
                  </div>

                  {/* Action buttons and token usage for assistant messages */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center justify-between mt-1 ml-1">
                      <div className="flex items-center gap-1">
                        {!msg.isError && <CopyResponseButton text={msg.content} />}
                        {isLastAssistantMessage(msg) && !isLoading && (
                          <RetryRegenerateButton onClick={handleRegenerate} isRetry={msg.isError} />
                        )}
                      </div>
                      {!msg.isError && msg.tokenUsage && msg.tokenUsage.totalTokens > 0 && (
                        <span
                          className="text-[10px] font-mono text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          title={`Prompt: ${msg.tokenUsage.inputTokens} · Completion: ${msg.tokenUsage.outputTokens} · Total: ${msg.tokenUsage.totalTokens}`}
                        >
                          {msg.tokenUsage.inputTokens}+{msg.tokenUsage.outputTokens}={msg.tokenUsage.totalTokens} tok
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="glass px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-secondary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-secondary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-secondary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Error banner (dismissible) */}
        {error && (
          <div className="px-4 py-2 border-t border-red-500/20 bg-red-500/5 flex items-center justify-between">
            <span className="text-xs text-red-400">{error}</span>
            <button
              onClick={clearError}
              className="text-red-400/60 hover:text-red-400 cursor-pointer text-xs ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 border-t border-[var(--color-border)]">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? 'AI is thinking...' : 'Type a message...'}
              disabled={isLoading}
              rows={1}
              className="
                flex-1 px-4 py-2.5 rounded-xl text-sm
                glass text-[var(--color-text)]
                placeholder:text-[var(--color-text-muted)]
                outline-none border-none
                focus:shadow-[0_0_10px_rgba(79,140,255,0.1)]
                transition-all duration-200
                resize-none overflow-y-auto
                disabled:opacity-50
              "
              style={{ maxHeight: '120px' }}
            />
            {isLoading ? (
              <button
                onClick={handleStop}
                className="
                  w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                  bg-red-500/20 border border-red-500/30
                  hover:bg-red-500/30 cursor-pointer
                  transition-all duration-200
                  active:scale-95
                "
                title="Stop generation"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="
                  w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                  bg-primary/20 border border-primary/30
                  hover:bg-primary/30 cursor-pointer
                  transition-all duration-200
                  disabled:opacity-30 disabled:cursor-not-allowed
                  active:scale-95
                "
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <span className="text-[10px] text-[var(--color-text-muted)]">
              Shift+Enter for new line
            </span>
            {sessionTokens.totalTokens > 0 && (
              <span className="text-[10px] font-mono text-[var(--color-text-muted)]" title={`Input: ${sessionTokens.inputTokens} · Output: ${sessionTokens.outputTokens}`}>
                {sessionTokens.totalTokens.toLocaleString()} tokens
              </span>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
