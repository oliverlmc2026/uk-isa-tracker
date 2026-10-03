# 07: 瀏覽過往 Tax Year

**What to build:** 用戶可以由預設嘅當前 Tax Year 切換去過往 Tax Year 回顧歷史。每個 Tax Year 按該年適用嘅額度表行計算，令舊年份數字喺規則日後改變時仍然正確。當前 Tax Year 喺 4 月 6 日自動轉入新一年，重置額度。

**Blocked by:** 01

**Status:** done

- [x] 打開 App 預設顯示當前 Tax Year
- [x] 可切換到有 Contribution 嘅過往 Tax Year
- [x] 每個 Tax Year 按額度表中屬於該年嘅行計算（用測試額度表驗證，舊年份唔受新規則影響）
- [x] 未知／未來年份沿用最近已知額度值
- [x] 4 月 6 日當前 Tax Year 自動轉入新一年，新年度用量由零開始（以可注入日期嘅方式測試）
- [x] 日後新增政策變更只需喺額度表加一行
