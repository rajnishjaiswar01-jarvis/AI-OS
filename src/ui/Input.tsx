interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  className?: string;
  autoFocus?: boolean;
}

export default function Input({
  value,
  onChange,
  placeholder = '',
  onSubmit,
  className = '',
  autoFocus = false,
}: InputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onSubmit) onSubmit();
      }}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`
        w-full px-4 py-2.5
        glass rounded-md
        text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]
        outline-none
        focus:border-primary/40 focus:shadow-[0_0_15px_rgba(79,140,255,0.1)]
        transition-all duration-200
        ${className}
      `}
    />
  );
}
