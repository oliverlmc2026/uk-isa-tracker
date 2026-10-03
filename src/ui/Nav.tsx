import type { ReactNode } from 'react'
import { useLang } from './i18n'
import { ROUTES, routeHref } from './useRoute'
import type { Route } from './useRoute'

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const ICONS: Record<Route, ReactNode> = {
  overview: svg(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>),
  contributions: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>),
  accounts: svg(<><path d="M3 10l9-6 9 6" /><path d="M5 10v8M10 10v8M14 10v8M19 10v8" /><path d="M3 21h18" /></>),
  settings: svg(<><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>),
}

export function Nav({ route }: { route: Route }) {
  const { m } = useLang()
  return (
    <nav className="tabs" aria-label={m.navLabel}>
      {ROUTES.map((r) => (
        <a key={r} href={routeHref(r)} aria-current={r === route ? 'page' : undefined}>
          {ICONS[r]}
          <span>{m.nav[r]}</span>
        </a>
      ))}
    </nav>
  )
}
