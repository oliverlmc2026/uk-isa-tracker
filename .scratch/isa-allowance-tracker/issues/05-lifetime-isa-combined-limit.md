# 05: Lifetime ISA 同合計 £4,000 上限

**What to build:** 用戶可以建立 Lifetime ISA (LISA) 賬戶（可多個）。Dashboard 顯示所選 Tax Year 內所有 LISA 賬戶合計供款對 £4,000 LISA 上限嘅用量同剩餘。LISA 供款同時計入 ISA Allowance。LISA 合計超出 £4,000 時照記，並顯示超額警告同超出金額；LISA 冇預警，只有超額警告。

**Blocked by:** 01

**Status:** done

- [x] 建立賬戶時可揀 Lifetime ISA
- [x] Dashboard 顯示 LISA 合計已用同剩餘（對所選 Tax Year 嘅 LISA 上限）
- [x] 多個 LISA 賬戶合併計算同一個 £4,000 上限
- [x] LISA 供款同時計入 ISA Allowance 總用量
- [x] 超出 LISA 上限時照記，並顯示超額警告同超出金額
- [x] LISA 達到上限之前冇任何預警
- [x] Seam 1 測試涵蓋：多個 LISA 賬戶合計、LISA 計入 ISA Allowance、剛好 £4,000 vs 超出一 pence、LISA 冇預警
