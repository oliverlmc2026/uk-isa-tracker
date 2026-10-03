# 01: 記錄第一筆 Contribution，睇到今個 Tax Year 嘅 ISA Allowance

**What to build:** 用戶打開純瀏覽器 Web App（ADR 0001：無後端、無帳號），首次見到空狀態並被引導建立第一個 ISA Account（名稱、Cash ISA 或 Stocks & Shares ISA、Provider；同類型可建多個）。用戶為某個 ISA Account 輸入 Contribution（金額、日期），App 按日期自動歸入相應 Tax Year（4 月 5 日同 6 日分屬不同 Tax Year）。Dashboard 預設顯示當前 Tax Year 嘅 ISA Allowance 已用、剩餘同使用率（跨所有賬戶）。資料保存喺瀏覽器，重開仍在。版面支援手機同桌面。

包括：純計算模組（無 I/O、無 UI 依賴）、Tax Year 推算（純函數，Contribution 只存日期，Tax Year 一律推算）、按 Tax Year 嘅額度表（ISA Allowance 預設 £20,000、LISA 上限預設 £4,000；未知年份沿用最近已知值）、金額以整數 pence 處理、Seam 1 核心測試。技術棧由實作者自行選擇。

**Blocked by:** None (can start immediately)

**Status:** done

- [x] 無任何資料時顯示空狀態，並引導建立第一個 ISA Account
- [x] 可建立 Cash ISA 或 Stocks & Shares ISA 賬戶（名稱、類型、Provider），同類型可建多個
- [x] 可為指定賬戶記錄 Contribution（金額、日期）
- [x] Contribution 按日期自動歸入 Tax Year；4 月 5 日同 4 月 6 日歸入不同 Tax Year
- [x] Dashboard 預設顯示當前 Tax Year，並顯示已用、剩餘同使用率（跨所有賬戶）
- [x] 資料保存喺瀏覽器，重新打開後仍然存在
- [x] 無需帳號或登入
- [x] 手機同桌面版面都可正常使用
- [x] 金額以整數 pence 處理，pence 級別加總無浮點誤差
- [x] 額度表按 Tax Year 存放；未知年份沿用最近已知值
- [x] Seam 1 測試（只測公開介面行為）涵蓋：單賬戶、多賬戶、同類型多賬戶、Tax Year 邊界、剛好等於額度 vs 超出一 pence、未知年份 fallback、空狀態、pence 精度加總
