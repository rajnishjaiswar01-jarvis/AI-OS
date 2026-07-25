import { useShellStore } from '@shell/shellStore';
import { listVisibleApps } from '@core/registry/registry';
import DockIcon from './DockIcon';

export default function Dock() {
  const { openApp, openApps } = useShellStore();
  const apps = listVisibleApps();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="glass glass-glow rounded-2xl px-3 py-2 flex items-center gap-2">
        {apps.map((app) => (
          <DockIcon
            key={app.id}
            icon={app.icon}
            label={app.name}
            onClick={() => openApp(app.id)}
            active={openApps.includes(app.id)}
          />
        ))}
      </div>
    </div>
  );
}
