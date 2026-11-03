import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles/tokens.css'
import './styles/base.css'

// iOS home-screen apps rarely re-check sw.js on their own, so ask explicitly:
// on launch, on return to foreground, and hourly. autoUpdate mode reloads the
// page when the new worker activates.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    const check = () => { registration.update().catch(() => {}) }
    check()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
    window.addEventListener('pageshow', check)
    setInterval(check, 60 * 60 * 1000)
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
