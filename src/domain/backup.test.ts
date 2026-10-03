import { describe, expect, it } from 'vitest'
import { BACKUP_APP, BACKUP_SCHEMA_VERSION, backupFilename, parseBackup, serialiseBackup } from './backup'
import type { Contribution, IsaAccount } from './types'

const accounts: IsaAccount[] = [
  { id: 'a1', name: 'Easy saver', type: 'cash', provider: 'Monzo' },
  { id: 'a2', name: 'Retirement', type: 'lifetime', provider: 'Moneybox' },
]
const contributions: Contribution[] = [
  { id: 'c1', accountId: 'a1', amount: 150050, date: '2025-05-01' },
  { id: 'c2', accountId: 'a2', amount: 40000, date: '2025-06-10' },
]
const exportedAt = new Date('2026-10-02T09:30:00.000Z')

describe('serialiseBackup', () => {
  it('contains every account, contribution and the warning threshold', () => {
    const backup = JSON.parse(serialiseBackup({ accounts, contributions }, 75, exportedAt))
    expect(backup.data.accounts).toEqual(accounts)
    expect(backup.data.contributions).toEqual(contributions)
    expect(backup.data.settings).toEqual({ warningThreshold: 75 })
  })
  it('carries the app name, schema version and export time', () => {
    const backup = JSON.parse(serialiseBackup({ accounts, contributions }, 90, exportedAt))
    expect(backup.app).toBe(BACKUP_APP)
    expect(backup.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
    expect(BACKUP_SCHEMA_VERSION).toBe(1)
    expect(backup.exportedAt).toBe('2026-10-02T09:30:00.000Z')
  })
  it('exports an empty state as a valid empty backup', () => {
    const backup = JSON.parse(serialiseBackup({ accounts: [], contributions: [] }, 90, exportedAt))
    expect(backup.schemaVersion).toBe(1)
    expect(backup.data).toEqual({ accounts: [], contributions: [], settings: { warningThreshold: 90 } })
  })
  it('round-trips through JSON without losing or altering data', () => {
    const state = { accounts, contributions }
    const backup = JSON.parse(serialiseBackup(state, 80, exportedAt))
    expect({ accounts: backup.data.accounts, contributions: backup.data.contributions }).toEqual(state)
  })
  it('keeps contribution amounts as integer pence', () => {
    const backup = JSON.parse(serialiseBackup({ accounts, contributions }, 90, exportedAt))
    for (const c of backup.data.contributions) expect(Number.isInteger(c.amount)).toBe(true)
  })
  it('is pretty-printed so the file can be read and diffed by hand', () => {
    expect(serialiseBackup({ accounts: [], contributions: [] }, 90, exportedAt)).toContain('\n  "schemaVersion": 1')
  })
})

describe('backupFilename', () => {
  it('is dated so repeated backups do not overwrite each other', () => {
    expect(backupFilename('2026-10-02')).toBe('uk-isa-tracker-backup-2026-10-02.json')
  })
})

describe('parseBackup round trip', () => {
  it('restores accounts, contributions and threshold exactly', () => {
    const result = parseBackup(serialiseBackup({ accounts, contributions }, 75, exportedAt))
    expect(result).toEqual({ ok: true, value: { state: { accounts, contributions }, warningThreshold: 75 } })
  })
  it('restores an empty state', () => {
    const result = parseBackup(serialiseBackup({ accounts: [], contributions: [] }, 90, exportedAt))
    expect(result).toEqual({ ok: true, value: { state: { accounts: [], contributions: [] }, warningThreshold: 90 } })
  })
})

describe('parseBackup rejection', () => {
  const good = () => JSON.parse(serialiseBackup({ accounts, contributions }, 75, exportedAt))
  const reject = (input: unknown, message: RegExp) => {
    const result = parseBackup(typeof input === 'string' ? input : JSON.stringify(input))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(message)
  }

  it('rejects text that is not JSON', () => {
    reject('', /not a valid JSON/i)
    reject('{"app": "uk-isa-tracker",', /not a valid JSON/i)
    reject('<html></html>', /not a valid JSON/i)
  })
  it('rejects JSON that is not a backup object', () => {
    for (const v of [null, 42, '"text"', [], true]) reject(v, /not a UK ISA Tracker backup/i)
  })
  it('rejects a backup from another app', () => {
    reject({ ...good(), app: 'other-app' }, /not a UK ISA Tracker backup/i)
    const { app: _app, ...noApp } = good()
    reject(noApp, /not a UK ISA Tracker backup/i)
  })
  it('rejects unsupported schema versions', () => {
    reject({ ...good(), schemaVersion: 2 }, /version 2.*not supported/i)
    reject({ ...good(), schemaVersion: 0 }, /not supported/i)
    reject({ ...good(), schemaVersion: '1' }, /not supported/i)
    const { schemaVersion: _v, ...noVersion } = good()
    reject(noVersion, /not supported/i)
  })
  it('rejects a missing or malformed data section', () => {
    reject({ ...good(), data: undefined }, /missing or damaged/i)
    reject({ ...good(), data: [] }, /missing or damaged/i)
    reject({ ...good(), data: { ...good().data, accounts: 'x' } }, /accounts/i)
    reject({ ...good(), data: { ...good().data, contributions: {} } }, /contributions/i)
    reject({ ...good(), data: { ...good().data, settings: undefined } }, /settings/i)
  })
  it('rejects an invalid warning threshold', () => {
    for (const bad of [0, 101, 90.5, '90', null]) {
      reject({ ...good(), data: { ...good().data, settings: { warningThreshold: bad } } }, /warning threshold/i)
    }
  })
  it('rejects malformed accounts', () => {
    const withAccount = (a: unknown) => ({ ...good(), data: { ...good().data, accounts: [a] } })
    reject(withAccount(null), /account 1/i)
    reject(withAccount({ ...accounts[0], id: '' }), /account 1/i)
    reject(withAccount({ ...accounts[0], name: '  ' }), /account 1/i)
    reject(withAccount({ ...accounts[0], provider: 5 }), /account 1/i)
    reject(withAccount({ ...accounts[0], type: 'pension' }), /account 1/i)
  })
  it('rejects duplicate account or contribution ids', () => {
    reject({ ...good(), data: { ...good().data, accounts: [accounts[0], accounts[0]] } }, /duplicate/i)
    reject({ ...good(), data: { ...good().data, contributions: [contributions[0], contributions[0]] } }, /duplicate/i)
  })
  it('rejects malformed contributions', () => {
    const withContribution = (c: unknown) => ({ ...good(), data: { ...good().data, contributions: [c] } })
    reject(withContribution(null), /contribution 1/i)
    reject(withContribution({ ...contributions[0], amount: 12.5 }), /contribution 1/i)
    reject(withContribution({ ...contributions[0], amount: 0 }), /contribution 1/i)
    reject(withContribution({ ...contributions[0], amount: '100' }), /contribution 1/i)
    reject(withContribution({ ...contributions[0], date: '2025-02-30' }), /contribution 1/i)
    reject(withContribution({ ...contributions[0], date: '1 May 2025' }), /contribution 1/i)
    reject(withContribution({ ...contributions[0], accountId: 'missing' }), /contribution 1.*account/i)
  })
  it('does not modify the state it is compared against', () => {
    const current = { accounts: [...accounts], contributions: [...contributions] }
    const before = JSON.stringify(current)
    parseBackup('not json')
    parseBackup(JSON.stringify({ ...good(), schemaVersion: 9 }))
    expect(JSON.stringify(current)).toBe(before)
  })
})
