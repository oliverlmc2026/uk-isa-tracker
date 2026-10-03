import { parsePounds } from './money'
import type { Contribution } from './types'

export type ContributionInput = { amount: string; date: string }
export type ContributionValidation =
  | { ok: true; value: { amount: number; date: string } }
  | { ok: false; error: string }

const AMOUNT_ERROR = 'Enter an amount above £0 with up to two decimal places, for example 250 or 250.50.'
const DATE_ERROR = 'Enter a valid date.'

export function isRealDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

/** Shared by add and edit so both reject the same bad input. */
export function validateContributionInput(input: ContributionInput): ContributionValidation {
  const amount = parsePounds(input.amount)
  if (amount === null) return { ok: false, error: AMOUNT_ERROR }
  if (!isRealDate(input.date)) return { ok: false, error: DATE_ERROR }
  return { ok: true, value: { amount, date: input.date } }
}

export function editContribution(
  contributions: Contribution[],
  id: string,
  change: { amount: number; date: string },
): Contribution[] {
  return contributions.map((c) => (c.id === id ? { ...c, ...change } : c))
}

export function deleteContribution(contributions: Contribution[], id: string): Contribution[] {
  return contributions.filter((c) => c.id !== id)
}
