import { useAppStore } from '../stores/appStore';
import DockIcon from './DockIcon';

const DOCK_APPS = [
  { id: 'chat', icon: '💬', label: 'Chat' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

export default function Dock() {
  const { openApp, openApps } = useAppStore();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="glass glass-glow rounded-2xl px-3 py-2 flex items-center gap-2">
        {DOCK_APPS.map((app) => (
          <DockIcon
            key={app.id}
            icon={app.icon}
            label={app.label}
            onClick={() => openApp(app.id)}
            active={openApps.includes(app.id)}
          />
        ))}
      </div>
    </div>
  );
}
