import { describe, expect, it } from 'vitest'
import { DEFAULT_ALLOWANCE_TABLE, summarise } from './allowance'
import { countAccountContributions, deleteAccount, editAccount, validateAccountInput } from './accounts'
import type { Contribution, IsaAccount } from './types'

const accounts = (): IsaAccount[] => [
  { id: 'a', name: 'Cash A', type: 'cash', provider: 'Bank' },
  { id: 'b', name: 'S&S B', type: 'stocks_and_shares', provider: 'Broker' },
  { id: 'c', name: 'Empty', type: 'cash', provider: 'Other' },
]
const contributions = (): Contribution[] => [
  { id: '1', accountId: 'a', amount: 100_000, date: '2025-06-01' },
  { id: '2', accountId: 'a', amount: 50_000, date: '2025-07-01' },
  { id: '3', accountId: 'b', amount: 200_000, date: '2025-08-01' },
]
const used = (state: { accounts: IsaAccount[]; contributions: Contribution[] }) =>
  summarise({ ...state, taxYear: 2025, table: DEFAULT_ALLOWANCE_TABLE }).used

describe('validateAccountInput', () => {
  it('trims name and provider', () => {
    expect(validateAccountInput({ name: ' Nest egg ', provider: ' Bank ' })).toEqual({
      ok: true,
      value: { name: 'Nest egg', provider: 'Bank' },
    })
  })
  it('rejects a blank name or provider with a message', () => {
    for (const input of [
      { name: '  ', provider: 'Bank' },
      { name: 'A', provider: '' },
    ]) {
      expect(validateAccountInput(input).ok).toBe(false)
    }
  })
})

describe('editAccount', () => {
  it('changes name and provider only, never the type, and keeps Contributions attached', () => {
    const next = editAccount(accounts(), 'a', { name: 'Renamed', provider: 'New Bank' })
    expect(next.find((a) => a.id === 'a')).toEqual({ id: 'a', name: 'Renamed', type: 'cash', provider: 'New Bank' })
    expect(next.find((a) => a.id === 'b')).toEqual(accounts()[1])
    expect(used({ accounts: next, contributions: contributions() })).toBe(350_000)
  })
  it('does not mutate the input and ignores an unknown id', () => {
    const before = accounts()
    editAccount(before, 'a', { name: 'X', provider: 'Y' })
    expect(before).toEqual(accounts())
    expect(editAccount(before, 'zzz', { name: 'X', provider: 'Y' })).toEqual(before)
  })
})

describe('countAccountContributions', () => {
  it('counts only that account’s Contributions', () => {
    expect(countAccountContributions(contributions(), 'a')).toBe(2)
    expect(countAccountContributions(contributions(), 'c')).toBe(0)
  })
})

describe('deleteAccount', () => {
  it('removes the account and all its Contributions, and the total drops', () => {
    const next = deleteAccount({ accounts: accounts(), contributions: contributions() }, 'a')
    expect(next.accounts.map((a) => a.id)).toEqual(['b', 'c'])
    expect(next.contributions.map((c) => c.id)).toEqual(['3'])
    expect(used(next)).toBe(200_000)
  })
  it('deletes an account with no Contributions without touching others', () => {
    const next = deleteAccount({ accounts: accounts(), contributions: contributions() }, 'c')
    expect(next.accounts.map((a) => a.id)).toEqual(['a', 'b'])
    expect(next.contributions).toEqual(contributions())
  })
})
