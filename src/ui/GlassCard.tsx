import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export default function GlassCard({ children, className = '', glow = false, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        glass rounded-lg transition-all duration-200
        ${glow ? 'glass-glow' : ''}
        ${onClick ? 'cursor-pointer glass-hover' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
