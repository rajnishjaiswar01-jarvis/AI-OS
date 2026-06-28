import Panel from '../../components/Panel';
import { useAppStore } from '../../stores/appStore';
import type { Wallpaper } from '../../types';

const WALLPAPERS: { id: Wallpaper; name: string; gradient: string }[] = [
  {
    id: 'space',
    name: 'Space',
    gradient: 'linear-gradient(135deg, #0a0a1a 0%, #0f0f2e 30%, #1a0a2e 60%, #0d0d20 100%)',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    gradient: 'linear-gradient(135deg, #0a1628 0%, #0d2137 25%, #0a2e3d 50%, #162040 75%, #0f1a30 100%)',
  },
];

export default function Settings() {
  const { theme, toggleTheme, wallpaper, setWallpaper } = useAppStore();

  return (
    <Panel appId="settings" title="Settings" width="400px" height="480px">
      <div className="p-5 space-y-6">
        {/* Theme Section */}
        <section>
          <h3 className="text-sm font-semibold mb-3 text-[var(--color-text-secondary)] uppercase tracking-wider">
            Theme
          </h3>
          <div
            onClick={toggleTheme}
            className="glass glass-hover rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{theme === 'dark' ? '🌙' : '☀️'}</span>
              <div>
                <p className="text-sm font-medium">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {theme === 'dark' ? 'Easy on the eyes' : 'Bright and clean'}
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <div
              className={`
                w-11 h-6 rounded-full p-0.5 transition-colors duration-300
                ${theme === 'dark' ? 'bg-primary/30' : 'bg-black/20'}
              `}
            >
              <div
                className={`
                  w-5 h-5 rounded-full bg-white shadow-md
                  transition-transform duration-300
                  ${theme === 'light' ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </div>
          </div>
        </section>

        {/* Wallpaper Section */}
        <section>
          <h3 className="text-sm font-semibold mb-3 text-[var(--color-text-secondary)] uppercase tracking-wider">
            Wallpaper
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {WALLPAPERS.map((wp) => (
              <button
                key={wp.id}
                onClick={() => setWallpaper(wp.id)}
                className={`
                  relative rounded-xl overflow-hidden h-24 cursor-pointer
                  transition-all duration-200
                  border-2
                  ${
                    wallpaper === wp.id
                      ? 'border-primary shadow-[0_0_15px_rgba(79,140,255,0.2)] scale-[1.02]'
                      : 'border-transparent hover:border-[var(--color-border-hover)]'
                  }
                `}
                style={{ background: wp.gradient }}
              >
                {/* Selected checkmark */}
                {wallpaper === wp.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[10px] text-white">✓</span>
                  </div>
                )}
                <span className="absolute bottom-2 left-2 text-xs font-medium text-white/80">
                  {wp.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section>
          <h3 className="text-sm font-semibold mb-3 text-[var(--color-text-secondary)] uppercase tracking-wider">
            About
          </h3>
          <div className="glass rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Version</span>
              <span className="font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Phase</span>
              <span className="font-mono">1 — Interface</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">AI Status</span>
              <span className="font-mono text-yellow-400">Not Connected</span>
            </div>
          </div>
        </section>
      </div>
    </Panel>
  );
}
