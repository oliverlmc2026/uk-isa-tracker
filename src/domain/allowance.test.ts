import { describe, expect, it } from 'vitest'
import { summarise, taxYearOf, taxYearLabel, currentTaxYear, browsableTaxYears, DEFAULT_ALLOWANCE_TABLE } from './allowance'
import type { Contribution, IsaAccount, AllowanceTable } from './types'

const cashA: IsaAccount = { id: 'a', name: 'Cash A', type: 'cash', provider: 'Bank A' }
const cashB: IsaAccount = { id: 'b', name: 'Cash B', type: 'cash', provider: 'Bank B' }
const lisaA: IsaAccount = { id: 'l1', name: 'LISA A', type: 'lifetime', provider: 'Bank L' }
const lisaB: IsaAccount = { id: 'l2', name: 'LISA B', type: 'lifetime', provider: 'Bank M' }
const sns: IsaAccount = { id: 's', name: 'S&S', type: 'stocks_and_shares', provider: 'Broker' }

let n = 0
const c = (accountId: string, pounds: number, date: string): Contribution => ({
  id: String(++n),
  accountId,
  amount: Math.round(pounds * 100),
  date,
})

describe('taxYearOf', () => {
  it('puts 5 April in the previous Tax Year and 6 April in the new one', () => {
    expect(taxYearOf('2025-04-05')).toBe(2024)
    expect(taxYearOf('2025-04-06')).toBe(2025)
  })
  it('handles January–March and the rest of the year', () => {
    expect(taxYearOf('2026-01-01')).toBe(2025)
    expect(taxYearOf('2025-12-31')).toBe(2025)
    expect(taxYearOf('2025-04-01')).toBe(2024)
    expect(taxYearOf('2025-05-01')).toBe(2025)
  })
  it('labels a Tax Year as start/end', () => {
    expect(taxYearLabel(2025)).toBe('2025/26')
    expect(taxYearLabel(1999)).toBe('1999/00')
  })
})

describe('summarise', () => {
  const base = { accounts: [cashA, cashB, sns], taxYear: 2025, table: DEFAULT_ALLOWANCE_TABLE }

  it('is all zero with no contributions', () => {
    const s = summarise({ ...base, contributions: [] })
    expect(s.used).toBe(0)
    expect(s.remaining).toBe(2_000_000)
    expect(s.usagePercent).toBe(0)
    expect(s.overContribution).toBe(0)
  })

  it('sums across accounts, including two of the same type', () => {
    const s = summarise({
      ...base,
      contributions: [c('a', 1000, '2025-06-01'), c('b', 2500, '2025-07-01'), c('s', 500, '2025-08-01')],
    })
    expect(s.used).toBe(400_000)
    expect(s.remaining).toBe(1_600_000)
    expect(s.usagePercent).toBe(20)
  })

  it('only counts contributions in the requested Tax Year', () => {
    const s = summarise({
      ...base,
      contributions: [c('a', 1000, '2025-04-05'), c('a', 2000, '2025-04-06'), c('a', 300, '2026-04-05'), c('a', 700, '2026-04-06')],
    })
    expect(s.used).toBe(230_000)
  })

  it('has no excess when exactly at the allowance', () => {
    const s = summarise({ ...base, contributions: [c('a', 20000, '2025-06-01')] })
    expect(s.remaining).toBe(0)
    expect(s.usagePercent).toBe(100)
    expect(s.overContribution).toBe(0)
  })

  it('reports one penny over as an excess of one penny', () => {
    const s = summarise({ ...base, contributions: [c('a', 20000.01, '2025-06-01')] })
    expect(s.remaining).toBe(0)
    expect(s.overContribution).toBe(1)
  })

  it('sums pence without floating-point error', () => {
    const s = summarise({
      ...base,
      contributions: [c('a', 0.1, '2025-06-01'), c('a', 0.2, '2025-06-02')],
    })
    expect(s.used).toBe(30)
  })

  it('uses the allowance row for the requested Tax Year', () => {
    const table: AllowanceTable = {
      2020: { isaAllowance: 1_000_000, lisaLimit: 400_000 },
      2025: { isaAllowance: 2_000_000, lisaLimit: 400_000 },
    }
    expect(summarise({ ...base, table, taxYear: 2020, contributions: [] }).allowance).toBe(1_000_000)
    expect(summarise({ ...base, table, taxYear: 2025, contributions: [] }).allowance).toBe(2_000_000)
  })

  it('falls back to the most recent known row for an unknown later year', () => {
    const table: AllowanceTable = {
      2020: { isaAllowance: 1_000_000, lisaLimit: 400_000 },
      2025: { isaAllowance: 3_000_000, lisaLimit: 400_000 },
    }
    expect(summarise({ ...base, table, taxYear: 2031, contributions: [] }).allowance).toBe(3_000_000)
    expect(summarise({ ...base, table, taxYear: 2022, contributions: [] }).allowance).toBe(1_000_000)
  })

  it('falls back to the earliest row for a year before the table starts', () => {
    const table: AllowanceTable = { 2020: { isaAllowance: 1_000_000, lisaLimit: 400_000 } }
    expect(summarise({ ...base, table, taxYear: 2010, contributions: [] }).allowance).toBe(1_000_000)
  })
})

describe('summarise status and Warning Threshold', () => {
  const base = { accounts: [cashA], taxYear: 2025, table: DEFAULT_ALLOWANCE_TABLE }
  const statusFor = (pounds: number, warningThreshold?: number) =>
    summarise({ ...base, warningThreshold, contributions: [c('a', pounds, '2025-06-01')] }).status

  it('has no warning below the default 90% threshold', () => {
    expect(statusFor(17999.99)).toBe('ok')
    expect(statusFor(0)).toBe('ok')
  })
  it('warns at exactly the threshold and above it, short of the allowance', () => {
    expect(statusFor(18000)).toBe('warning')
    expect(statusFor(19999.99)).toBe('warning')
  })
  it('is not over at exactly the allowance, but still warns', () => {
    expect(statusFor(20000)).toBe('warning')
  })
  it('is over one penny above the allowance, with the excess recorded', () => {
    const s = summarise({ ...base, contributions: [c('a', 20000.01, '2025-06-01')] })
    expect(s.status).toBe('over')
    expect(s.overContribution).toBe(1)
  })
  it('reports the correct excess for a large Over-contribution and keeps it recorded', () => {
    const s = summarise({ ...base, contributions: [c('a', 15000, '2025-06-01'), c('a', 7250.5, '2025-06-02')] })
    expect(s.used).toBe(2_225_050)
    expect(s.overContribution).toBe(225_050)
    expect(s.status).toBe('over')
  })
  it('lets a custom threshold move the trigger point', () => {
    expect(statusFor(10000, 50)).toBe('warning')
    expect(statusFor(9999.99, 50)).toBe('ok')
    expect(statusFor(18000, 95)).toBe('ok')
    expect(statusFor(19000, 95)).toBe('warning')
  })
  it('with a 100% threshold warns only once the allowance is reached', () => {
    expect(statusFor(19999.99, 100)).toBe('ok')
    expect(statusFor(20000, 100)).toBe('warning')
  })
  it('does not reduce usage for anything but Contributions (no Withdrawal concept)', () => {
    const s = summarise({ ...base, contributions: [c('a', 20000, '2025-06-01')] })
    expect(s.remaining).toBe(0)
  })
})

describe('summarise per-account breakdown', () => {
  const base = { accounts: [cashA, cashB, sns], taxYear: 2025, table: DEFAULT_ALLOWANCE_TABLE }
  const usedBy = (s: ReturnType<typeof summarise>) => Object.fromEntries(s.byAccount.map((r) => [r.accountId, r.used]))

  it('lists every account in order with the amount used in the Tax Year', () => {
    const s = summarise({
      ...base,
      contributions: [c('a', 1000, '2025-06-01'), c('s', 500, '2025-08-01'), c('a', 250.5, '2025-09-01')],
    })
    expect(s.byAccount.map((r) => r.accountId)).toEqual(['a', 'b', 's'])
    expect(usedBy(s)).toEqual({ a: 125_050, b: 0, s: 50_000 })
  })

  it('shows two accounts of the same type separately', () => {
    const s = summarise({ ...base, contributions: [c('a', 100, '2025-06-01'), c('b', 300, '2025-06-02')] })
    expect(usedBy(s).a).toBe(10_000)
    expect(usedBy(s).b).toBe(30_000)
  })

  it('gives £0 to an account with no Contribution in the Tax Year', () => {
    const s = summarise({ ...base, contributions: [c('a', 100, '2024-04-05'), c('a', 50, '2026-04-06')] })
    expect(usedBy(s)).toEqual({ a: 0, b: 0, s: 0 })
  })

  it('sums to the total used, including pence and an Over-contribution', () => {
    const s = summarise({
      ...base,
      contributions: [c('a', 0.1, '2025-06-01'), c('b', 0.2, '2025-06-02'), c('s', 20000, '2025-06-03')],
    })
    expect(s.byAccount.reduce((t, r) => t + r.used, 0)).toBe(s.used)
    expect(s.used).toBe(2_000_030)
  })

  it('is empty with no accounts', () => {
    expect(summarise({ ...base, accounts: [], contributions: [] }).byAccount).toEqual([])
  })
})

describe('summarise Lifetime ISA limit', () => {
  const base = { accounts: [cashA, lisaA, lisaB], taxYear: 2025, table: DEFAULT_ALLOWANCE_TABLE }
  const lisaFor = (pounds: [string, number][]) =>
    summarise({ ...base, contributions: pounds.map(([id, p]) => c(id, p, '2025-06-01')) })

  it('is zero used with the full limit remaining when there are no LISA contributions', () => {
    const s = summarise({ ...base, contributions: [c('a', 1000, '2025-06-01')] })
    expect(s.lisa).toEqual({ limit: 400_000, used: 0, remaining: 400_000, overContribution: 0, status: 'ok' })
  })
  it('combines several LISA accounts against the one limit', () => {
    const s = lisaFor([['l1', 1500], ['l2', 1000]])
    expect(s.lisa.used).toBe(250_000)
    expect(s.lisa.remaining).toBe(150_000)
  })
  it('counts LISA contributions towards the ISA Allowance too', () => {
    const s = summarise({ ...base, contributions: [c('l1', 4000, '2025-06-01'), c('a', 1000, '2025-06-02')] })
    expect(s.used).toBe(500_000)
    expect(s.remaining).toBe(1_500_000)
    expect(s.lisa.used).toBe(400_000)
  })
  it('ignores non-LISA accounts and other Tax Years', () => {
    const s = summarise({
      ...base,
      contributions: [c('a', 3000, '2025-06-01'), c('l1', 500, '2025-04-05'), c('l1', 200, '2025-04-06')],
    })
    expect(s.lisa.used).toBe(20_000)
  })
  it('is not over at exactly 4,000', () => {
    const s = lisaFor([['l1', 2500], ['l2', 1500]])
    expect(s.lisa.remaining).toBe(0)
    expect(s.lisa.overContribution).toBe(0)
    expect(s.lisa.status).toBe('ok')
  })
  it('is over by one penny at 4,000.01 and still records it', () => {
    const s = lisaFor([['l1', 4000.01]])
    expect(s.lisa.overContribution).toBe(1)
    expect(s.lisa.remaining).toBe(0)
    expect(s.lisa.status).toBe('over')
    expect(s.used).toBe(400_001)
  })
  it('gives no warning short of the limit, however close', () => {
    expect(lisaFor([['l1', 3999.99]]).lisa.status).toBe('ok')
    expect(lisaFor([['l1', 3600]], ).lisa.status).toBe('ok')
  })
  it('uses the LISA limit from the Tax Year row', () => {
    const table: AllowanceTable = { 2017: { isaAllowance: 2_000_000, lisaLimit: 400_000 }, 2030: { isaAllowance: 2_000_000, lisaLimit: 500_000 } }
    expect(summarise({ ...base, table, taxYear: 2030, contributions: [] }).lisa.limit).toBe(500_000)
  })
  it('does not let LISA contributions change ISA status rules (LISA over, allowance fine)', () => {
    const s = lisaFor([['l1', 5000]])
    expect(s.status).toBe('ok')
    expect(s.lisa.status).toBe('over')
  })
})

describe('browsing Tax Years', () => {
  // Distinct rows per era so a wrong row shows up in the numbers.
  const table: AllowanceTable = {
    2020: { isaAllowance: 1_000_000, lisaLimit: 400_000 },
    2024: { isaAllowance: 2_000_000, lisaLimit: 400_000 },
    2026: { isaAllowance: 3_000_000, lisaLimit: 500_000 },
  }
  const accounts = [cashA, lisaA]

  it('takes the current Tax Year from an injected date', () => {
    expect(currentTaxYear('2026-04-05')).toBe(2025)
    expect(currentTaxYear('2026-10-02')).toBe(2026)
  })

  it('rolls into the new Tax Year on 6 April, starting from zero used', () => {
    const contributions = [c('a', 5000, '2026-03-01'), c('l1', 1000, '2026-04-05')]
    const eve = summarise({ accounts, contributions, taxYear: currentTaxYear('2026-04-05'), table })
    const day = summarise({ accounts, contributions, taxYear: currentTaxYear('2026-04-06'), table })
    expect(eve.taxYear).toBe(2025)
    expect(eve.used).toBe(600_000)
    expect(day.taxYear).toBe(2026)
    expect(day.used).toBe(0)
    expect(day.remaining).toBe(3_000_000)
  })

  it('summarises a past year against that year’s own row, whatever later rows say', () => {
    const contributions = [c('a', 9000, '2021-05-01'), c('l1', 4500, '2021-06-01'), c('a', 100, '2026-05-01')]
    const past = summarise({ accounts, contributions, taxYear: 2021, table })
    expect(past.allowance).toBe(1_000_000)
    expect(past.used).toBe(1_350_000)
    expect(past.overContribution).toBe(350_000)
    expect(past.byAccount).toEqual([
      { accountId: 'a', used: 900_000 },
      { accountId: 'l1', used: 450_000 },
    ])
    expect(past.lisa.limit).toBe(400_000)
    expect(past.lisa.overContribution).toBe(50_000)
    // The newer row only applies from 2026 onwards.
    expect(summarise({ accounts, contributions, taxYear: 2026, table }).lisa.limit).toBe(500_000)
  })

  it('uses the latest known row for a future year with no row of its own', () => {
    const s = summarise({ accounts, contributions: [], taxYear: 2040, table })
    expect(s.allowance).toBe(3_000_000)
    expect(s.lisa.limit).toBe(500_000)
  })

  it('lists the current year plus every year with a Contribution, newest first', () => {
    const contributions = [c('a', 1, '2022-05-01'), c('a', 1, '2022-06-01'), c('a', 1, '2024-01-10'), c('a', 1, '2026-05-01')]
    expect(browsableTaxYears(contributions, 2026)).toEqual([2026, 2023, 2022])
  })

  it('lists just the current year when there are no Contributions', () => {
    expect(browsableTaxYears([], 2026)).toEqual([2026])
  })

  it('keeps a future-dated Contribution’s year browsable', () => {
    expect(browsableTaxYears([c('a', 1, '2027-09-01')], 2026)).toEqual([2027, 2026])
  })

  it('needs only one new table row for a policy change', () => {
    const next: AllowanceTable = { ...table, 2027: { isaAllowance: 1_500_000, lisaLimit: 400_000 } }
    expect(summarise({ accounts, contributions: [], taxYear: 2027, table: next }).allowance).toBe(1_500_000)
    expect(summarise({ accounts, contributions: [], taxYear: 2026, table: next }).allowance).toBe(3_000_000)
  })
})
