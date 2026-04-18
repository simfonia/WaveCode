# WaveCode 技術細節紀錄 (Details)

## 2026-03-08 ~ 2026-04-17 (略)

## 2026-04-18 (積木虛擬渲染與 SVG 資產化)

### 1. Headless Blockly 工作區的渲染挑戰
- **問題**：在沒有可見 DOM 的情況下渲染積木，常會導致寬高計算為 0 或顏色丟失。
- **解決方案**：
    1. 建立一個位於視窗外 (`left: -2000px`) 但仍存在於 `document.body` 中的實體容器進行 `Blockly.inject`。
    2. 導出時，手動將 `Blockly.Css.CONTENT` 注入到 SVG 的 `<style>` 標籤中。這是確保 SVG 檔案獨立開啟時顏色、字體與邊框正確顯示的關鍵。
- **邊界校準**：使用 `block.getHeightWidth()` 取得精確尺寸，並在 SVG `viewBox` 中加入適度 `padding` (5px)，防止積木邊緣（如帽子積木的頂端）被裁切。

### 2. Web 版轉型的 API 適配策略 (Mock/Native Layer)
- **概念設計**：為了達成「一套代碼，雙重執行」，預計實作一個 `NativeAdapter`。
    - 在 Tauri 中：`NativeAdapter.invoke` 對應 `window.__TAURI__.invoke`。
    - 在 Web 中：`NativeAdapter.invoke` 攔截特定指令（如 `get_sample`），並將其轉譯為 `fetch` 請求。
- **序列埠 Mock**：由於序列埠是 WaveCode 的核心，Web 版將優先嘗試連動 **Web Serial API**。若環境不支援，則提供「模擬模式 (Virtual Serial)」，透過虛擬鍵盤或 UI 按鈕模擬硬體位元輸入。

### 3. 多檔案批次下載與瀏覽器安全限制
- **技術細節**：直接觸發大量的 `a.click()` 下載會被現代瀏覽器視為廣告行為而封鎖。
- **優化方案**：在 `BlockExporter` 循環中加入了 100ms 的 `Promise` 延遲，這能顯著提高批次匯出（50+ 個積木）時的成功率。
