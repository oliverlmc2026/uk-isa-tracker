import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_ALLOWANCE_TABLE, browsableTaxYears, currentTaxYear, summarise, taxYearLabel, taxYearOf } from '../domain/allowance'
import { countAccountContributions, deleteAccount, editAccount, validateAccountInput } from '../domain/accounts'
import { deleteContribution, editContribution, validateContributionInput } from '../domain/contributions'
import { newId } from '../domain/id'
import { formatPounds, formatPoundsWhole } from '../domain/money'
import type { AccountType, Contribution, IsaAccount } from '../domain/types'
import { backupFilename, parseBackup, serialiseBackup } from '../domain/backup'
import { validateWarningThreshold } from '../domain/settings'
import type { AppState } from '../storage'
import { loadState, loadWarningThreshold, saveState, saveWarningThreshold } from '../storage'
import { LangContext, MESSAGES, loadLang, loadTheme, saveLang, saveTheme, translateError, useLang } from './i18n'
import type { Lang, Theme } from './i18n'
import { ConfirmProvider, useConfirm } from './Confirm'
import { Nav } from './Nav'
import { UpdatePrompt } from './UpdatePrompt'
import { useRoute } from './useRoute'

const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function App() {
  const [lang, setLang] = useState<Lang>(loadLang)
  useEffect(() => {
    saveLang(lang)
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en'
  }, [lang])
  const [theme, setTheme] = useState<Theme>(loadTheme)
  useEffect(() => {
    saveTheme(theme)
    // 'auto' removes the attribute so the stylesheet follows prefers-color-scheme.
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.dataset.theme = theme
  }, [theme])
  return (
    <LangContext.Provider value={{ lang, m: MESSAGES[lang] }}>
      <ConfirmProvider>
        <Tracker lang={lang} onLangChange={setLang} theme={theme} onThemeChange={setTheme} />
      </ConfirmProvider>
    </LangContext.Provider>
  )
}

function Tracker({
  lang,
  onLangChange,
  theme,
  onThemeChange,
}: {
  lang: Lang
  onLangChange: (lang: Lang) => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
}) {
  const { m } = useLang()
  const route = useRoute()
  const [state, setState] = useState(loadState)
  useEffect(() => saveState(state), [state])
  const [threshold, setThreshold] = useState(loadWarningThreshold)
  useEffect(() => saveWarningThreshold(threshold), [threshold])

  // Re-read the date so a tab left open rolls into the new Tax Year on 6 April.
  const [today, setToday] = useState(todayIso)
  useEffect(() => {
    const refresh = () => setToday(todayIso())
    const timer = setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  // The add form folds away after a save; the confirmation and row highlight say where the account went.
  const [added, setAdded] = useState<{ id: string; name: string } | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [toast, setToast] = useState<{ key: string; amount: number; account: string } | null>(null)
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])
  useEffect(() => setAdded(null), [route])
  const thisYear = currentTaxYear(today)
  // null follows the current Tax Year, so the default view moves on at rollover.
  const [picked, setPicked] = useState<number | null>(null)
  const years = browsableTaxYears(state.contributions, thisYear)
  // A pick whose last Contribution was deleted or moved falls back to the current year.
  const taxYear = picked !== null && years.includes(picked) ? picked : thisYear
  const summary = useMemo(
    () =>
      summarise({
        ...state,
        taxYear,
        table: DEFAULT_ALLOWANCE_TABLE,
        warningThreshold: threshold,
      }),
    [state, taxYear, threshold],
  )

  // The id is made outside the updater so the confirmation can point at the new row.
  const addAccount = (account: Omit<IsaAccount, 'id'>) => {
    const id = newId()
    setState((s) => ({ ...s, accounts: [...s.accounts, { ...account, id }] }))
    setAdded({ id, name: account.name })
    setAddOpen(false)
  }
  const changeAccount = (id: string, change: { name: string; provider: string }) => setState((s) => ({ ...s, accounts: editAccount(s.accounts, id, change) }))
  const removeAccount = (id: string) => setState((s) => deleteAccount(s, id))
  const addContribution = (c: Omit<Contribution, 'id'>) => {
    const id = newId()
    setState((s) => ({
      ...s,
      contributions: [...s.contributions, { ...c, id }],
    }))
    setToast({ key: id, amount: c.amount, account: state.accounts.find((a) => a.id === c.accountId)?.name ?? '' })
  }
  const changeContribution = (id: string, change: { amount: number; date: string }) =>
    setState((s) => ({
      ...s,
      contributions: editContribution(s.contributions, id, change),
    }))
  const removeContribution = (id: string) =>
    setState((s) => ({
      ...s,
      contributions: deleteContribution(s.contributions, id),
    }))
  const restore = (restored: AppState, warningThreshold: number) => {
    setState(restored)
    setThreshold(warningThreshold)
    setPicked(null)
  }

  return (
    <main>
      <header className="masthead">
        <h1>UK ISA Tracker v3</h1>
      </header>

      <Nav route={route} />
      <UpdatePrompt />
      {toast && (
        <p className="toast" role="status" key={toast.key}>
          {m.contributionAdded(formatPounds(toast.amount), toast.account)}
        </p>
      )}

      {route === 'settings' ? (
        <>
          <section>
            <h2>{m.preferences}</h2>
            <div className="masthead-controls">
              <label className="year-picker">
                {m.language}
                <select value={lang} onChange={(e) => onLangChange(e.target.value as Lang)}>
                  <option value="zh">繁體中文</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label className="year-picker">
                {m.theme}
                <select value={theme} onChange={(e) => onThemeChange(e.target.value as Theme)}>
                  <option value="auto">{m.themeAuto}</option>
                  <option value="light">{m.themeLight}</option>
                  <option value="dark">{m.themeDark}</option>
                </select>
              </label>
            </div>
          </section>
          {state.accounts.length > 0 && <Settings key={threshold} threshold={threshold} onChange={setThreshold} />}
          <Backup state={state} threshold={threshold} today={today} onRestore={restore} />
        </>
      ) : state.accounts.length === 0 ? (
        <section className="intro">
          <h2>{m.introTitle}</h2>
          <p>{m.introBody}</p>
          <AccountForm onSubmit={addAccount} />
          <IsaInfo open />
        </section>
      ) : route === 'overview' ? (
        <>
          <label className="year-picker overview-year">
            {m.taxYear}
            <select value={taxYear} onChange={(e) => setPicked(Number(e.target.value) === thisYear ? null : Number(e.target.value))}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {taxYearLabel(y)}
                  {y === thisYear ? m.current : ''}
                </option>
              ))}
            </select>
          </label>
          <Dashboard summary={summary} threshold={threshold} isCurrent={taxYear === thisYear} hasLisa={state.accounts.some((a) => a.type === 'lifetime')} />
          <AccountBreakdown summary={summary} accounts={state.accounts} />
          <IsaInfo />
        </>
      ) : route === 'contributions' ? (
        <>
          <section>
            <h2>{m.recordContribution}</h2>
            <ContributionForm key={state.accounts.map((a) => a.id).join()} accounts={state.accounts} onSubmit={addContribution} />
          </section>
          <ContributionList state={state} onEdit={changeContribution} onDelete={removeContribution} />
        </>
      ) : (
        <section>
          <h2>{m.yourAccounts}</h2>
          {added && (
            <p className="added" role="status" key={added.id}>
              {m.accountAdded(added.name)}
            </p>
          )}
          <AccountList
            accounts={state.accounts}
            contributions={state.contributions}
            highlightId={added?.id ?? null}
            onEdit={changeAccount}
            onDelete={removeAccount}
          />
          <details open={addOpen} onToggle={(e) => setAddOpen(e.currentTarget.open)}>
            <summary>{m.addAnotherAccount}</summary>
            <AccountForm onSubmit={addAccount} />
          </details>
        </section>
      )}
      <footer className="disclaimer">
        <p>{m.disclaimer}</p>
      </footer>
    </main>
  )
}

function IsaInfo({ open }: { open?: boolean }) {
  const { m } = useLang()
  return (
    <details className="isa-info" open={open}>
      <summary>{m.isaInfoTitle}</summary>
      <ul>
        {m.isaInfoPoints.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </details>
  )
}

function Dashboard({
  summary,
  threshold,
  isCurrent,
  hasLisa,
}: {
  summary: ReturnType<typeof summarise>
  threshold: number
  isCurrent: boolean
  hasLisa: boolean
}) {
  const { m } = useLang()
  const fill = Math.min(100, summary.usagePercent)
  const pct = Math.round(summary.usagePercent * 10) / 10
  const headline =
    summary.overContribution > 0
      ? m.overAllowance(formatPounds(summary.overContribution))
      : summary.remaining === 0
        ? m.allowanceFullyUsed
        : m.leftToUse(formatPounds(summary.remaining))
  const ticks = [0, 1, 2, 3, 4].map((i) => (summary.allowance * i) / 4)

  return (
    <section className={`hero ${summary.status}`} aria-labelledby="hero-title">
      <h2 id="hero-title">
        {m.taxYearHeading(taxYearLabel(summary.taxYear))}
        {!isCurrent && m.past}
      </h2>
      <p className="hero-figure">{headline}</p>
      <p className="hero-note">{m.heroNote(formatPounds(summary.used), pct, formatPoundsWhole(summary.allowance))}</p>
      {summary.status === 'warning' && (
        <p className="alert" role="status">
          {m.warningAlert(pct, threshold)}
        </p>
      )}
      {summary.status === 'over' && (
        <p className="alert" role="alert">
          {m.overAlert(formatPounds(summary.overContribution), formatPoundsWhole(summary.allowance))}
        </p>
      )}
      <p className="hero-rule">{m.heroRule}</p>
      <div
        className="ruler"
        role="meter"
        aria-label={m.meterAllowance}
        aria-valuemin={0}
        aria-valuemax={summary.allowance / 100}
        aria-valuenow={summary.used / 100}
        aria-valuetext={m.meterText(formatPounds(summary.used), formatPounds(summary.allowance))}
      >
        <div className="ruler-track">
          <div className="ruler-fill" style={{ width: `${fill}%` }} />
        </div>
        <div className="ruler-ticks" aria-hidden="true">
          {ticks.map((t, i) => (
            <span key={i} style={{ left: `${i * 25}%` }}>
              {formatPoundsWhole(t)}
            </span>
          ))}
        </div>
      </div>
      {hasLisa && <LisaLimit lisa={summary.lisa} />}
    </section>
  )
}

/** Combined limit across every Lifetime ISA; it only ever warns once exceeded. */
function LisaLimit({ lisa }: { lisa: ReturnType<typeof summarise>['lisa'] }) {
  const { m } = useLang()
  const fill = Math.min(100, (lisa.used / lisa.limit) * 100)
  return (
    <div className={`lisa ${lisa.status}`}>
      <h3>{m.lisaTitle}</h3>
      <p className="lisa-figure">{lisa.status === 'over' ? m.lisaOver(formatPounds(lisa.overContribution)) : m.lisaLeft(formatPounds(lisa.remaining))}</p>
      <p className="lisa-note">{m.lisaNote(formatPounds(lisa.used), formatPoundsWhole(lisa.limit))}</p>
      {lisa.status === 'over' && (
        <p className="alert" role="alert">
          {m.lisaAlert(formatPounds(lisa.overContribution), formatPoundsWhole(lisa.limit))}
        </p>
      )}
      <div
        className="lisa-track"
        role="meter"
        aria-label={m.meterLisa}
        aria-valuemin={0}
        aria-valuemax={lisa.limit / 100}
        aria-valuenow={lisa.used / 100}
        aria-valuetext={m.meterText(formatPounds(lisa.used), formatPounds(lisa.limit))}
      >
        <div className="ruler-fill" style={{ width: `${fill}%` }} />
      </div>
    </div>
  )
}

function AccountBreakdown({ summary, accounts }: { summary: ReturnType<typeof summarise>; accounts: IsaAccount[] }) {
  const { m } = useLang()
  const byId = new Map(accounts.map((a) => [a.id, a]))
  return (
    <section aria-labelledby="breakdown-title">
      <h2 id="breakdown-title">{m.breakdownTitle(taxYearLabel(summary.taxYear))}</h2>
      <table className="ledger">
        <thead>
          <tr>
            <th scope="col">{m.account}</th>
            <th scope="col" className="num">
              {m.paidIn}
            </th>
          </tr>
        </thead>
        <tbody>
          {summary.byAccount.map((row) => {
            const account = byId.get(row.accountId)
            if (!account) return null
            return (
              <tr key={row.accountId}>
                <td>
                  <strong>{account.name}</strong>
                  <span className="sub">{m.typeAtProvider(m.typeLabel[account.type], account.provider)}</span>
                </td>
                <td className="num">{formatPounds(row.used)}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">{m.total}</th>
            <td className="num">{formatPounds(summary.used)}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  )
}

function AccountForm({ onSubmit }: { onSubmit: (a: Omit<IsaAccount, 'id'>) => void }) {
  const { m } = useLang()
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('cash')
  const [provider, setProvider] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const result = validateAccountInput({ name, provider })
        if (!result.ok) return
        onSubmit({ ...result.value, type })
        setName('')
        setProvider('')
      }}
    >
      <label>
        {m.name}
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <fieldset className="type-choice">
        <legend>{m.type}</legend>
        {Object.entries(m.typeLabel).map(([value, label]) => (
          <label key={value}>
            <input type="radio" name="account-type" value={value} checked={type === value} onChange={() => setType(value as AccountType)} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <label>
        {m.provider}
        <input value={provider} onChange={(e) => setProvider(e.target.value)} required />
      </label>
      <button type="submit">{m.addAccount}</button>
    </form>
  )
}

function AccountList({
  accounts,
  contributions,
  highlightId,
  onEdit,
  onDelete,
}: {
  accounts: IsaAccount[]
  contributions: Contribution[]
  highlightId: string | null
  onEdit: (id: string, change: { name: string; provider: string }) => void
  onDelete: (id: string) => void
}) {
  const { m } = useLang()
  const confirm = useConfirm()
  const [editingId, setEditingId] = useState<string | null>(null)
  // Bring a just-added row into view: on a phone the add form sits below the list.
  useEffect(() => {
    if (highlightId) document.getElementById(`account-${highlightId}`)?.scrollIntoView({ block: 'nearest' })
  }, [highlightId])
  return (
    <ul className="accounts">
      {accounts.map((a) =>
        editingId === a.id ? (
          <li key={a.id} className="editing">
            <AccountEditForm
              account={a}
              onSave={(change) => {
                onEdit(a.id, change)
                setEditingId(null)
              }}
              onCancel={() => setEditingId(null)}
            />
          </li>
        ) : (
          <li key={a.id} id={`account-${a.id}`} className={a.id === highlightId ? 'just-added' : undefined}>
            <strong>{a.name}</strong>
            <span>{m.typeAtProvider(m.typeLabel[a.type], a.provider)}</span>
            <div className="account-actions">
              <button type="button" className="link" onClick={() => setEditingId(a.id)}>
                {m.edit}
                <span className="sr-only"> {a.name}</span>
              </button>
              <button
                type="button"
                className="link danger"
                onClick={async () => {
                  const n = countAccountContributions(contributions, a.id)
                  const effect = n === 0 ? m.noContributions : m.alsoDeleteContributions(n)
                  if (await confirm(m.confirmDeleteAccount(a.name, effect), m.delete)) onDelete(a.id)
                }}
              >
                {m.delete}
                <span className="sr-only"> {a.name}</span>
              </button>
            </div>
          </li>
        ),
      )}
    </ul>
  )
}

function AccountEditForm({
  account,
  onSave,
  onCancel,
}: {
  account: IsaAccount
  onSave: (change: { name: string; provider: string }) => void
  onCancel: () => void
}) {
  const { m, lang } = useLang()
  const [name, setName] = useState(account.name)
  const [provider, setProvider] = useState(account.provider)
  const [error, setError] = useState('')

  return (
    <form
      className="edit-form"
      onSubmit={(e) => {
        e.preventDefault()
        const result = validateAccountInput({ name, provider })
        if (!result.ok) {
          setError(translateError(result.error, lang))
          return
        }
        onSave(result.value)
      }}
    >
      <p className="edit-for">{m.editing(m.typeLabel[account.type])}</p>
      <label>
        {m.name}
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </label>
      <label>
        {m.provider}
        <input value={provider} onChange={(e) => setProvider(e.target.value)} />
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="edit-buttons">
        <button type="submit">{m.saveChanges}</button>
        <button type="button" className="secondary" onClick={onCancel}>
          {m.cancel}
        </button>
      </div>
    </form>
  )
}

function ContributionForm({ accounts, onSubmit }: { accounts: IsaAccount[]; onSubmit: (c: Omit<Contribution, 'id'>) => void }) {
  const { m, lang } = useLang()
  const [accountId, setAccountId] = useState(accounts[0].id)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayIso)
  const [error, setError] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const result = validateContributionInput({ amount, date })
        if (!result.ok) {
          setError(translateError(result.error, lang))
          return
        }
        setError('')
        onSubmit({ accountId, ...result.value })
        setAmount('')
      }}
    >
      <label>
        {m.account}
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {m.amountInPounds}
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </label>
      <label>
        {m.date}
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button type="submit">{m.addContribution}</button>
    </form>
  )
}

function ContributionList({
  state,
  onEdit,
  onDelete,
}: {
  state: ReturnType<typeof loadState>
  onEdit: (id: string, change: { amount: number; date: string }) => void
  onDelete: (id: string) => void
}) {
  const { m } = useLang()
  const confirm = useConfirm()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all')
  const years = [...new Set(state.contributions.map((c) => taxYearOf(c.date)))].sort((a, b) => b - a)
  // A pick whose last Contribution was deleted or moved falls back to all years.
  const filter = yearFilter !== 'all' && years.includes(yearFilter) ? yearFilter : 'all'
  // Newest date first; on the same date the most recently added comes first (reverse, then a stable sort).
  const sorted = [...state.contributions]
    .reverse()
    .filter((c) => filter === 'all' || taxYearOf(c.date) === filter)
    .sort((a, b) => b.date.localeCompare(a.date))
  if (state.contributions.length === 0) return null
  const names = new Map(state.accounts.map((a) => [a.id, a.name]))
  return (
    <section>
      <h2>{m.contributions}</h2>
      <label className="year-picker">
        {m.taxYear}
        <select value={filter} onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
          <option value="all">{m.allYears}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {taxYearLabel(y)}
            </option>
          ))}
        </select>
      </label>
      <table className="ledger">
        <thead>
          <tr>
            <th scope="col">{m.date}</th>
            <th scope="col">{m.account}</th>
            <th scope="col">{m.taxYear}</th>
            <th scope="col" className="num">
              {m.amount}
            </th>
            <th scope="col">
              <span className="sr-only">{m.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) =>
            editingId === c.id ? (
              <ContributionEditRow
                key={c.id}
                contribution={c}
                accountName={names.get(c.accountId)}
                onSave={(change) => {
                  onEdit(c.id, change)
                  setEditingId(null)
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <tr key={c.id}>
                <td>{c.date}</td>
                <td>{names.get(c.accountId)}</td>
                <td>{taxYearLabel(taxYearOf(c.date))}</td>
                <td className="num">{formatPounds(c.amount)}</td>
                <td className="actions">
                  <button type="button" className="link" onClick={() => setEditingId(c.id)}>
                    {m.edit}
                    <span className="sr-only">{m.contributionOn(formatPounds(c.amount), c.date)}</span>
                  </button>
                  <button
                    type="button"
                    className="link danger"
                    onClick={async () => {
                      if (await confirm(m.confirmDeleteContribution(formatPounds(c.amount), c.date), m.delete)) onDelete(c.id)
                    }}
                  >
                    {m.delete}
                    <span className="sr-only">{m.contributionOn(formatPounds(c.amount), c.date)}</span>
                  </button>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </section>
  )
}

function ContributionEditRow({
  contribution,
  accountName,
  onSave,
  onCancel,
}: {
  contribution: Contribution
  accountName: string | undefined
  onSave: (change: { amount: number; date: string }) => void
  onCancel: () => void
}) {
  const { m, lang } = useLang()
  const [amount, setAmount] = useState((contribution.amount / 100).toFixed(2))
  const [date, setDate] = useState(contribution.date)
  const [error, setError] = useState('')

  const save = () => {
    const result = validateContributionInput({ amount, date })
    if (!result.ok) {
      setError(translateError(result.error, lang))
      return
    }
    onSave(result.value)
  }

  return (
    <tr className="editing">
      <td colSpan={5}>
        <form
          className="edit-form"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <p className="edit-for">{m.editing(accountName ?? '')}</p>
          <label>
            {m.amountInPounds}
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </label>
          <label>
            {m.date}
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="edit-buttons">
            <button type="submit">{m.saveChanges}</button>
            <button type="button" className="secondary" onClick={onCancel}>
              {m.cancel}
            </button>
          </div>
        </form>
      </td>
    </tr>
  )
}

function Settings({ threshold, onChange }: { threshold: number; onChange: (percent: number) => void }) {
  const { m, lang } = useLang()
  const [value, setValue] = useState(String(threshold))
  const [error, setError] = useState('')

  return (
    <section>
      <h2>{m.settings}</h2>
      <form
        className="edit-form"
        onSubmit={(e) => {
          e.preventDefault()
          const result = validateWarningThreshold(value)
          if (!result.ok) {
            setError(translateError(result.error, lang))
            return
          }
          setError('')
          setValue(String(result.value))
          onChange(result.value)
        }}
      >
        <label>
          {m.thresholdLabel}
          <input inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} />
        </label>
        <p className="edit-for">{m.thresholdHelp}</p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button type="submit">{m.saveThreshold}</button>
      </form>
    </section>
  )
}

/** Always rendered, even with no data yet, so an empty backup can be exported. */
function Backup({
  state,
  threshold,
  today,
  onRestore,
}: {
  state: AppState
  threshold: number
  today: string
  onRestore: (state: AppState, warningThreshold: number) => void
}) {
  const { m, lang } = useLang()
  const confirm = useConfirm()
  const [message, setMessage] = useState<{
    kind: 'error' | 'done'
    text: string
  } | null>(null)

  const download = () => {
    const blob = new Blob([serialiseBackup(state, threshold, new Date())], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = backupFilename(today)
    link.click()
    URL.revokeObjectURL(url)
  }

  const counts = (s: AppState) => `${m.accountsCount(s.accounts.length)}${m.and}${m.contributionsCount(s.contributions.length)}`

  const pickFile = async (input: HTMLInputElement) => {
    const file = input.files?.[0]
    input.value = '' // lets the same file be chosen again after a rejection
    if (!file) return
    const result = parseBackup(await file.text())
    if (!result.ok) {
      setMessage({
        kind: 'error',
        text: m.notChanged(translateError(result.error, lang)),
      })
      return
    }
    const { state: incoming, warningThreshold } = result.value
    const incomingText = counts(incoming)
    const hasData = state.accounts.length > 0 || state.contributions.length > 0
    const warning = hasData ? m.confirmReplace(counts(state), incomingText) : m.confirmRestore(incomingText)
    if (!(await confirm(warning, m.confirm))) {
      setMessage({ kind: 'done', text: m.importCancelled })
      return
    }
    onRestore(incoming, warningThreshold)
    setMessage({ kind: 'done', text: m.restored(incomingText) })
  }

  return (
    <section className="backup">
      <h2>{m.backupTitle}</h2>
      <p className="backup-note">{m.backupNote}</p>
      <div className="backup-actions">
        <button type="button" onClick={download}>
          {m.downloadBackup}
        </button>
        <label className="file-button">
          {m.importBackup}
          <input type="file" accept="application/json,.json" onChange={(e) => pickFile(e.currentTarget)} />
        </label>
      </div>
      <p className="edit-for">{m.importNote}</p>
      {message && (
        <p role={message.kind === 'error' ? 'alert' : 'status'} className={message.kind === 'error' ? 'error' : 'import-done'}>
          {message.text}
        </p>
      )}
    </section>
  )
}
