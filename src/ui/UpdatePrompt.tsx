import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useLang } from './i18n'

const HOUR_MS = 60 * 60 * 1000

export type UpdateCheck = 'available' | 'upToDate' | 'unavailable'

const UpdateContext = createContext<{ check: () => Promise<UpdateCheck> }>({ check: async () => 'unavailable' })

// Waits for a freshly found service worker to finish installing, so the Update button has a waiting worker to activate.
const settle = (worker: ServiceWorker | null) =>
  new Promise<void>((resolve) => {
    if (!worker || worker.state === 'installed' || worker.state === 'redundant') return resolve()
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' || worker.state === 'redundant') resolve()
    })
  })

export function UpdateProvider({ children }: { children: ReactNode }) {
  const { m } = useLang()
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // A home-screen app usually resumes from the background without navigating,
    // so the browser never re-checks sw.js on its own. Check on resume and hourly.
    onRegisteredSW(_url, registration) {
      if (!registration) return
      registrationRef.current = registration
      const check = () => void registration.update().catch(() => {})
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
      setInterval(check, HOUR_MS)
    },
  })

  // Manual check: also brings the prompt back after "Later" while an update is still waiting.
  const check = useCallback(async (): Promise<UpdateCheck> => {
    const registration = registrationRef.current
    if (!registration) return 'unavailable'
    try {
      await registration.update()
      await settle(registration.installing)
    } catch {
      return 'unavailable'
    }
    if (!registration.waiting) return 'upToDate'
    setNeedRefresh(true)
    return 'available'
  }, [setNeedRefresh])

  return (
    <UpdateContext.Provider value={{ check }}>
      {children}
      {needRefresh && (
        <p className="update-prompt" role="status">
          <span>{m.updateAvailable}</span>
          <button type="button" className="secondary" onClick={() => setNeedRefresh(false)}>{m.updateLater}</button>
          <button type="button" onClick={() => void updateServiceWorker(true)}>{m.updateNow}</button>
        </p>
      )}
    </UpdateContext.Provider>
  )
}

export function UpdateCheckSection() {
  const { m } = useLang()
  const { check } = useContext(UpdateContext)
  const [status, setStatus] = useState<UpdateCheck | 'checking' | null>(null)
  const run = async () => {
    setStatus('checking')
    setStatus(await check())
  }
  const message = {
    checking: m.updateChecking,
    available: m.updateAvailable,
    upToDate: m.updateUpToDate,
    unavailable: m.updateUnavailable,
  }
  return (
    <section>
      <h2>{m.updatesTitle}</h2>
      <button type="button" disabled={status === 'checking'} onClick={() => void run()}>
        {m.checkForUpdate}
      </button>
      {status && <p className="edit-for" role="status">{message[status]}</p>}
    </section>
  )
}
