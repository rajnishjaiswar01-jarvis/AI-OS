import { useEffect } from 'react';
import { useShellStore } from '@shell/shellStore';
import { useSettingsStore } from '@features/settings/settingsStore';
import { projectService } from '@features/projects/projectService';
import BootScreen from '@shell/components/BootScreen';
import Desktop from '@shell/components/Desktop';

export default function App() {
  const booted = useShellStore((s) => s.booted);
  const theme = useSettingsStore((s) => s.theme);

  // Sync theme attribute on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Hydrate project store from Dexie on app start
  // Runs during boot animation so projects are ready when desktop appears
  useEffect(() => {
    projectService.loadProjects();
  }, []);

  return (
    <>
      {!booted && <BootScreen />}
      {booted && <Desktop />}
    </>
  );
}
