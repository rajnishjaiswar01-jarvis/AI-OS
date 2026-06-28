import { useState, useEffect } from 'react';
import Widget from './Widget';

export default function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <Widget title="Clock" icon="🕐">
      <div className="text-center">
        <p
          className="text-3xl font-mono font-semibold tracking-wider"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-accent-light))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {formatTime(time)}
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
          {formatDate(time)}
        </p>
      </div>
    </Widget>
  );
}
