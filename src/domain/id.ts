// crypto.randomUUID only exists in secure contexts (HTTPS/localhost), so a phone
// opening the dev server over plain HTTP on the LAN would throw without a fallback.
export const newId = (): string =>
  typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
