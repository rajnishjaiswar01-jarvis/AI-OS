export interface AppInfo {
  id: string;
  name: string;
  icon: string;
}

export type Theme = 'dark' | 'light';
export type Wallpaper = 'space' | 'aurora';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}
