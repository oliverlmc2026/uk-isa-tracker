import { createContext, useContext } from 'react'
import type { AccountType } from '../domain/types'

export type Lang = 'en' | 'zh'
export type Theme = 'auto' | 'light' | 'dark'

const THEME_KEY = 'uk-isa-tracker:theme'

export function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // unreadable storage falls back to following the system
  }
  return 'auto'
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // storage may be blocked; the choice lasts until reload
  }
}

const LANG_KEY = 'uk-isa-tracker:language'

export function loadLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'en' || saved === 'zh') return saved
  } catch {
    // unreadable storage falls back to the browser language
  }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    // storage may be blocked; the choice lasts until reload
  }
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export const en = {
  language: 'Language',
  theme: 'Theme',
  preferences: 'Preferences',
  themeAuto: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',
  navLabel: 'Pages',
  nav: { overview: 'Overview', contributions: 'Contributions', accounts: 'Accounts', settings: 'Settings' },
  taxYear: 'Tax year',
  current: ' (current)',
  allYears: 'All years',
  past: ' (past)',
  typeLabel: {
    cash: 'Cash ISA',
    stocks_and_shares: 'Stocks & Shares ISA',
    lifetime: 'Lifetime ISA',
  } as Record<AccountType, string>,
  introTitle: 'Start with your first ISA account',
  introBody: 'Add the account you pay into, then record each contribution. The tracker shows how much of this tax year’s allowance is left.',
  recordContribution: 'Record a contribution',
  yourAccounts: 'Your accounts',
  addAnotherAccount: 'Add another account',
  taxYearHeading: (label: string) => `Tax year ${label}`,
  overAllowance: (amt: string) => `${amt} over your allowance`,
  allowanceFullyUsed: 'Allowance fully used',
  leftToUse: (amt: string) => `${amt} left to use`,
  heroNote: (paid: string, pct: number, allowance: string) => `${paid} paid in, ${pct}% of your ${allowance} ISA allowance`,
  warningAlert: (pct: number, threshold: number) =>
    `You have used ${pct}% of your allowance, past your ${threshold}% warning threshold.`,
  overAlert: (amt: string, allowance: string) =>
    `You have paid in ${amt} more than the ${allowance} allowance. The contribution is still recorded.`,
  heroRule: 'Withdrawals do not free up allowance, so this tracker does not record them.',
  meterAllowance: 'ISA allowance used',
  meterText: (used: string, of: string) => `${used} of ${of}`,
  lisaTitle: 'Lifetime ISA limit',
  lisaOver: (amt: string) => `${amt} over`,
  lisaLeft: (amt: string) => `${amt} left`,
  lisaNote: (used: string, limit: string) =>
    `${used} paid into Lifetime ISAs, of your ${limit} limit. It also counts towards your ISA allowance.`,
  lisaAlert: (amt: string, limit: string) =>
    `You have paid ${amt} more than the ${limit} Lifetime ISA limit. The contribution is still recorded.`,
  meterLisa: 'Lifetime ISA limit used',
  breakdownTitle: (label: string) => `Where it went in ${label}`,
  account: 'Account',
  paidIn: 'Paid in',
  total: 'Total',
  typeAtProvider: (type: string, provider: string) => `${type} at ${provider}`,
  name: 'Name',
  type: 'Type',
  provider: 'Provider',
  addAccount: 'Add account',
  accountAdded: (name: string) => `Added “${name}”.`,
  contributionAdded: (amount: string, account: string) => `Added ${amount} to ${account}.`,
  updateAvailable: 'A new version is available.',
  updateNow: 'Update',
  updateLater: 'Later',
  updatesTitle: 'Updates',
  checkForUpdate: 'Check for updates',
  updateChecking: 'Checking…',
  updateUpToDate: 'You are on the latest version.',
  updateUnavailable: 'Cannot check for updates right now. This only works online in the installed site.',
  edit: 'Edit',
  delete: 'Delete',
  noContributions: 'It has no contributions.',
  alsoDeleteContributions: (n: number) => `This will also delete its ${plural(n, 'contribution')}.`,
  confirmDeleteAccount: (name: string, effect: string) => `Delete the account "${name}"? ${effect} This cannot be undone.`,
  editing: (what: string) => `Editing ${what}`,
  saveChanges: 'Save changes',
  cancel: 'Cancel',
  confirm: 'Confirm',
  amountInPounds: 'Amount in pounds',
  date: 'Date',
  addContribution: 'Add contribution',
  contributions: 'Contributions',
  amount: 'Amount',
  actions: 'Actions',
  contributionOn: (amt: string, date: string) => ` contribution of ${amt} on ${date}`,
  confirmDeleteContribution: (amt: string, date: string) => `Delete the ${amt} contribution on ${date}?`,
  settings: 'Settings',
  thresholdLabel: 'Warning threshold (% of allowance)',
  thresholdHelp: 'The dashboard warns you once this much of your ISA allowance is used.',
  saveThreshold: 'Save threshold',
  backupTitle: 'Back up your data',
  backupNote: 'Your records live only in this browser. Clearing your browser data will erase them unless you have exported a backup.',
  downloadBackup: 'Download backup (JSON)',
  importBackup: 'Import backup (JSON)',
  importNote: 'Importing replaces everything currently in this browser, so you will be asked to confirm first.',
  accountsCount: (n: number) => plural(n, 'account'),
  contributionsCount: (n: number) => plural(n, 'contribution'),
  and: ' and ',
  confirmReplace: (current: string, incoming: string) =>
    `Replace your ${current} with the ${incoming} in this backup? Your current data will be lost. This cannot be undone.`,
  confirmRestore: (incoming: string) => `Restore ${incoming} and the warning threshold from this backup?`,
  importCancelled: 'Import cancelled. Your current data has not been changed.',
  restored: (incoming: string) => `Restored ${incoming} from the backup.`,
  notChanged: (error: string) => `${error} Your current data has not been changed.`,
  isaInfoTitle: 'ISA basics',
  isaInfoPoints: [
    'Each tax year (6 April to 5 April) you can pay up to £20,000 into ISAs in total. The limit is shared across all ISA types and accounts.',
    'You can split the £20,000 between Cash ISAs, Stocks & Shares ISAs and Lifetime ISAs in any mix.',
    'A Lifetime ISA takes up to £4,000 a year, and that counts towards the £20,000. The government adds a 25% bonus on what you pay in, but you must be 18 to 39 to open one.',
    'Taking money out of a Lifetime ISA before age 60 (other than for a first home or in terminal illness) incurs a 25% charge.',
    'The allowance does not roll over. Unused allowance is lost on 5 April.',
    'Withdrawing money does not normally free up allowance. Only some “flexible” ISAs let you put back what you took out in the same tax year, so check with your provider.',
    'Paying in more than the allowance can cause the excess to be removed or the ISA to lose its tax-free status. Contact your provider and HMRC if it happens.',
  ],
  disclaimer:
    'This tracker is for personal record-keeping only and is not financial, tax or legal advice. Allowances and rules can change and may differ from your situation. Check the latest figures on GOV.UK or with your provider or a qualified adviser. Your own records may differ from your providers’ and HMRC’s, which are the official source. Your data is stored only in this browser.',
}

export type Messages = typeof en

export const zh: Messages = {
  language: '語言',
  theme: '主題',
  preferences: '偏好設定',
  themeAuto: '跟隨系統',
  themeLight: '淺色',
  themeDark: '深色',
  navLabel: '頁面',
  nav: { overview: '總覽', contributions: '供款', accounts: '賬戶', settings: '設定' },
  taxYear: '稅務年度',
  current: '（本年度）',
  allYears: '全部年度',
  past: '（過往）',
  typeLabel: {
    cash: 'Cash ISA',
    stocks_and_shares: 'Stocks & Shares ISA',
    lifetime: 'Lifetime ISA',
  },
  introTitle: '由你嘅第一個 ISA 賬戶開始',
  introBody: '先加入你供款嘅賬戶，再逐筆記錄供款。追蹤器會顯示今個稅務年度嘅免稅額仲剩幾多。',
  recordContribution: '記錄供款',
  yourAccounts: '你嘅賬戶',
  addAnotherAccount: '新增另一個賬戶',
  taxYearHeading: (label) => `稅務年度 ${label}`,
  overAllowance: (amt) => `超出免稅額 ${amt}`,
  allowanceFullyUsed: '免稅額已用盡',
  leftToUse: (amt) => `仲可用 ${amt}`,
  heroNote: (paid, pct, allowance) => `已供入 ${paid}，佔你 ${allowance} ISA 免稅額嘅 ${pct}%`,
  warningAlert: (pct, threshold) => `你已用咗免稅額嘅 ${pct}%，超過你設定嘅 ${threshold}% 預警線。`,
  overAlert: (amt, allowance) => `你嘅供款比 ${allowance} 免稅額多出 ${amt}。呢筆供款仍然會被記錄。`,
  heroRule: '提款唔會釋放免稅額，所以本追蹤器唔會記錄提款。',
  meterAllowance: '已使用嘅 ISA 免稅額',
  meterText: (used, of) => `${used}／${of}`,
  lisaTitle: 'Lifetime ISA 上限',
  lisaOver: (amt) => `超出 ${amt}`,
  lisaLeft: (amt) => `仲可供 ${amt}`,
  lisaNote: (used, limit) => `Lifetime ISA 已供入 ${used}，上限為 ${limit}。呢啲供款同時計入你嘅 ISA 免稅額。`,
  lisaAlert: (amt, limit) => `你嘅供款比 ${limit} Lifetime ISA 上限多出 ${amt}。呢筆供款仍然會被記錄。`,
  meterLisa: '已使用嘅 Lifetime ISA 上限',
  breakdownTitle: (label) => `${label} 嘅供款去向`,
  account: '賬戶',
  paidIn: '已供入',
  total: '合計',
  typeAtProvider: (type, provider) => `${type}，供應商：${provider}`,
  name: '名稱',
  type: '類型',
  provider: '供應商',
  addAccount: '新增賬戶',
  accountAdded: (name) => `已新增「${name}」。`,
  contributionAdded: (amount, account) => `已記錄 ${amount} 供款到「${account}」。`,
  updateAvailable: '有新版本。',
  updateNow: '更新',
  updateLater: '稍後',
  updatesTitle: '更新',
  checkForUpdate: '檢查更新',
  updateChecking: '檢查緊…',
  updateUpToDate: '已經係最新版本。',
  updateUnavailable: '暫時無法檢查更新。需要連線，而且只限已部署嘅網站。',
  edit: '編輯',
  delete: '刪除',
  noContributions: '呢個賬戶冇任何供款。',
  alsoDeleteContributions: (n) => `同時會刪除佢嘅 ${n} 筆供款。`,
  confirmDeleteAccount: (name, effect) => `確定刪除賬戶「${name}」？${effect}此操作無法復原。`,
  editing: (what) => `正在編輯 ${what}`,
  saveChanges: '儲存變更',
  cancel: '取消',
  confirm: '確定',
  amountInPounds: '金額（英鎊）',
  date: '日期',
  addContribution: '新增供款',
  contributions: '供款記錄',
  amount: '金額',
  actions: '操作',
  contributionOn: (amt, date) => ` ${date} 嘅 ${amt} 供款`,
  confirmDeleteContribution: (amt, date) => `確定刪除 ${date} 嘅 ${amt} 供款？`,
  settings: '設定',
  thresholdLabel: '預警線（免稅額百分比）',
  thresholdHelp: '當你用咗呢個百分比嘅 ISA 免稅額，儀表板就會提醒你。',
  saveThreshold: '儲存預警線',
  backupTitle: '備份你嘅資料',
  backupNote: '你嘅記錄只存放喺呢個瀏覽器。清除瀏覽器資料會令記錄消失，除非你已匯出備份。',
  downloadBackup: '下載備份（JSON）',
  importBackup: '匯入備份（JSON）',
  importNote: '匯入會取代呢個瀏覽器入面現有嘅所有資料，所以之前會先要求你確認。',
  accountsCount: (n) => `${n} 個賬戶`,
  contributionsCount: (n) => `${n} 筆供款`,
  and: ' 及 ',
  confirmReplace: (current, incoming) => `確定用備份入面嘅${incoming}取代你現有嘅${current}？現有資料將會遺失，此操作無法復原。`,
  confirmRestore: (incoming) => `確定由備份還原${incoming}同預警線？`,
  importCancelled: '已取消匯入。你現有嘅資料冇被更改。',
  restored: (incoming) => `已由備份還原${incoming}。`,
  notChanged: (error) => `${error}你現有嘅資料冇被更改。`,
  isaInfoTitle: 'ISA 基本資料',
  isaInfoPoints: [
    '每個稅務年度（4 月 6 日至翌年 4 月 5 日），你最多可以供入所有 ISA 合共 £20,000。呢個上限由所有 ISA 類型同賬戶共用。',
    '你可以將 £20,000 隨意分配落 Cash ISA、Stocks & Shares ISA 同 Lifetime ISA。',
    'Lifetime ISA 每年最多供 £4,000，並且計入 £20,000 之內。政府會為你供入嘅款項加 25% 獎金，但你要年滿 18 至 39 歲先可以開立。',
    '喺 60 歲之前從 Lifetime ISA 提款（購買首間自住物業或患有末期疾病除外）會被收取 25% 費用。',
    '免稅額唔會結轉。未用完嘅部分會喺 4 月 5 日失效。',
    '提款一般唔會釋放免稅額。只有部分「靈活」ISA 容許你喺同一稅務年度將提走嘅款項存返入去，請向供應商查詢。',
    '供款超出免稅額，超出部分可能會被取回，或者令 ISA 失去免稅資格。如發生呢種情況，請聯絡供應商同 HMRC。',
  ],
  disclaimer:
    '本追蹤器只供個人記錄之用，並非財務、稅務或法律意見。免稅額同規則可能會有變動，亦未必適用於你嘅個人情況。請到 GOV.UK 查閱最新數字，或者向供應商或合資格顧問查詢。你嘅記錄可能同供應商及 HMRC 嘅官方紀錄有出入，一切以官方紀錄為準。你嘅資料只存放喺呢個瀏覽器。',
}

/** Domain validators return English text; these map it onto Chinese for display. */
const ERRORS_ZH: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^Enter a name for the account\.$/, () => '請輸入賬戶名稱。'],
  [/^Enter the provider that holds the account\.$/, () => '請輸入持有呢個賬戶嘅供應商。'],
  [/^Enter an amount above £0 .*$/, () => '請輸入大於 £0、最多兩位小數嘅金額，例如 250 或 250.50。'],
  [/^Enter a valid date\.$/, () => '請輸入有效日期。'],
  [/^Enter a whole number from 1 to 100\.$/, () => '請輸入 1 至 100 嘅整數。'],
  [/^This file is not a valid JSON file\.$/, () => '呢個檔案唔係有效嘅 JSON 檔案。'],
  [/^This file is not a UK ISA Tracker backup\.$/, () => '呢個檔案唔係 UK ISA Tracker 嘅備份。'],
  [/^This backup uses (?:version (\d+)|an unknown version), which is not supported\. This app reads version (\d+)\.$/, (m) =>
    `呢個備份使用${m[1] ? `版本 ${m[1]}` : '未知版本'}，不受支援。本應用程式讀取版本 ${m[2]}。`],
  [/^The backup’s data section is missing or damaged\.$/, () => '備份嘅資料部分遺失或已損毀。'],
  [/^The backup’s accounts are missing or damaged\.$/, () => '備份嘅賬戶資料遺失或已損毀。'],
  [/^The backup’s contributions are missing or damaged\.$/, () => '備份嘅供款資料遺失或已損毀。'],
  [/^The backup’s settings are missing or damaged\.$/, () => '備份嘅設定遺失或已損毀。'],
  [/^The backup’s warning threshold must be a whole number from 1 to 100\.$/, () => '備份嘅預警線必須係 1 至 100 嘅整數。'],
  [/^Account (\d+) in the backup is missing details or damaged\.$/, (m) => `備份入面第 ${m[1]} 個賬戶資料缺漏或已損毀。`],
  [/^The backup lists account (\d+) more than once \(duplicate id\)\.$/, (m) => `備份重複列出第 ${m[1]} 個賬戶（id 重複）。`],
  [/^Contribution (\d+) in the backup is missing details or damaged\.$/, (m) => `備份入面第 ${m[1]} 筆供款資料缺漏或已損毀。`],
  [/^Contribution (\d+) in the backup belongs to an account that is not in the file\.$/, (m) =>
    `備份入面第 ${m[1]} 筆供款所屬嘅賬戶唔喺檔案內。`],
  [/^The backup lists contribution (\d+) more than once \(duplicate id\)\.$/, (m) => `備份重複列出第 ${m[1]} 筆供款（id 重複）。`],
]

export function translateError(error: string, lang: Lang): string {
  if (lang === 'en') return error
  for (const [pattern, render] of ERRORS_ZH) {
    const match = error.match(pattern)
    if (match) return render(match)
  }
  return error
}

export const MESSAGES: Record<Lang, Messages> = { en, zh }

export const LangContext = createContext<{ lang: Lang; m: Messages }>({ lang: 'en', m: en })
export const useLang = () => useContext(LangContext)
