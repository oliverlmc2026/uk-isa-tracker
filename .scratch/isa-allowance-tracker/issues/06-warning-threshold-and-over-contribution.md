# 06: Warning Threshold 同 ISA Allowance 超額

**What to build:** 用戶可以設定自己嘅 Warning Threshold 百分比（預設 90%，保存喺瀏覽器）。ISA Allowance 使用率達到門檻時顯示預警。Contribution 令總額超出 ISA Allowance 時（Over-contribution）照記，並清楚顯示超出金額。UI 明確講明 Withdrawal 唔會釋放 ISA Allowance。

**Blocked by:** 01

**Status:** done

- [x] 設定頁可修改 Warning Threshold，預設 90%，重開後保持
- [x] 使用率低於門檻時冇預警；達到或超過門檻（未超額）時顯示預警
- [x] 自訂門檻會影響預警觸發點
- [x] 總額超出 ISA Allowance 時 Contribution 照記，並顯示超出金額
- [x] 輸入從不因超額而被阻止
- [x] UI 清楚說明 Withdrawal 唔會釋放額度，App 亦無記錄 Withdrawal 以減少用量
- [x] Seam 1 測試涵蓋：門檻下／剛好／上、自訂門檻、剛好等於額度 vs 超出一 pence、超額金額正確
