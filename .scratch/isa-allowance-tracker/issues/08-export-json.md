# 08: 匯出全部資料成 JSON

**What to build:** 用戶一鍵下載包含全部資料（ISA Account、Contribution、設定）嘅 JSON 備份檔，檔案帶 schema 版本號。因為資料只存喺瀏覽器（ADR 0001），UI 持續提醒用戶：清除瀏覽器資料會令記錄消失，除非已匯出備份。

**Blocked by:** 01

**Status:** done

- [x] 可下載 JSON 檔，內含全部賬戶、Contribution 同設定
- [x] JSON 帶 schema 版本號
- [x] 空狀態亦可匯出（有效嘅空備份）
- [x] UI 有清楚提醒：清除瀏覽器資料會令記錄消失，需靠匯出備份
- [x] 序列化行為有測試覆蓋（為 09 嘅往返測試鋪路）
