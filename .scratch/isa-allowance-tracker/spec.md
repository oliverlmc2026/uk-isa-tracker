Status: ready-for-agent

# ISA Allowance Tracker

## Problem Statement

英國 ISA 持有人每個 Tax Year 有 £20,000 嘅 ISA Allowance，所有 ISA 類型共用；Lifetime ISA (LISA) 另有 £4,000 上限（所有 LISA 加埋計），但供款同樣計入 ISA Allowance。用戶可能喺多個 Provider 開咗多個 ISA Account（同類型都可以有多個），好容易唔知自己總共供咗幾多，結果發生 Over-contribution。用戶需要一個簡單嘅地方，記錄所有 Contribution，隨時睇到本 Tax Year 用咗幾多、仲剩幾多。

## Solution

一個網頁 App，所有資料只存喺用戶瀏覽器（見 ADR 0001）。用戶建立自己嘅 ISA Account，手動輸入每筆 Contribution；App 按日期自動將每筆 Contribution 歸入相應 Tax Year，並即時顯示已用額度、剩餘額度同 LISA 用量。ISA Allowance 使用率達用戶自訂嘅 Warning Threshold（預設 90%）時預警；任何超額（ISA Allowance 或 LISA 上限）照記並顯示超出金額。用戶可以將全部資料匯出成 JSON 備份，亦可以匯入返嚟。

## User Stories

1. As an ISA holder, I want to create an ISA Account with a name, type and Provider, so that I can organise my Contributions per account
2. As an ISA holder, I want to choose between Cash ISA, Stocks & Shares ISA and Lifetime ISA when creating an account, so that the tracker applies the right rules
3. As an ISA holder, I want to create several ISA Accounts of the same type, so that I can track e.g. two Cash ISAs at different Providers
4. As an ISA holder, I want to edit an ISA Account's name and Provider, so that I can fix typos or reflect a rename
5. As an ISA holder, I want to delete an ISA Account I no longer track, so that my list stays clean
6. As an ISA holder, I want to be told what happens to an account's Contributions before I delete it, so that I don't lose history by accident
7. As an ISA holder, I want to record a Contribution against a specific ISA Account with an amount and a date, so that my usage is accurate
8. As an ISA holder, I want each Contribution to be automatically assigned to the correct Tax Year (6 April – 5 April) from its date, so that I never have to pick the year myself
9. As an ISA holder, I want a Contribution dated 5 April and one dated 6 April to land in different Tax Years, so that the boundary is handled correctly
10. As an ISA holder, I want to edit a Contribution's amount or date, so that I can correct mistakes
11. As an ISA holder, I want to delete a Contribution, so that I can remove one I entered by mistake
12. As an ISA holder, I want amounts validated as positive money values in pounds and pence, so that bad input can't corrupt my totals
13. As an ISA holder, I want to see how much of this Tax Year's ISA Allowance I have used across all accounts, so that I know my total position
14. As an ISA holder, I want to see how much ISA Allowance I have remaining this Tax Year, so that I know how much I can still contribute
15. As an ISA holder, I want to see usage as a percentage of the ISA Allowance, so that I can judge it at a glance
16. As an ISA holder, I want to see used amounts broken down by ISA Account, so that I know where my money went
17. As an ISA holder, I want to see the combined Contributions to all Lifetime ISAs this Tax Year against the £4,000 LISA limit, so that I don't exceed it across accounts
18. As an ISA holder, I want LISA Contributions to also count toward the £20,000 ISA Allowance, so that the totals reflect the real rules
19. As an ISA holder, I want to set my own Warning Threshold percentage, so that I'm warned at a point that suits me
20. As an ISA holder, I want the Warning Threshold to default to 90%, so that it works sensibly without setup
21. As an ISA holder, I want a warning when my ISA Allowance usage reaches the Warning Threshold, so that I can slow down before going over
22. As an ISA holder, I want a clear warning showing the excess amount when I have an Over-contribution of the ISA Allowance, so that I can act on it
23. As an ISA holder, I want a clear warning showing the excess amount when my LISA Contributions exceed £4,000, so that I notice the LISA breach
24. As an ISA holder, I want an Over-contribution to still be recorded, so that my records reflect what actually happened
25. As an ISA holder, I want no early-warning for the LISA limit (only an over-limit warning), so that behaviour matches the agreed rules
26. As an ISA holder, I want Withdrawals to never release allowance, so that the tracker stays conservative and simple
27. As an ISA holder, I want the tracker to make clear that Withdrawals don't free up allowance, so that I don't assume they do
28. As an ISA holder, I want to browse previous Tax Years, so that I can review my history
29. As an ISA holder, I want each historical Tax Year to be evaluated against the allowance that applied in that year, so that old numbers stay correct if the rules change
30. As an ISA holder, I want the app to default to the current Tax Year on open, so that I immediately see what matters
31. As an ISA holder, I want the current Tax Year to roll over automatically on 6 April, so that I start with a fresh allowance
32. As an ISA holder, I want my data to persist in my browser between visits, so that I don't re-enter it
33. As an ISA holder, I want to export all my data as a JSON file, so that I can back it up
34. As an ISA holder, I want to import a previously exported JSON file, so that I can restore data or move to another device
35. As an ISA holder, I want importing to validate the file and reject malformed or incompatible data with a clear message, so that I don't corrupt my existing records
36. As an ISA holder, I want a warning before an import replaces my current data, so that I don't overwrite it accidentally
37. As an ISA holder, I want export followed by import to reproduce exactly the same accounts, Contributions and settings, so that I can trust my backups
38. As an ISA holder, I want to be reminded that clearing browser data erases my records unless I export, so that I know to back up
39. As an ISA holder, I want to use the app without an account or login, so that setup is instant and private
40. As an ISA holder, I want the app to work on both phone and desktop, so that I can record a Contribution right after making it
41. As an ISA holder, I want the app to work with no data at all and guide me to create my first account, so that I'm not looking at a confusing blank screen
42. As a maintainer, I want the allowance amounts held in a per-Tax-Year table, so that a policy change is a one-row addition and old years stay correct

## Implementation Decisions

- **Platform**: web app, browser-only storage, no backend, no accounts, no cloud sync (ADR 0001). Single user.
- **Domain vocabulary** follows `CONTEXT.md`: ISA Allowance, Contribution, Withdrawal, ISA Account, Provider, Tax Year, Over-contribution, Warning Threshold, Cash ISA, Stocks & Shares ISA, Lifetime ISA (LISA).
- **Allowance calculation module** (pure, no I/O, no UI dependencies): given ISA Accounts, Contributions, the per-Tax-Year allowance table and the Warning Threshold, produces a summary for a given Tax Year: total used, remaining, usage percentage, per-account used amounts, combined LISA used and LISA remaining, Over-contribution amounts for ISA Allowance and for LISA, and whether the Warning Threshold has been reached.
- **Tax Year derivation** is a pure function from a date to a Tax Year (6 April – 5 April). Contributions store only their date; the Tax Year is always derived, never stored.
- **Allowance table**: keyed by Tax Year, holds the ISA Allowance (default £20,000) and the LISA limit (default £4,000). Unknown/future years fall back to the most recent known values.
- **Money** is handled without floating-point error (integer pence or equivalent).
- **LISA rule**: the £4,000 limit applies to the sum of all LISA accounts in a Tax Year; LISA Contributions also count toward the ISA Allowance.
- **Warning rule**: Warning Threshold applies to ISA Allowance usage only. LISA has no early warning, only an over-limit warning.
- **Over-contribution** never blocks input; it is recorded and surfaced with the excess amount.
- **Withdrawals** are not tracked as allowance-releasing events; the tracker neither records them as reducing usage nor treats any account as flexible.
- **Persistence / backup module**: serialises the full state (accounts, Contributions, settings) to JSON and restores it. Includes a schema version, validates input on import, rejects malformed or incompatible files without touching existing data, and requires explicit confirmation before replacing current data.
- **Bonus**: the LISA 25% government bonus is not tracked.
- **Out-of-band data entry**: manual only; no CSV import or Open Banking.

## Testing Decisions

- A good test exercises external behaviour only: given inputs, assert outputs. No assertions on internal helpers, data structures or UI markup.
- **Seam 1 – Allowance calculation**: tested at the module's public interface. Cover: single and multiple accounts, same-type multiple accounts, Tax Year boundary (5 April vs 6 April), LISA combined-limit across several LISA accounts, LISA counting toward the ISA Allowance, exact-at-limit vs one penny over, Warning Threshold at/below/above, custom threshold, LISA having no early warning, historical year using its own allowance row, fallback for unknown year, empty state, and pence-precision sums.
- **Seam 2 – Persistence (export/import)**: tested through serialise → restore. Cover: round-trip equality of accounts, Contributions and settings; rejection of malformed JSON, wrong shape and unsupported schema version with existing data untouched; empty state round-trip.
- No UI-level or browser end-to-end tests in this spec.
- Prior art: none (greenfield repo).

## Out of Scope

- Backend, accounts, cloud sync, multi-device live sync.
- Multiple users / household sharing.
- CSV import, Open Banking or any automatic transaction sync.
- Flexible-ISA withdrawal handling; any release of allowance on Withdrawal.
- Tracking LISA government bonus.
- Investment performance, portfolio values, returns, or ISA product/rate comparison.
- Junior ISA and Innovative Finance ISA.
- Blocking input on Over-contribution.

## Further Notes

- Because data lives only in the browser, JSON export/import is a required feature, not an extra; the UI should remind users of the risk.
- If cloud sync is wanted later, ADR 0001 must be revisited and a data-migration path designed.
