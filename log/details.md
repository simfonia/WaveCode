# WaveCode 技術細節紀錄 (Details)

## 2026-03-08 ~ 2026-04-11 (略)

## 2026-04-12 (錄音輸出穩定性、靜音偵測守衛與 UI 容器切換)

### 1. 引擎重置下的錄音中斷 (Recording Break on Reset)
- **問題**：在連動錄音模式下，`runBtn.onclick` 會先執行 `restartAudio()`。如果錄音機在 `restartAudio` 之前啟動，重置過程會銷毀舊的 `AudioContext` 導致錄音失敗。
- **解決方案**：
    - **延遲啟動**：在 `ToolbarManager` 中實作 `_syncRecordPending` 旗標。
    - **時序控制**：點擊按鈕後先進入 UI 錄音狀態 -> 執行 `restartAudio` -> 在重置後的 `then` 回調中才正式呼叫 `Recorder.start()`。這保證了錄音機抓取的是全新的、穩定的串流。

### 2. 智慧靜音偵測的「啟動誤判」 (False Stop in Silence Polling)
- **問題**：有些程式在啟動瞬間（例如載入 Sample 或初始化）發聲數為 0，會導致錄音剛開始就被判定為「結束」而自動結算。
- **解決方案**：
    - **播放偵測守衛 (hasPlayed Guard)**：引入一個 boolean 變數 `hasPlayed`。
    - **邏輯門檻**：輪詢開始後，只有在偵測到 `activeVoiceCount > 0` (代表音樂真正開始響了) 之後，後續的 `activeVoiceCount === 0` 才被視為有效的結算信號。

### 3. OGG 格式在 Windows 上的播放異常 (Error 0xC00D3E8C)
- **問題**：錄製完成的 OGG 檔案在 Windows 媒體播放器中顯示「時長為 0」或無法播放。
- **原因**：MediaRecorder 產出的 Blob 有時缺少 Metadata 標記，且時長過短（< 1s）的檔案會被系統判定為毀損。
- **修正**：
    - **500ms 閾值**：在 `Recorder.stop()` 中加入檢查，若時長過短則取消匯出並提示。
    - **MIME 強制標記**：在下載時使用 `new Blob([chunks], { type: 'audio/ogg' })` 強制重新封裝，幫助作業系統正確解讀。

### 4. 工具列事件遺失與 MDI 相容性 (Event Loss in Replace)
- **問題**：在頻繁使用 `replace` 修改 `toolbar_manager.js` 時，容易導致 `updateBtn` 或 `saveBtn` 等舊事件被意外刪除。
- **診斷**：`replace` 的 `old_string` 範圍過大且不包含所有事件綁定。
- **修正規範**：建立「外科手術式」修改規範。禁止替換整個 `bindEvents` 方法。改為針對單一區塊（如錄音控制區）進行定位替換，並在修改後主動查核 MDI 分頁管理功能（`mdiManager`）的存續性。
