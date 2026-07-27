/**
 * AI OS — Panel Component
 *
 * @deprecated Replaced by Window.tsx in Sprint 1D.
 * Kept for one sprint as a rollback safety net.
 * Will be deleted in Sprint 2 after Window Manager stabilizes.
 *
 * Previously: Centered modal overlay for app content.
 * Now: Window.tsx handles positioning, chrome, and lifecycle.
 */
import { type ReactNode } from 'react';

interface PanelProps {
  appId: string;
  title: string;
  children: ReactNode;
  width?: string;
  height?: string;
}

/**
 * @deprecated Use Window.tsx instead. This component is a no-op stub
 * kept only for rollback safety. It renders children without chrome.
 */
export default function Panel({ children }: PanelProps) {
  return <>{children}</>;
}
