# 02: 編輯／刪除 Contribution，加金額驗證

**What to build:** 用戶可以修改某筆 Contribution 嘅金額或日期，亦可以刪除輸入錯誤嘅 Contribution，Dashboard 總額即時更新（改日期可令 Contribution 轉入另一個 Tax Year）。金額必須係正數、英鎊加便士，無效輸入唔會寫入資料。

**Blocked by:** 01

**Status:** done

- [x] 可編輯 Contribution 嘅金額同日期，Dashboard 即時反映
- [x] 編輯日期跨越 4 月 5 日／6 日邊界時，Contribution 轉入正確 Tax Year
- [x] 可刪除 Contribution，Dashboard 即時反映
- [x] 金額驗證：拒絕零、負數、非數字，以及多於兩位小數
- [x] 無效輸入有清楚錯誤訊息，並唔會改動現有資料
