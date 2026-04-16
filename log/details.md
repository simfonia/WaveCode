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

## 2026-04-15 (MIDI 選單時序、翻譯解析與頻率映射策略)

### 1. Blockly 動態選單翻譯失效之根源與解決 (Root Cause)
- **現象**：積木在工具箱時顯示正確，拉出後變成 %BKY_MIDI_ALL_DEVICES%。
- **原因**：當積木在工作區初始化並觸發 Extension 註冊 menuGenerator_ 時，如果該產生器回傳的陣列包含 %BKY_...%，Blockly 的動態選單引擎可能不會二次觸發翻譯解析，導致原始字串被直接渲染。
- **解決方案**：
    - 將 Extension 實作移入 blocks/events.js 以確保加載優先順序。
    - 在 api.js (API Provider) 端直接呼叫 Blockly.Msg['MIDI_ALL_DEVICES'] 並回傳最終字串。這是不依賴解析引擎、在動態環境中最穩定的做法。

### 2. MIDI-to-Frequency 映射算法與 sub-bass 支援
- **策略**：統一使用 440 * Math.pow(2, (midi - 69) / 12)。
- **輸入歧義處理**：在 MusicUtils.noteToFreq 中加入類型檢查，若輸入為 String 則先經由 
oteToMidi 解析，若為 Number 則視為 raw MIDI Note。這讓使用者能自由混合使用 C4 與 60 這兩種輸入方式。

### 3. CSS Filter 狀態模擬技術
- **技術選型**：為了不增加額外的圖示資產並維持 #nyx 色調，採用 filter: hue-rotate(130deg) brightness(1.2) saturate(1.4) 將原始粉色圖示轉換為綠色。
- **優點**：程式碼可控，且能輕鬆實作活動時的 scale 與 drop-shadow 呼吸效果。
