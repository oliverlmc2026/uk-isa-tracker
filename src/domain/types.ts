export type AccountType = 'cash' | 'stocks_and_shares' | 'lifetime'

export interface IsaAccount {
  id: string
  name: string
  type: AccountType
  provider: string
}

export interface Contribution {
  id: string
  accountId: string
  /** Integer pence. */
  amount: number
  /** ISO date, YYYY-MM-DD. The Tax Year is always derived from this. */
  date: string
}

export interface AllowanceRow {
  /** Integer pence. */
  isaAllowance: number
  /** Integer pence. */
  lisaLimit: number
}

/** Keyed by the calendar year in which the Tax Year starts (2025 = 2025/26). */
export type AllowanceTable = Record<number, AllowanceRow>
