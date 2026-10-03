# UK ISA Tracker

追蹤英國 ISA 供款，確保唔會超出每個稅務年度嘅免稅額。

🌐 線上版：https://oliverlmc2026.github.io/uk-isa-tracker/

英國 ISA 持有人每個 Tax Year（4 月 6 日至翌年 4 月 5 日）有 £20,000 ISA Allowance，所有 ISA 類型共用；Lifetime ISA (LISA) 另有 £4,000 年度上限，但供款同樣計入 ISA Allowance。呢個 App 幫你記錄每筆供款，隨時睇到用咗幾多、仲剩幾多。

## 功能

- 建立多個 ISA Account（Cash ISA、Stocks & Shares ISA、Lifetime ISA），同類型可以有多個
- 記錄每筆 Contribution，按日期自動歸入正確 Tax Year
- 即時顯示已用額度、剩餘額度、使用率，以及按賬戶分拆
- LISA 合併上限（£4,000）追蹤
- 可自訂預警百分比（預設 90%）；超額照記並顯示超出金額
- 瀏覽過往 Tax Year，每年按當年適用嘅額度計算
- JSON 匯出 / 匯入備份，匯入時會驗證格式
- 支援手機同桌面

## 資料存放

所有資料只存喺你嘅瀏覽器（`localStorage`），冇後端、冇帳號、冇雲端同步，原因見 [ADR 0001](docs/adr/0001-browser-only-storage.md)。

> 清除瀏覽器資料會令記錄消失，請定期使用 JSON 匯出做備份。

## 開發

需要 Node.js 同 npm。

```bash
npm install
npm run dev      # 開發伺服器，預設 http://localhost:5199
npm test         # 執行單元測試 (Vitest)
npm run build    # 型別檢查 + 正式建置
npm run preview  # 預覽建置結果
```

開發伺服器 port 固定為 5199（可用 `PORT` 環境變數覆蓋），令 origin 保持穩定，`localStorage` 資料唔會因重啟而遺失。

## 技術

React 19 · TypeScript · Vite · Vitest

## 專案結構

```
src/domain/   業務邏輯（額度計算、賬戶、供款、備份、金額），附單元測試
src/ui/       React 介面
src/storage.ts  瀏覽器存儲
docs/adr/     架構決策記錄
CONTEXT.md    領域術語表
```

領域術語（ISA Allowance、Over-contribution、Warning Threshold 等）定義喺 [CONTEXT.md](CONTEXT.md)。
