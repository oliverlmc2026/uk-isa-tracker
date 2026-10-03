import { useEffect, useState } from 'react'

export const ROUTES = ['overview', 'contributions', 'accounts', 'settings'] as const
export type Route = (typeof ROUTES)[number]

const PATHS: Record<Route, string> = {
  overview: '#/',
  contributions: '#/contributions',
  accounts: '#/accounts',
  settings: '#/settings',
}

export const routeHref = (route: Route) => PATHS[route]

const parse = (hash: string): Route =>
  ROUTES.find((r) => PATHS[r] === hash || (r !== 'overview' && hash === `#${PATHS[r].slice(2)}`)) ?? 'overview'

/** Hash routing keeps the app deployable as plain static files (ADR 0001). */
export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
