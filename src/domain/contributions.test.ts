import { describe, expect, it } from 'vitest'
import { DEFAULT_ALLOWANCE_TABLE, summarise } from './allowance'
import { deleteContribution, editContribution, validateContributionInput } from './contributions'
import type { Contribution, IsaAccount } from './types'

const acct: IsaAccount = { id: 'a', name: 'Cash A', type: 'cash', provider: 'Bank' }
const list = (): Contribution[] => [
  { id: '1', accountId: 'a', amount: 100_000, date: '2025-06-01' },
  { id: '2', accountId: 'a', amount: 50_000, date: '2025-07-01' },
]
const used = (cs: Contribution[], taxYear: number) =>
  summarise({ accounts: [acct], contributions: cs, taxYear, table: DEFAULT_ALLOWANCE_TABLE }).used

describe('validateContributionInput', () => {
  it('accepts a valid amount and date as integer pence', () => {
    expect(validateContributionInput({ amount: '250.50', date: '2025-06-01' })).toEqual({
      ok: true,
      value: { amount: 25050, date: '2025-06-01' },
    })
  })
  it('rejects zero, negative, non-numeric and sub-penny amounts with a message', () => {
    for (const amount of ['0', '0.00', '-5', 'abc', '', '1.234']) {
      const r = validateContributionInput({ amount, date: '2025-06-01' })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toMatch(/amount/i)
    }
  })
  it('rejects a missing or impossible date', () => {
    for (const date of ['', 'nope', '2025-02-30', '2025-13-01']) {
      const r = validateContributionInput({ amount: '10', date })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toMatch(/date/i)
    }
  })
})

describe('editContribution', () => {
  it('changes amount and date of one Contribution, leaving the others', () => {
    const next = editContribution(list(), '1', { amount: 20_000, date: '2025-06-02' })
    expect(next.find((c) => c.id === '1')).toMatchObject({ amount: 20_000, date: '2025-06-02', accountId: 'a' })
    expect(next.find((c) => c.id === '2')).toEqual(list()[1])
    expect(used(next, 2025)).toBe(70_000)
  })
  it('moves a Contribution into the other Tax Year when the date crosses 5/6 April', () => {
    const next = editContribution(list(), '1', { amount: 100_000, date: '2026-04-05' })
    expect(used(next, 2025)).toBe(150_000)
    const later = editContribution(list(), '1', { amount: 100_000, date: '2026-04-06' })
    expect(used(later, 2025)).toBe(50_000)
    expect(used(later, 2026)).toBe(100_000)
  })
  it('does not mutate the input and ignores an unknown id', () => {
    const before = list()
    editContribution(before, '1', { amount: 1, date: '2025-06-01' })
    expect(before).toEqual(list())
    expect(editContribution(before, 'zzz', { amount: 1, date: '2025-06-01' })).toEqual(before)
  })
})

describe('deleteContribution', () => {
  it('removes only the chosen Contribution and the total drops', () => {
    const next = deleteContribution(list(), '1')
    expect(next.map((c) => c.id)).toEqual(['2'])
    expect(used(next, 2025)).toBe(50_000)
  })
})
