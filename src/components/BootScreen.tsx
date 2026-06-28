import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';

const BOOT_MESSAGES = [
  'Starting AI OS...',
  'Loading Desktop...',
  'Preparing Workspace...',
  'Ready.',
];

export default function BootScreen() {
  const { setBooted } = useAppStore();
  const [currentMessage, setCurrentMessage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Show messages sequentially
    const messageTimers: ReturnType<typeof setTimeout>[] = [];

    BOOT_MESSAGES.forEach((_, i) => {
      messageTimers.push(
        setTimeout(() => {
          setCurrentMessage(i);
          setProgress(((i + 1) / BOOT_MESSAGES.length) * 100);
        }, i * 600)
      );
    });

    // Start exit after all messages
    const exitTimer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => setBooted(), 500);
    }, BOOT_MESSAGES.length * 600 + 400);

    return () => {
      messageTimers.forEach(clearTimeout);
      clearTimeout(exitTimer);
    };
  }, [setBooted]);

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex flex-col items-center justify-center
        bg-[#0a0a1a]
        transition-all duration-500
        ${exiting ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}
      `}
    >
      {/* Logo */}
      <div className="mb-12 animate-fade-in">
        <div className="relative">
          {/* Glow behind logo */}
          <div className="absolute inset-0 blur-[40px] bg-primary/30 rounded-full scale-150" />
          <h1
            className="relative text-5xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AI OS
          </h1>
        </div>
        <p className="text-center text-sm text-[var(--color-text-muted)] mt-2 tracking-widest">
          v1.0
        </p>
      </div>

      {/* Loading Messages */}
      <div className="h-6 mb-6">
        {BOOT_MESSAGES.map((msg, i) => (
          <p
            key={msg}
            className={`
              text-sm font-mono text-[var(--color-text-secondary)] text-center
              transition-all duration-300
              ${i === currentMessage ? 'opacity-100' : 'opacity-0 absolute'}
            `}
          >
            {msg}
          </p>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="w-48 h-[2px] rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
            boxShadow: '0 0 10px var(--color-glow)',
          }}
        />
      </div>
    </div>
  );
}
