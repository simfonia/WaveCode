# WaveCode 技術細節紀錄 (Details)

## 2026-03-08 ~ 2026-04-11 (略)

## 2026-04-12 (錄音輸出穩定性、Tail Guard 尾跡守衛與編譯器連通性)

### 1. 引擎重置下的錄音中斷 (Recording Break on Reset)
- **問題**：重置 `AudioContext` 導致錄音失敗。
- **解決方案**：在 UI 層實作延遲啟動旗標，確保 Context 穩定後才開啟 Recorder。

### 2. 智慧靜音偵測的「啟動誤判」 (False Stop)
- **解決方案**：引入 `hasPlayed` 守衛，確保在 `activeVoiceCount > 0` 之後的 0 狀態才視為結束。

### 3. Reverb 沒聲音的編譯器遺失問題
- **診斷**：`audio_instruments.js` 雖然定義了積木，但 `compiler.js` 掃描樂器鏈時漏掉了 `wc_effect_reverb` 的解析。
- **修復**：在編譯器的 `scanInstruments` 與 `scanMaster` 中補全解析邏輯，將積木數值正確映射至 `effect_type: 'reverb'` 的 Patch 對象。

### 4. ADSR 釋放後的爆音問題 (The "Click" on Release)
- **問題**：當 Reverb 放在 ADSR 之後，ADSR 釋放結束會立即觸發 `Voice.kill()`，強行中斷 Reverb 餘韻的電訊號。
- **解決方案 - 尾跡守衛 (Tail Guard)**：
    - 在 `Voice.play` 時檢測效果鏈中是否有長尾跡效果器。
    - 記錄 `extraTail` (例如 Reverb 的 Seconds)。
    - 在 `Voice.release` 時，將 `releaseTimer` 的超時時間設定為 `Release + extraTail`。
    - 確保電路直到完全靜音後才中斷連接。

### 5. BitCrush 的 ScriptProcessor 實作
- **實現**：由於 Web Audio 原生節點不包含 BitCrush，我們透過 `ScriptProcessorNode` 手動進行量化處理 (`step * Math.floor(input / step)`)。注意：未來可遷移至 `AudioWorklet` 以獲得更好效能。
