import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import BootScreen from './components/BootScreen';
import Desktop from './components/Desktop';

export default function App() {
  const { booted, theme } = useAppStore();

  // Sync theme attribute on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <>
      {!booted && <BootScreen />}
      {booted && <Desktop />}
    </>
  );
}
