import { useState, useEffect } from 'react';
import Widget from './Widget';

interface StatusItem {
  label: string;
  value: string;
  percentage?: number;
  color: string;
}

export default function SystemStatus() {
  const [stats, setStats] = useState<StatusItem[]>([
    { label: 'CPU', value: '23%', percentage: 23, color: 'var(--color-primary)' },
    { label: 'Memory', value: '4.2 / 16 GB', percentage: 26, color: 'var(--color-accent)' },
    { label: 'AI Core', value: 'Online', color: '#4ade80' },
    { label: 'Version', value: 'AI OS v1.0', color: 'var(--color-text-secondary)' },
  ]);

  // Fake fluctuating CPU/Memory values
  useEffect(() => {
    const timer = setInterval(() => {
      setStats((prev) =>
        prev.map((stat) => {
          if (stat.label === 'CPU') {
            const cpu = Math.max(8, Math.min(45, (stat.percentage || 23) + (Math.random() * 10 - 5)));
            return { ...stat, value: `${Math.round(cpu)}%`, percentage: cpu };
          }
          if (stat.label === 'Memory') {
            const mem = Math.max(3.5, Math.min(6, 4.2 + (Math.random() * 0.6 - 0.3)));
            return { ...stat, value: `${mem.toFixed(1)} / 16 GB`, percentage: (mem / 16) * 100 };
          }
          return stat;
        })
      );
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Widget title="System Status" icon="📊">
      <div className="space-y-3">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[var(--color-text-secondary)]">{stat.label}</span>
              <div className="flex items-center gap-1.5">
                {stat.label === 'AI Core' && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: stat.color,
                      animation: 'pulse-dot 2s ease-in-out infinite',
                    }}
                  />
                )}
                <span className="text-xs font-mono" style={{ color: stat.color }}>
                  {stat.value}
                </span>
              </div>
            </div>
            {stat.percentage !== undefined && (
              <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${stat.percentage}%`,
                    backgroundColor: stat.color,
                    boxShadow: `0 0 8px ${stat.color}40`,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </Widget>
  );
}
