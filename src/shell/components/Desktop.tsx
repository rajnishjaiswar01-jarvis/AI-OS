import { useShellStore } from '@shell/shellStore';
import { useSettingsStore } from '@features/settings/settingsStore';
import TopBar from './TopBar';
import Dock from './Dock';
import AiOrb from './AiOrb';
import Clock from './Clock';
import SystemStatus from './SystemStatus';
import Chat from '@ai/chat/components/Chat';
import SettingsPanel from '@features/settings/components/SettingsPanel';

export default function Desktop() {
  const wallpaper = useSettingsStore((s) => s.wallpaper);
  const openApps = useShellStore((s) => s.openApps);

  return (
    <div
      className={`
        fixed inset-0
        wallpaper-${wallpaper}
        transition-all duration-500
        animate-fade-in
      `}
    >
      {/* Animated aurora overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(79, 140, 255, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 60%, rgba(139, 92, 246, 0.1) 0%, transparent 60%)
          `,
          animation: 'auroraShift 15s ease-in-out infinite',
          backgroundSize: '200% 200%',
        }}
      />

      {/* Top Bar */}
      <TopBar />

      {/* Widgets Area */}
      <div className="absolute top-16 left-6 space-y-4 w-64 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <Clock />
        <SystemStatus />
      </div>

      {/* AI Orb */}
      <AiOrb />

      {/* Dock */}
      <Dock />

      {/* Open App Panels */}
      {openApps.includes('chat') && <Chat />}
      {openApps.includes('settings') && <SettingsPanel />}
    </div>
  );
}
