import { useState, useRef, useEffect } from 'react';
import Panel from '../../components/Panel';
import type { ChatMessage } from '../../types';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    sender: 'user',
    text: 'Hello AI, what can you do?',
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: '2',
    sender: 'ai',
    text: "I'm your AI assistant. I can help with tasks, answer questions, and manage your workspace. Currently running in Phase 1 mode.",
    timestamp: new Date(Date.now() - 55000),
  },
  {
    id: '3',
    sender: 'user',
    text: 'Tell me about this OS',
    timestamp: new Date(Date.now() - 30000),
  },
  {
    id: '4',
    sender: 'ai',
    text: 'AI OS is a next-generation operating system powered by artificial intelligence. More features are coming soon!',
    timestamp: new Date(Date.now() - 25000),
  },
];

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Fake AI response after 1s
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "I'm not connected yet. Coming in Phase 2! 🚀",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <Panel appId="chat" title="Chat" width="440px" height="580px">
      <div className="flex flex-col h-full">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${
                    msg.sender === 'user'
                      ? 'bg-primary/20 border border-primary/20 rounded-br-md'
                      : 'glass rounded-bl-md'
                  }
                `}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
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

        {/* Input Area */}
        <div className="p-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="
                flex-1 px-4 py-2.5 rounded-xl text-sm
                glass text-[var(--color-text)]
                placeholder:text-[var(--color-text-muted)]
                outline-none border-none
                focus:shadow-[0_0_10px_rgba(79,140,255,0.1)]
                transition-all duration-200
              "
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="
                w-10 h-10 rounded-xl flex items-center justify-center
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
          </div>
        </div>
      </div>
    </Panel>
  );
}
