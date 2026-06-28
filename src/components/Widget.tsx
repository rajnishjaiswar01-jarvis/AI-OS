import type { ReactNode } from 'react';

interface WidgetProps {
  title: string;
  icon?: string;
  children: ReactNode;
  className?: string;
}

export default function Widget({ title, icon, children, className = '' }: WidgetProps) {
  return (
    <div className={`glass glass-glow rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-sm">{icon}</span>}
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
