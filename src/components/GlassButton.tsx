import type { ReactNode } from 'react';

interface GlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: ReactNode;
}

export default function GlassButton({
  children,
  onClick,
  variant = 'ghost',
  size = 'md',
  className = '',
  icon,
}: GlassButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    primary:
      'bg-primary/20 border border-primary/30 hover:bg-primary/30 hover:border-primary/50 text-white shadow-[0_0_15px_rgba(79,140,255,0.15)]',
    ghost:
      'glass glass-hover',
  };

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-md font-medium
        transition-all duration-200 ease-out
        active:scale-[0.97]
        cursor-pointer
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
