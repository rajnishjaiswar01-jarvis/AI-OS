import { useEffect, useState } from 'react';
import { useShellStore } from '@shell/shellStore';
import { APP_VERSION } from '@core/config';

export default function BootScreen() {
  const { setBooted } = useShellStore();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('Initializing...');

  useEffect(() => {
    const phases = [
      { time: 300, label: 'Loading kernel...' },
      { time: 800, label: 'Starting services...' },
      { time: 1400, label: 'Mounting workspace...' },
      { time: 2000, label: 'Ready.' },
    ];

    phases.forEach(({ time, label }) => {
      setTimeout(() => setPhase(label), time);
    });

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    const bootTimeout = setTimeout(() => {
      setBooted();
    }, 2500);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(bootTimeout);
    };
  }, [setBooted]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a1a]"
      style={{
        animation: progress >= 100 ? 'bootFadeOut 500ms ease-out 200ms forwards' : undefined,
      }}
    >
      {/* Logo */}
      <div className="animate-breathe mb-8">
        <span
          className="text-4xl font-bold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          AI OS
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-48 h-0.5 rounded-full bg-white/10 overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
          }}
        />
      </div>

      {/* Phase text */}
      <span className="text-xs text-[var(--color-text-muted)] font-mono">{phase}</span>

      {/* Version */}
      <span className="absolute bottom-6 text-xs text-[var(--color-text-muted)] font-mono opacity-40">
        {APP_VERSION}
      </span>
    </div>
  );
}
