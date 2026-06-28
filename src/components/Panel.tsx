import { useEffect, useState, type ReactNode } from 'react';
import { useAppStore } from '../stores/appStore';

interface PanelProps {
  appId: string;
  title: string;
  children: ReactNode;
  width?: string;
  height?: string;
}

export default function Panel({ appId, title, children, width = '480px', height = '560px' }: PanelProps) {
  const { closeApp, openApps, bringToFront } = useAppStore();
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const zIndex = 100 + openApps.indexOf(appId);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => closeApp(appId), 200);
  };

  return (
    <div
      className={`
        fixed inset-0 flex items-center justify-center
        ${mounted && !closing ? 'animate-fade-in' : ''}
      `}
      style={{ zIndex }}
      onClick={() => bringToFront(appId)}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
      />

      {/* Window */}
      <div
        className={`
          relative glass glass-glow rounded-xl overflow-hidden
          flex flex-col
          ${mounted && !closing ? 'animate-slide-up' : ''}
          ${closing ? 'animate-slide-down' : ''}
        `}
        style={{ width, height, maxWidth: '90vw', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</span>
          <button
            onClick={handleClose}
            className="w-6 h-6 rounded-full flex items-center justify-center
              hover:bg-red-500/20 text-[var(--color-text-muted)] hover:text-red-400
              transition-all duration-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
