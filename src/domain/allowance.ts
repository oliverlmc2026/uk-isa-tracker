import { DEFAULT_WARNING_THRESHOLD } from './settings'
import type { AllowanceRow, AllowanceTable, Contribution, IsaAccount } from './types'

/** Policy changes are a one-row addition here; old years keep their own row. */
export const DEFAULT_ALLOWANCE_TABLE: AllowanceTable = {
  2017: { isaAllowance: 2_000_000, lisaLimit: 400_000 },
}

/** Tax Year runs 6 April – 5 April; returns the calendar year it starts in. */
export function taxYearOf(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number)
  return month > 4 || (month === 4 && day >= 6) ? year : year - 1
}

/** `today` is injected (ISO date) so the 6 April rollover is testable. */
export function currentTaxYear(today: string): number {
  return taxYearOf(today)
}

/** The current Tax Year plus every year holding a Contribution, newest first. */
export function browsableTaxYears(contributions: Contribution[], current: number): number[] {
  const years = new Set([current, ...contributions.map((c) => taxYearOf(c.date))])
  return [...years].sort((a, b) => b - a)
}

export function taxYearLabel(taxYear: number): string {
  return `${taxYear}/${String((taxYear + 1) % 100).padStart(2, '0')}`
}

export function allowanceFor(taxYear: number, table: AllowanceTable): AllowanceRow {
  const years = Object.keys(table).map(Number).sort((a, b) => a - b)
  const known = years.filter((y) => y <= taxYear)
  const chosen = known.length > 0 ? known[known.length - 1] : years[0]
  return table[chosen]
}

export interface AccountUsage {
  accountId: string
  /** Integer pence paid into this account in the Tax Year; 0 if none. */
  used: number
}

/** The combined LISA limit; unlike the ISA Allowance it has no warning stage. */
export interface LisaSummary {
  /** All amounts are integer pence. */
  limit: number
  used: number
  remaining: number
  overContribution: number
  status: 'ok' | 'over'
}

export interface AllowanceSummary {
  taxYear: number
  /** All amounts are integer pence. */
  allowance: number
  used: number
  /** One row per account, in account order, so the rows add up to `used`. */
  byAccount: AccountUsage[]
  remaining: number
  /** 0–100+, not clamped, so an Over-contribution reads above 100. */
  usagePercent: number
  overContribution: number
  /** 'warning' from the Warning Threshold up to the allowance; 'over' only once past it. */
  status: 'ok' | 'warning' | 'over'
  /** All LISA accounts together; these Contributions are also inside `used`. */
  lisa: LisaSummary
}

export function summarise(input: {
  accounts: IsaAccount[]
  contributions: Contribution[]
  taxYear: number
  table: AllowanceTable
  /** Percent of the allowance; defaults to 90. */
  warningThreshold?: number
}): AllowanceSummary {
  const { accounts, contributions, taxYear, table, warningThreshold = DEFAULT_WARNING_THRESHOLD } = input
  const { isaAllowance, lisaLimit } = allowanceFor(taxYear, table)
  const inYear = contributions.filter((c) => taxYearOf(c.date) === taxYear)
  const used = inYear.reduce((sum, c) => sum + c.amount, 0)
  const byAccount = accounts.map((a) => ({
    accountId: a.id,
    used: inYear.filter((c) => c.accountId === a.id).reduce((sum, c) => sum + c.amount, 0),
  }))
  const lisaIds = new Set(accounts.filter((a) => a.type === 'lifetime').map((a) => a.id))
  const lisaUsed = inYear.filter((c) => lisaIds.has(c.accountId)).reduce((sum, c) => sum + c.amount, 0)
  return {
    taxYear,
    allowance: isaAllowance,
    used,
    byAccount,
    remaining: Math.max(0, isaAllowance - used),
    usagePercent: (used / isaAllowance) * 100,
    overContribution: Math.max(0, used - isaAllowance),
    // Compared in pence (used * 100 vs allowance * percent) to avoid float error.
    status: used > isaAllowance ? 'over' : used * 100 >= isaAllowance * warningThreshold ? 'warning' : 'ok',
    lisa: {
      limit: lisaLimit,
      used: lisaUsed,
      remaining: Math.max(0, lisaLimit - lisaUsed),
      overContribution: Math.max(0, lisaUsed - lisaLimit),
      status: lisaUsed > lisaLimit ? 'over' : 'ok',
    },
  }
}
