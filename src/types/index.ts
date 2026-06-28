export interface AppInfo {
  id: string;
  name: string;
  icon: string;
}

export type Theme = 'dark' | 'light';
export type Wallpaper = 'space' | 'aurora';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}
