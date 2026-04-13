# WaveCode 技術細節紀錄 (Details)

## 2026-03-08 ~ 2026-04-12 (略)

## 2026-04-13 (樣板載入機制與 IDE 事件優先級調校)

### 1. 樣板載入的異步競爭處理
- **問題**：在 `MDIManager` 中立即載入 XML 會因 Blockly 尚未完全繪製 SVG 而導致坐標偏移。
- **解決方案**：
    - 使用 `setTimeout(async () => { ... }, 50)` 包裹載入邏輯。
    - 載入後額外執行 `workspace.scrollX += 30; workspace.scrollY += 30;` 來補償左上角的視覺邊距。
    - **Fallback 機制**：若外部樣板讀取失敗或 XML 損壞，自動回退到 `ToolbarManager.createDefaultBlocks()` 的編程建立模式。

### 2. 鍵盤事件攔截的優先級優化
- **競爭點**：`KeyboardController` 在 `window` 上監聽 `keydown` 並執行 `stopImmediatePropagation()` 以實作 Esc 停止音訊。
- **修復方案**：
    - 在 `KeyboardController` 的 `handleKeyDown` 中，將 `Escape` 判定移至 `isTyping()` 之後。
    - **isTyping 補強**：除了偵測 `input/textarea`，還加入了 `el.classList.contains('blocklyHtmlInput')` 判定，完整涵蓋積木編輯狀態。
- **搜尋框強化**：在 `ui_utils.js` 中使用 `addEventListener('keydown', ..., true)`（Capture 模式）。這讓搜尋框在「事件捕獲階段」就先截獲 Esc，確保它能先於任何全域監聽器執行並清除內容。

### 3. 跨分頁 Ghosting 消除術
- **原理**：Blockly 的 `WidgetDiv` (數字輸入) 與 `DropDownDiv` (下拉選單) 是獨立於 Canvas 之外的 HTML 元素。
- **實作**：在 `mdi-tab-changed` 事件回調中明確呼叫 `.hide()`。這是一個低成本但極高回報的穩定性更新，徹底解決了分頁間的視覺殘留。

### 4. 產生器安樂死機制 (Euthanasia) 穩定化
- **Bug**：之前為了追求簡潔，將 `const _id = typeof _execId !== 'undefined' ? _execId : window.WaveCode._execId;` 簡化為 `const _id = window.WaveCode._execId;`。
- **風險**：在非同步事件（Hat Blocks）中，`window.WaveCode._execId` 始終指向最新的執行 ID。如果使用者「快速點擊停止又啟動」，舊的事件回調觸發時會讀取到「新的 ID」，導致它躲過安樂死機制判斷而繼續執行，造成音訊掛留。
- **修正**：在所有產生器中恢復完整的三元運算子判斷，並確保 MIDI/Serial 回調參數中的 `id` 被正確傳遞。
