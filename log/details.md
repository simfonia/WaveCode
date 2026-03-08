# WaveCode 技術細節紀錄 (Details)

## 2026-03-08 (專案啟動日技術總結)

### 1. libpd-rs 0.1.10 API 實戰細節
- **初始化模式**：使用 `libpd_rs::convenience::PdGlobal::init_and_configure(0, channels, sample_rate)?`。
- **音訊處理**：需在回調中呼叫 `libpd_rs::process::process_float(ticks, &[], data)`，注意即使無輸入也需傳入空切片。
- **訊息傳送**：正確方法為 `libpd_rs::send::send_float_to(receiver, value)`。
- **路徑陷阱**：在開發模式下，工作目錄位於 `src-tauri`，需手動退回根目錄以讀取 `resources/` 下的 Patch。

### 2. 音訊穩定性與高品質發聲
- **音訊水庫 (Ring Buffer)**：解決了硬體緩衝區（如 480 samples）與 libpd 運算單位（64 samples）不對齊導致的斷續震盪聲。透過 `VecDeque` 實作樣本佇列。
- **絕對靜音補丁**：解決了停止發聲後可能殘留的直流偏移 (DC Offset) 低頻聲。在音訊回調中增加 `active` 旗標，關閉時強制將所有樣本填為 `0.0`。

### 3. Tauri v2 與 WebView 限制解決
- **資源存取**：Tauri 預設攔截 `node_modules` 的存取。解決方案是將 Blockly 核心檔案複製到 `ui/public/lib/` 並改為根路徑引用。
- **Global Tauri API**：需在 `tauri.conf.json` 設定 `withGlobalTauri: true`，前端才能透過 `window.__TAURI__` 進行 `invoke` 通訊。

### 4. Blockly 與 UI 優化
- **0 高度問題**：SVG 畫不出來通常是因為容器高度為 0。透過將 `body` 與 `#app` 設為 `height: 100vh / 100%` 解決。
- **Scroll-Options 補丁**：為了避免積木拉向左側 Toolbox 刪除時畫面自動逃跑，透過攔截 `ScrollBlockDragger.prototype.getOverallScrollVector_` 強制歸零左側動力。
- **JavaScript 風格積木**：定調為 JS 語法，利於高中生接軌未來網頁開發。
