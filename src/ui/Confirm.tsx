import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLang } from './i18n'

type Ask = (message: string, confirmLabel: string) => Promise<boolean>

const ConfirmContext = createContext<Ask>(() => Promise.resolve(false))

/** In-page replacement for window.confirm, which embedded browsers silently suppress. */
export const useConfirm = () => useContext(ConfirmContext)

interface Pending {
  message: string
  confirmLabel: string
  resolve: (ok: boolean) => void
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { m } = useLang()
  const [pending, setPending] = useState<Pending | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  const ask = useCallback<Ask>(
    (message, confirmLabel) => new Promise((resolve) => setPending({ message, confirmLabel, resolve })),
    [],
  )

  useEffect(() => {
    if (pending && !dialog.current?.open) dialog.current?.showModal()
  }, [pending])

  const answer = (ok: boolean) => {
    pending?.resolve(ok)
    dialog.current?.close()
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      {pending && (
        // Esc fires `cancel`; preventDefault so answer() owns closing and the promise always settles.
        <dialog
          ref={dialog}
          className="confirm"
          aria-labelledby="confirm-message"
          onCancel={(e) => {
            e.preventDefault()
            answer(false)
          }}
        >
          <p id="confirm-message">{pending.message}</p>
          <div className="edit-buttons">
            <button type="button" className="secondary" onClick={() => answer(false)} autoFocus>{m.cancel}</button>
            <button type="button" className="danger-solid" onClick={() => answer(true)}>{pending.confirmLabel}</button>
          </div>
        </dialog>
      )}
    </ConfirmContext.Provider>
  )
}
