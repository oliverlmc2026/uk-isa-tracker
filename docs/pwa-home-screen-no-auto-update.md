# 主畫面 app 部署新版後仍顯示舊版

## 症狀
將網頁加到 iPhone 主畫面（standalone）後，部署新版本，主畫面 app 一直顯示舊版。

## 原因
1. 原本只有 `vite-plugin-pwa` 自動注入嘅 `registerSW.js`（純 `register()`），冇任何程式處理「新 service worker 已就緒」，畫面上跑緊嘅仍然係舊 JS。
2. standalone app 通常由背景恢復、唔會重新 navigate，瀏覽器就唔會主動重新檢查 `sw.js`。

## 修正
- `registerType: 'prompt'`：新版 service worker 會等用戶確認。
- `src/ui/UpdatePrompt.tsx`：用 `useRegisterSW`，app 返前台（`visibilitychange`）同每小時檢查更新；有新版就顯示「有新版本。 稍後 / 更新」，點「更新」會啟用新 service worker 並 reload。

## 注意
舊 app 本身冇呢個機制，要手動關閉重開一兩次（或刪除重加）先會攞到第一個含修正嘅版本。
