# 用 local dev server 加到 iPhone 主畫面冇 icon：診斷同修正

呢份教學記錄喺 uk-isa-tracker 遇到嘅問題：點樣搵出原因，同埋點樣修正。如果你嘅 Vite 項目設定咗 `base`（例如 `/my-app/`），喺 `index.html` 用 `%BASE_URL%` 寫 icon link，而 dev 版本加到主畫面冇 icon，都可以跟呢份做。

## 1. 症狀

- 用 iPhone Safari 開 local dev server（`npm run dev`，例如 `http://192.168.0.19:5199/uk-isa-tracker/`），再「加入主畫面」。
- 主畫面嘅捷徑**冇 icon**，iOS 只係顯示一個字母或者網頁截圖。
- 同一部 iPhone 開 GitHub Pages 嘅 link 再加到主畫面，**icon 正常**。

## 2. 原本嘅寫法

`vite.config.ts` 設定咗 base：

```ts
base: process.env.BASE_PATH ?? '/uk-isa-tracker/',
```

`index.html` 用 `%BASE_URL%` 砌 icon 路徑：

```html
<link rel="icon" type="image/svg+xml" href="%BASE_URL%icon.svg" />
<link rel="apple-touch-icon" href="%BASE_URL%apple-touch-icon.png" />
<link rel="manifest" href="%BASE_URL%manifest.webmanifest" />
```

理論上 `%BASE_URL%` 會變成 `/uk-isa-tracker/`，路徑應該啱。

## 3. 點樣診斷

### 3.1 確認張圖本身冇問題

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:5199/uk-isa-tracker/apple-touch-icon.png
```

結果係 `200 image/png`，即係 dev server 有正確提供張圖。所以問題唔係出喺張圖。

### 3.2 睇 dev server 實際輸出嘅 HTML

```bash
curl -s http://localhost:5199/uk-isa-tracker/ | grep -i icon
```

結果：

```html
<link rel="icon" type="image/svg+xml" href="/uk-isa-tracker/uk-isa-tracker/icon.svg" />
<link rel="apple-touch-icon" href="/uk-isa-tracker/uk-isa-tracker/apple-touch-icon.png" />
```

**base 路徑重複咗兩次。**

### 3.3 確認錯誤路徑會返嚟乜

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:5199/uk-isa-tracker/uk-isa-tracker/apple-touch-icon.png
```

結果係 `200 text/html`。Vite 嘅 SPA fallback 將搵唔到嘅路徑當成網頁，返咗 `index.html`。iOS 攞到嘅係 HTML 而唔係 PNG，所以冇 icon 用。

### 3.4 對比 build 版本

```bash
grep -o 'href="[^"]*icon[^"]*"' dist/index.html
```

結果係 `/uk-isa-tracker/apple-touch-icon.png`，只有一次 base，冇問題。所以 GitHub Pages 正常，只有 dev server 出事。

## 4. 原因

喺 dev server 度，Vite 處理 `index.html` 有兩個步驟：

1. 將 `%BASE_URL%` 換成 `/uk-isa-tracker/`，得出 `/uk-isa-tracker/apple-touch-icon.png`。
2. 見到以 `/` 開頭嘅絕對路徑，當佢係 public 資料夾嘅檔案，**再加多次 base**。

結果就變成 `/uk-isa-tracker/uk-isa-tracker/...`。Build 嘅時候唔會咁做，所以兩個環境結果唔同。

## 5. 修正

`index.html` 唔好用 `%BASE_URL%`，直接寫以 `/` 開頭嘅路徑，等 Vite 自己加 base：

```html
<link rel="icon" type="image/svg+xml" href="/icon.svg" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
```

## 6. 驗證

| 環境 | 輸出 |
|---|---|
| Dev server | `/uk-isa-tracker/apple-touch-icon.png` ✅ |
| GitHub Pages build | `/uk-isa-tracker/apple-touch-icon.png` ✅ |
| Cloudflare build（`BASE_PATH=/`） | `/apple-touch-icon.png` ✅ |

## 7. 喺手機重新測試

iOS 會一直用你第一次加入主畫面嗰陣攞到嘅 icon，所以要：

1. 刪咗主畫面舊嗰個捷徑。
2. 喺 Safari 重新載入頁面。
3. 再「加入主畫面」一次。

## 8. 重點

- 喺 Vite 嘅 `index.html`，public 資料夾嘅檔案直接寫 `/檔名` 就得，Vite 會自動加 `base`。
- `%BASE_URL%` 再加絕對路徑，喺 dev server 會令 base 重複。
- 搵唔到嘅檔案喺 SPA dev server 都可能返 `200`（其實係 `index.html`），所以要睇 **content type**，唔好只睇 status code。
