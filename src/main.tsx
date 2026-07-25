import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { registerBuiltinApps } from '@core/registry/registerApps'

// Register all built-in apps before React renders
registerBuiltinApps();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
