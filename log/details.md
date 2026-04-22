# WaveCode 技術細節紀錄 (Details)

## 2026-03-08 ~ 2026-04-18 (略)

## 2026-04-22 (精密動畫同步、吉他和弦解析與音訊路由優化)

### 1. ADSR 動畫即時響應與執行同步
- **挑戰**：Blockly 的 `Field` 數據更新具有延遲，且 `Ctrl+Enter` 觸發執行時，`Field` 實例往往還在等候 `blur` 事件。
- **解決方案**：
    - **全域監聽**：在 `visualizer.js` 實作 `window.addEventListener('keydown')`。偵測到 `Ctrl+Enter` 時，設置 50ms 延時後觸發 `EnvelopeManager.refreshAll()`。
    - **主動拉取 (Pull Pattern)**：在 `FieldADSR` 的 `playAnimation` 中加入 `_syncFromBlock()`，強制在動畫啟動的當下向積木欄位讀取最新文字，確保視覺與當前設定絕對同步。
    - **精準 Release**：紀錄 `_releaseTimeOffset`。無論處於哪個包絡階段（A/D/S），計算公式統一為 `elapsed >= _releaseTimeOffset` 則進入釋放邏輯，解決了之前必須走完 A+D 才能 Release 的機械感。

### 2. 吉他和弦解析與「聰明大小寫」機制
- **需求**：支援常見吉他和弦命名，且需區分 `EM7` (大七) 與 `Em7` (小七)。
- **實作技術**：
    - **規範化處理**：`symbol[0].toUpperCase() + symbol.slice(1)`。僅對根音進行規範化，保留剩餘字串的大小寫敏感性。
    - **自定義指法注入**：`wc_define_guitar_chord` 積木將 6 弦格數轉換為 MIDI 後，不僅更新 `WaveCodeAPI._chords`（通用字典），也同步回寫至 `GuitarChords.CHORD_DATA` 物理對照表。這讓 `wc_strum` 的下刷/上挑邏輯能依據自定義指法產出正確的音序。

### 3. 頻譜 (FFT) 線性模式視覺優化
- **子像素保護**：計算線寬時使用 `Math.max(1, barW - 0.5)`。這防止了在窄畫布下，譜線寬度因反鋸齒渲染而小於 1px 導致的灰暗透明感。
- **基準線穩定度**：線性模式譜線 Y 軸座標改為 `(drawH + 1) - val`。這 1px 的偏移補償能讓譜線完美地「長」在灰色的基準線上，而不發生斷層。

### 4. 音訊路由分流 (Bypassing Master FX)
- **場景**：預備拍 (Count-in) 若受 Master 效果器（如失真或殘響）影響會變得很嘈雜。
- **解決方案**：在 `AudioManager.js` 中，將 `triggerClick` 的 Gain 節點連接目標從 `masterGain` 改為 `analyser`。這使得音訊路徑變為：`Click -> Analyser -> Destination`，成功繞過 `MasterPatch` 鏈結。
