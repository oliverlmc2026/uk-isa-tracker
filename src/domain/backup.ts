import type { AppState } from '../storage'
import { validateAccountInput } from './accounts'
import { isRealDate } from './contributions'
import { validateWarningThreshold } from './settings'
import type { Contribution, IsaAccount } from './types'

export const BACKUP_APP = 'uk-isa-tracker'
/** Bump when the backup shape changes, so import (ticket 09) can tell old files from new. */
export const BACKUP_SCHEMA_VERSION = 1

/**
 * The warning threshold is a user setting living outside AppState, but it is
 * part of "all your data", so the backup carries it under `data.settings`.
 */
export function serialiseBackup(state: AppState, warningThreshold: number, exportedAt: Date): string {
  return JSON.stringify(
    {
      app: BACKUP_APP,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: exportedAt.toISOString(),
      data: {
        accounts: state.accounts,
        contributions: state.contributions,
        settings: { warningThreshold },
      },
    },
    null,
    2,
  )
}

/** `isoDate` is YYYY-MM-DD; dated names keep repeated backups from overwriting each other. */
export const backupFilename = (isoDate: string) => `${BACKUP_APP}-backup-${isoDate}.json`

export type BackupParseResult =
  | { ok: true; value: { state: AppState; warningThreshold: number } }
  | { ok: false; error: string }

const ACCOUNT_TYPES = ['cash', 'stocks_and_shares', 'lifetime']
const NOT_A_BACKUP = 'This file is not a UK ISA Tracker backup.'

const fail = (error: string): BackupParseResult => ({ ok: false, error })
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''

/**
 * Pure: checks a backup file's text without touching stored data, so a rejected
 * file can never alter anything. Every field is validated, not just the envelope,
 * because the result replaces the user's data wholesale.
 */
export function parseBackup(text: string): BackupParseResult {
  let file: unknown
  try {
    file = JSON.parse(text)
  } catch {
    return fail('This file is not a valid JSON file.')
  }
  if (!isRecord(file) || file.app !== BACKUP_APP) return fail(NOT_A_BACKUP)
  if (file.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    const found = typeof file.schemaVersion === 'number' ? `version ${file.schemaVersion}` : 'an unknown version'
    return fail(`This backup uses ${found}, which is not supported. This app reads version ${BACKUP_SCHEMA_VERSION}.`)
  }
  const data = file.data
  if (!isRecord(data)) return fail('The backup’s data section is missing or damaged.')
  if (!Array.isArray(data.accounts)) return fail('The backup’s accounts are missing or damaged.')
  if (!Array.isArray(data.contributions)) return fail('The backup’s contributions are missing or damaged.')
  if (!isRecord(data.settings)) return fail('The backup’s settings are missing or damaged.')

  const threshold = data.settings.warningThreshold
  const checkedThreshold = typeof threshold === 'number' ? validateWarningThreshold(String(threshold)) : null
  if (!checkedThreshold?.ok) return fail('The backup’s warning threshold must be a whole number from 1 to 100.')

  const accounts: IsaAccount[] = []
  const accountIds = new Set<string>()
  for (const [i, raw] of data.accounts.entries()) {
    const valid =
      isRecord(raw) && isText(raw.id) && typeof raw.name === 'string' && typeof raw.provider === 'string' &&
      ACCOUNT_TYPES.includes(raw.type as string)
    const checked = valid ? validateAccountInput({ name: raw.name as string, provider: raw.provider as string }) : null
    if (!valid || !checked?.ok) return fail(`Account ${i + 1} in the backup is missing details or damaged.`)
    if (accountIds.has(raw.id as string)) return fail(`The backup lists account ${i + 1} more than once (duplicate id).`)
    accountIds.add(raw.id as string)
    accounts.push({ id: raw.id as string, type: raw.type as IsaAccount['type'], ...checked.value })
  }

  const contributions: Contribution[] = []
  const contributionIds = new Set<string>()
  for (const [i, raw] of data.contributions.entries()) {
    const valid =
      isRecord(raw) && isText(raw.id) && isText(raw.accountId) && Number.isInteger(raw.amount) &&
      (raw.amount as number) > 0 && typeof raw.date === 'string' && isRealDate(raw.date)
    if (!valid) return fail(`Contribution ${i + 1} in the backup is missing details or damaged.`)
    if (!accountIds.has(raw.accountId as string)) return fail(`Contribution ${i + 1} in the backup belongs to an account that is not in the file.`)
    if (contributionIds.has(raw.id as string)) return fail(`The backup lists contribution ${i + 1} more than once (duplicate id).`)
    contributionIds.add(raw.id as string)
    contributions.push({ id: raw.id as string, accountId: raw.accountId as string, amount: raw.amount as number, date: raw.date as string })
  }

  return { ok: true, value: { state: { accounts, contributions }, warningThreshold: checkedThreshold.value } }
}
