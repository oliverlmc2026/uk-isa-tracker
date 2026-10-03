# UK ISA Tracker

追蹤英國 ISA 供款，確保唔會超出每個稅務年度嘅免稅額。

## Language

**ISA Allowance**:
每個稅務年度可以供入所有 ISA 嘅免稅總額（£20,000），所有 ISA 類型共用。
_Avoid_: Limit, quota, cap

**Over-contribution**:
Contribution 令某 Tax Year 總額超出 ISA Allowance（或令 LISA 超出其年度上限）。仍然照記，並顯示超出金額。ISA Allowance 使用率達用戶自訂嘅預警百分比（預設 90%，即 **Warning Threshold**）時會先預警；LISA 上限冇預警，只喺超出時警告。
_Avoid_: Breach, overflow

**Tax Year**:
由 4 月 6 日至翌年 4 月 5 日嘅期間，ISA Allowance 按此重置。每筆 Contribution 按日期自動歸入相應 Tax Year。
_Avoid_: Calendar year, financial year

**Contribution**:
存入某個 ISA 賬戶嘅一筆款項，會佔用 ISA Allowance。
_Avoid_: Deposit, payment, subscription

**Withdrawal**:
從 ISA 賬戶提走嘅款項。一律唔會釋放 ISA Allowance。
_Avoid_: Redemption

**ISA Account**:
用戶自行建立嘅一個 ISA 賬戶，有名稱、類型同供應商。同一類型可以有多個。每筆 Contribution 都歸屬某個 ISA Account。
_Avoid_: Wrapper, product

**Provider**:
持有 ISA Account 嘅銀行、券商或平台。
_Avoid_: Bank, broker, platform

**Cash ISA**:
以現金儲蓄形式持有嘅 ISA 賬戶。

**Stocks & Shares ISA**:
持有股票同基金嘅 ISA 賬戶。

**Lifetime ISA (LISA)**:
每年所有 LISA 賬戶加埋最多供 £4,000 嘅 ISA 賬戶，供款同樣計入 ISA Allowance。
_Avoid_: Lifetime account
