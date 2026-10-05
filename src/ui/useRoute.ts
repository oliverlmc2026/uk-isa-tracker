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

const ROUTE_CHANGE = 'routechange'

/**
 * Changes the hash with pushState instead of letting the browser follow the link:
 * iOS Safari over plain http (LAN dev) reloads the whole page on a followed hash link.
 */
export function navigate(route: Route) {
  if (parse(location.hash) === route) return
  history.pushState(null, '', PATHS[route])
  window.dispatchEvent(new Event(ROUTE_CHANGE))
}

/** Hash routing keeps the app deployable as plain static files (ADR 0001). */
export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(location.hash))
      window.scrollTo(0, 0)
    }
    // hashchange: typed or bookmarked URLs; popstate: back/forward over pushState entries.
    const events = ['hashchange', 'popstate', ROUTE_CHANGE]
    events.forEach((e) => window.addEventListener(e, onChange))
    return () => events.forEach((e) => window.removeEventListener(e, onChange))
  }, [])
  return route
}
