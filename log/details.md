# WaveCode 技術細節紀錄 (Details)

## 2026-03-08 ~ 2026-04-17 (略)

## 2026-04-18 (積木虛擬渲染、座標系對焦與 CSS 強制覆寫)

### 1. 全量工作區匯出的座標對焦技術
- **挑戰**：直接克隆 `getCanvas()` 會帶入當前的縮放 (`scale`) 與位移 (`translate`)，導致 `viewBox` 計算偏移，積木被截斷或出現大片空白。
- **解決方案**：
    1. **Transform 重置**：克隆積木層後，強制 `removeAttribute('transform')`。
    2. **座標變換**：遍歷所有積木並呼叫 `getRelativeToSurfaceXY()`。這是積木相對於工作區無限表面的絕對座標，不隨視窗滾動或縮放改變。
    3. **ViewBox 動態計算**：依據 Surface 座標的最大最小值計算 `width/height`，並加入 `padding: 40px` 邊距補償。

### 2. 停用積木 (Disabled) 的 CSS 強制覆寫
- **問題**：Blockly 會在 `svgPath` 元素上直接寫入內聯 `fill` 屬性（通常是 Pattern 填充）。傳統 CSS 無法覆蓋。
- **解決方案**：
    - **暴力選擇器**：使用 `[class*="Disabled"] .blocklyPath`。
    - **屬性鎖定**：搭配 `!important` 強制設定 `fill` 為紮實灰色 (`#333333`)，並將 `fill-opacity` 設為 `1`。
    - **濾鏡清除**：加入 `filter: none !important` 移除 Blockly 預設的暗化濾鏡，確保在黑色背景下仍有足夠對比度。

### 3. 高品質 PNG 轉換與樣式同步
- **技術路徑**：`SVG String -> Blob URL -> Image -> Canvas -> PNG Blob`。
- **排版修正**：將 CSS 注入邏輯封裝於 `_getExportCSS()`。透過將字體大小固定為 `11pt`，解決了 SVG 在不同檢視器中因字體解釋差異導致的「文字寬度溢出積木邊框」問題。
- **背景處理**：在 Canvas 繪製前先執行 `ctx.fillRect` 填充深色底，確保匯出的圖片在透明環境下仍保有 IDE 質感。

### 4. 批次下載與資源加載優化
- **封鎖容錯**：JSZip 若因 Tracking Prevention 載入失敗，程式具備「自動降級」機制，會改為逐一觸發 `<a>` 標籤點擊下載。
- **任務報表**：將 `Toolbox/Mutators/Residuals` 的掃描統計置於 `exportAll` 任務的最後一步，避免進度訊息湮沒成果統計。
