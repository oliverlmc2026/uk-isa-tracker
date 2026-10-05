# iPhone Safari 點 hash 連結會成頁重新載入（閃白）：診斷同修正

呢份教學記錄喺 uk-isa-tracker 遇到嘅問題：點樣搵出原因，同埋點樣修正。如果你嘅 SPA 用 hash routing（`#/...`），喺 iPhone 上轉頁會閃白，都可以跟呢份做。

## 1. 症狀

- 用 iPhone Safari 經 **http + LAN IP** 開 dev 或者 preview server（例如 `http://192.168.0.19:5199/`）。
- 每次點底部 tab 轉頁，成頁都會**白一閃**。
- 同一部 iPhone 開正式網站（Cloudflare 或 GitHub Pages，**https**）就唔會閃。
- 第一次開頁面之後，**手動按一次重新載入（F5）**，之後轉頁就唔再閃。
- 私密瀏覽同普通分頁都一樣會閃。
- 電腦嘅瀏覽器完全冇事。

## 2. 原本嘅轉頁寫法

App 用 hash routing，tab 係普通連結：

```tsx
<a href="#/accounts">賬戶</a>
```

App 聽 `hashchange`，再根據 `location.hash` 決定顯示邊頁。理論上點 `#` 連結只會改 hash，唔會重新載入頁面。

## 3. 點樣診斷

### 3.1 先排除常見懷疑對象

| 懷疑 | 點樣測試 | 結果 |
|---|---|---|
| Vite dev server 嘅 HMR WebSocket 斷線導致 reload | 改用 `npm run build && npm run preview -- --host` 開 build 版本 | 一樣閃，排除 |
| 設定 `server.hmr.host` 為 LAN IP | 改 `vite.config.ts` 再測 | 一樣閃，排除 |
| 新加嘅 service worker 或 PWA manifest | 用 `git worktree` build 舊 commit，每個開唔同 port，逐個喺手機對比 | 舊版本一樣閃，排除 |
| 私密瀏覽 | 用普通分頁測 | 一樣閃，排除 |
| Google Fonts 未載完 | debug 顯示 `document.readyState` 同 `document.fonts.status` | 都已完成，排除 |

### 3.2 用畫面上嘅 debug 框證實「係咪真 reload」

iPhone 冇 DevTools，最簡單係喺 `index.html` 臨時加一段 script，將資料直接顯示喺畫面左上角：

```html
<script>
  (function () {
    // 每次 document 載入就 +1；如果點 tab 會增加，就係真 reload
    var n = +(sessionStorage.getItem('dbgLoads') || 0) + 1
    sessionStorage.setItem('dbgLoads', n)
    var t = performance.getEntriesByType('navigation')[0]
    window.__hc = 0 // 如果 document 冇換，呢個數會一直加；換咗就會歸零
    window.addEventListener('hashchange', function () { window.__hc++; show() })
    var box
    function show() {
      if (!box) {
        box = document.createElement('div')
        box.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#000;color:#0f0;font:12px monospace;padding:4px;white-space:pre'
        document.body.appendChild(box)
      }
      box.textContent =
        location.href.replace(location.origin, '') +
        '\nref=' + document.referrer.replace(location.origin, '') +
        '\nxfer=' + (t && t.transferSize) +
        '\nloads=' + n + ' type=' + (t && t.type) + ' hashchanges=' + window.__hc
    }
    window.addEventListener('DOMContentLoaded', show)
  })()
</script>
```

測試結果：

| 指標 | 意思 | iPhone 上見到 |
|---|---|---|
| `loads` | document 載入次數 | 每點一次 tab 就 +1 |
| `type` | 載入類型 | `navigate` |
| `hashchanges` | 同一個 document 內嘅 hash 變化次數 | 每次都歸零 |
| `xfer` | 經網絡傳咗幾多 bytes | 約 300（server 回覆 304 Not Modified） |

**結論：** iPhone Safari 冇將 `#` 連結當成「同一頁內改 hash」，而係當成一次新導航，真係向 server 重新攞頁面。所以會閃白。

> 測完記得移除 debug script（`git checkout index.html`）。

### 3.3 同冇問題嘅 project 對比

另一個 project（punchclock）喺同一部 iPhone 冇呢個問題。對比之下，分別喺轉頁方式：

| | punchclock | uk-isa-tracker（修正前） |
|---|---|---|
| Tab 元素 | `<button data-tab="log">` | `<a href="#/accounts">` |
| 轉頁方式 | JS 切換 `<section>` 嘅 `hidden` class | 瀏覽器跟住連結改 hash |
| 有冇觸發瀏覽器導航 | 冇 | 有 |

即係話，只要唔畀瀏覽器「跟住連結去 `#/...`」，就唔會中招。

## 4. 點解 Safari 會咁做？

**未完全證實。** 已知事實：

- 只會喺 iPhone Safari 經 **http** 開 LAN IP 先出現，https 冇事。
- 第一次載入之後按一次 F5，就會變返正常。

推測同 iOS Safari 處理非 HTTPS 頁面嘅方式有關，但未搵到官方說明。所以以下修正係**繞過**呢個行為，而唔係針對佢嘅成因。

## 5. 修正：用 `history.pushState` 自己改 hash

思路：

- 保留 `<a href="#/...">` 同 hash URL，書籤、直接開網址、Cmd+click 開新分頁照樣用得。
- 點擊時 `preventDefault()`，唔畀瀏覽器跟連結。
- 改用 `history.pushState` 改 URL，再自己通知 router 更新。
- 加聽 `popstate`，令返回、前進鍵照常運作。

### 5.1 `useRoute.ts`

```ts
const ROUTE_CHANGE = 'routechange'

/**
 * Changes the hash with pushState instead of letting the browser follow the link:
 * iOS Safari over plain http (LAN dev) reloads the whole page on a followed hash link.
 */
export function navigate(route: Route) {
  if (parse(location.hash) === route) return // 撳返目前頁面，唔好加多一條 history
  history.pushState(null, '', PATHS[route])
  window.dispatchEvent(new Event(ROUTE_CHANGE))
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(location.hash))
      window.scrollTo(0, 0)
    }
    // hashchange: typed or bookmarked URLs; popstate: back/forward over pushState entries.
    const events = ['hashchange', 'popstate', ROUTE_CHANGE]
    events.forEach((e) => window.addEventListener(e, onChange))
    return () => events.forEach((e) => window.removeEventListener(e, onChange))
  }, [])
  return route
}
```

重點：

- `pushState` **唔會**觸發 `hashchange`，所以要自己 dispatch 一個自訂事件（`routechange`）通知 hook。
- 撳返回、前進鍵經過 `pushState` 建立嘅記錄時，瀏覽器會發 `popstate`，所以要聽埋。
- 繼續聽 `hashchange`，因為用戶直接改網址或者開書籤時仍然會觸發。

### 5.2 `Nav.tsx`

```tsx
<a
  key={r}
  href={routeHref(r)}
  aria-current={r === route ? 'page' : undefined}
  onClick={(e) => {
    // Leave modified clicks (new tab/window) to the browser.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(r)
  }}
>
```

重點：

- 保留 `href`：無障礙工具、長按預覽、開新分頁都仲用得。
- Cmd、Ctrl、Shift、Alt 加點擊交返俾瀏覽器處理，例如開新分頁。

## 6. 驗證清單

**電腦瀏覽器**（可以用 DevTools console 設 `window.__m = 1`，測完睇佢仲喺唔喺度，證明冇 reload）：

- [ ] 點每個 tab，URL hash 同顯示頁面一致。
- [ ] 撳返目前嘅 tab，`history.length` 唔會增加。
- [ ] 返回、前進鍵，頁面跟住 URL 變。
- [ ] 直接改網址 hash，頁面會跟住變。
- [ ] 頁面全程冇 reload。

**iPhone Safari**（用新分頁開 LAN 網址，唔好按 F5）：

- [ ] 點幾次 tab，唔再閃白。

## 7. 其他做法

| 做法 | 優點 | 缺點 |
|---|---|---|
| 本修正（`pushState` + 攔截點擊） | 根本解決，dev 同正式行為一致 | 要改 router 少少 code |
| 第一次開頁之後按一次 F5 | 唔使改 code | 每次都要記得；dev 同正式行為唔一致 |
| 本地 dev 用 HTTPS（`@vitejs/plugin-basic-ssl`） | 更接近正式環境，service worker 都可以測 | 手機要接受自簽憑證警告 |
| 改用 `<button>` 加純 JS 切換（似 punchclock） | 完全唔經 URL 導航 | 冇 URL，冇得書籤或者直接開某一頁 |
