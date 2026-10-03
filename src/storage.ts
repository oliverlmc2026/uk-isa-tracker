import { DEFAULT_WARNING_THRESHOLD, validateWarningThreshold } from './domain/settings'
import type { Contribution, IsaAccount } from './domain/types'

export interface AppState {
  accounts: IsaAccount[]
  contributions: Contribution[]
}

const KEY = 'uk-isa-tracker:v1'

export const emptyState = (): AppState => ({ accounts: [], contributions: [] })

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed?.accounts) && Array.isArray(parsed?.contributions)) return parsed
  } catch {
    // unreadable storage falls through to an empty state
  }
  return emptyState()
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage may be full or blocked; the app keeps working in memory
  }
}

const THRESHOLD_KEY = 'uk-isa-tracker:warning-threshold'

export function loadWarningThreshold(): number {
  try {
    const result = validateWarningThreshold(localStorage.getItem(THRESHOLD_KEY) ?? '')
    if (result.ok) return result.value
  } catch {
    // unreadable storage falls back to the default
  }
  return DEFAULT_WARNING_THRESHOLD
}

export function saveWarningThreshold(percent: number): void {
  try {
    localStorage.setItem(THRESHOLD_KEY, String(percent))
  } catch {
    // storage may be full or blocked; the setting lasts until reload
  }
}
