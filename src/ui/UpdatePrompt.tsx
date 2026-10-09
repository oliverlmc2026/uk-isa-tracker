import { useRegisterSW } from 'virtual:pwa-register/react'
import { useLang } from './i18n'

const HOUR_MS = 60 * 60 * 1000

export function UpdatePrompt() {
  const { m } = useLang()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // A home-screen app usually resumes from the background without navigating,
    // so the browser never re-checks sw.js on its own. Check on resume and hourly.
    onRegisteredSW(_url, registration) {
      if (!registration) return
      const check = () => void registration.update().catch(() => {})
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
      setInterval(check, HOUR_MS)
    },
  })

  if (!needRefresh) return null
  return (
    <p className="update-prompt" role="status">
      <span>{m.updateAvailable}</span>
      <button type="button" className="secondary" onClick={() => setNeedRefresh(false)}>{m.updateLater}</button>
      <button type="button" onClick={() => void updateServiceWorker(true)}>{m.updateNow}</button>
    </p>
  )
}
