import type { Contribution, IsaAccount } from './types'

export type AccountInput = { name: string; provider: string }
export type AccountValidation =
  | { ok: true; value: AccountInput }
  | { ok: false; error: string }

/** Shared by add and edit so both reject the same bad input. */
export function validateAccountInput(input: AccountInput): AccountValidation {
  const name = input.name.trim()
  const provider = input.provider.trim()
  if (!name) return { ok: false, error: 'Enter a name for the account.' }
  if (!provider) return { ok: false, error: 'Enter the provider that holds the account.' }
  return { ok: true, value: { name, provider } }
}

/** The account type is deliberately not editable. */
export function editAccount(accounts: IsaAccount[], id: string, change: AccountInput): IsaAccount[] {
  return accounts.map((a) => (a.id === id ? { ...a, ...change } : a))
}

export function countAccountContributions(contributions: Contribution[], accountId: string): number {
  return contributions.filter((c) => c.accountId === accountId).length
}

/** Deleting an account takes all of its Contributions with it. */
export function deleteAccount(
  state: { accounts: IsaAccount[]; contributions: Contribution[] },
  id: string,
): { accounts: IsaAccount[]; contributions: Contribution[] } {
  return {
    accounts: state.accounts.filter((a) => a.id !== id),
    contributions: state.contributions.filter((c) => c.accountId !== id),
  }
}
