interface DockIconProps {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
}

export default function DockIcon({ icon, label, onClick, active = false }: DockIconProps) {
  return (
    <div className="relative group flex flex-col items-center">
      {/* Tooltip */}
      <span
        className="
          absolute -top-9 px-2.5 py-1 rounded-md text-xs font-medium
          glass opacity-0 group-hover:opacity-100
          transition-all duration-200 pointer-events-none
          whitespace-nowrap
        "
      >
        {label}
      </span>

      {/* Icon Button */}
      <button
        onClick={onClick}
        className={`
          w-12 h-12 rounded-xl flex items-center justify-center text-xl
          glass glass-hover cursor-pointer
          transition-all duration-200 ease-out
          hover:scale-[1.2] hover:shadow-[0_0_20px_rgba(79,140,255,0.2)]
          active:scale-[1.05]
          ${active ? 'shadow-[0_0_15px_rgba(79,140,255,0.2)] border-primary/30' : ''}
        `}
      >
        {icon}
      </button>

      {/* Active dot */}
      {active && (
        <div className="w-1 h-1 rounded-full bg-primary mt-1" />
      )}
    </div>
  );
}
