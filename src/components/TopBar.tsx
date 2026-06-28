import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

export default function TopBar() {
  const { theme, toggleTheme } = useAppStore();
  const [time, setTime] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-1.5">
      <div className="glass glass-glow rounded-xl px-4 py-2 flex items-center justify-between">
        {/* Left — Logo */}
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AI OS
          </span>
        </div>

        {/* Center — Search */}
        <div
          className={`
            flex items-center glass rounded-lg overflow-hidden
            transition-all duration-300 ease-out
            ${searchOpen ? 'w-72' : 'w-36'}
          `}
        >
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="px-3 py-1.5 text-[var(--color-text-muted)] cursor-pointer flex-shrink-0"
          >
            🔍
          </button>
          <input
            type="text"
            placeholder="Search..."
            className={`
              bg-transparent border-none outline-none text-sm text-[var(--color-text)]
              placeholder:text-[var(--color-text-muted)]
              transition-all duration-300
              ${searchOpen ? 'w-full px-2 py-1.5 opacity-100' : 'w-0 p-0 opacity-0'}
            `}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
          />
        </div>

        {/* Right — Theme + Time */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center
              glass-hover cursor-pointer
              transition-all duration-200 hover:scale-110"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <span className="text-sm font-mono text-[var(--color-text-secondary)] min-w-[4.5rem] text-right">
            {formatTime(time)}
          </span>
        </div>
      </div>
    </div>
  );
}
