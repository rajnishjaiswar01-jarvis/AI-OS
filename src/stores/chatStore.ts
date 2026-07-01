/**
 * AI OS — Chat Store
 *
 * Pure state container for chat. No API calls, no side effects.
 * Orchestration lives in Chat.tsx, not here.
 */

import { create } from 'zustand';
import type { ChatMessage } from '../types';

// ─── Types ───────────────────────────────────────────────────────────

export type AiStatus = 'ready' | 'thinking' | 'error';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  aiStatus: AiStatus;
  sessionTokens: TokenUsage;

  // Pure state mutations — no side effects
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAiStatus: (status: AiStatus) => void;
  addTokenUsage: (usage: TokenUsage) => void;
  removeLastAssistantMessage: () => void;
  clearChat: () => void;
  clearError: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  error: null,
  aiStatus: 'ready',
  sessionTokens: {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  },

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setAiStatus: (aiStatus) => set({ aiStatus }),

  addTokenUsage: (usage) =>
    set((state) => ({
      sessionTokens: {
        inputTokens: state.sessionTokens.inputTokens + usage.inputTokens,
        outputTokens: state.sessionTokens.outputTokens + usage.outputTokens,
        totalTokens: state.sessionTokens.totalTokens + usage.totalTokens,
      },
    })),

  removeLastAssistantMessage: () =>
    set((state) => {
      const messages = [...state.messages];
      // Find and remove the last assistant message
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
          messages.splice(i, 1);
          break;
        }
      }
      return { messages };
    }),

  clearChat: () =>
    set({
      messages: [],
      error: null,
      aiStatus: 'ready',
      isLoading: false,
    }),

  clearError: () => set({ error: null }),
}));
