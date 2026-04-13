# WaveCode 技術細節紀錄 (Details)

## 2026-03-08 ~ 2026-04-12 (略)

## 2026-04-13 (第一階段：樣板載入機制、IDE 事件優先級與多採樣算法)
(已記錄在原始檔案中)

## 2026-04-13 (第二階段：目錄解析策略、ID 歧義消除與 Extensions 實作)

### 1. 深度子目錄與 ID 分隔符號設計
- **問題**：在支援多層目錄（如 `violin/sust`）時，若使用底線 `_` 作為唯一分隔符，會導致與檔名（如 `bass_drum`）產生解析歧義。
- **解決方案**：
    - 內部儲存 ID 格式：`[相對目錄路徑]::[純檔名]`。
    - 目錄路徑內層級：統一使用 `/`。
    - Rust 端：在遞迴掃描時累積路徑，並直接將切分好的 `folder` 與 `filename` 封裝進 `SampleInfo` 結構傳給 JS。

### 2. Blockly 動態選單的連動機制 (Extensions)
- **實作方式**：
    - 使用 `field.menuGenerator_` 取代靜態清單。
    - 在 `wc_percussion_menu_sync` 擴充中，透過 `setOnChange` 監聽 `FOLDER` 欄位的變動。
    - 當資料夾更換時，手動呼叫 `FILE` 欄位的 `setValue` 並重設預設值，強制觸發 UI 重新渲染與選單更新。

### 3. 多採樣映射 (Multi-sampling) 的目錄前綴匹配
- **邏輯調整**：`findBestSample` 現在會檢查 ID 是否以 `[folder]::` 開頭。這確保了系統只會在特定的資料夾內尋找最近的音高取樣，而不會跨目錄誤抓（例如 `piano` 資料夾不會抓到 `grand_piano` 的檔案）。

### 4. IDE 日誌同步
- **通訊方式**：`AudioManager` 本身無 log 方法，必須透過 `import { invoke } from "@tauri-apps/api/core"` (或對應環境的 API) 呼叫後端 `log` 指令。
- **效果**：取樣載入完成後，IDE 底部的日誌面板會顯示詳細的統計資訊（檔案總數、耗時、分類分佈）。
