# WaveCode 技術細節紀錄 (Details)

## 2026-03-08 ~ 2026-04-08 (略)

## 2026-04-09 (多軌數據隔離、音量標準化與搜尋索引升級)

### 1. 多軌並行數據踩踏 (Data Race in Audio Params)
- **問題**：當兩個音軌同時執行並使用同一個樂器 ID 時，它們會共享同一個 Patch 對象。若音軌 A 修改了 Filter 頻率，音軌 B 也會受到影響。
- **解決方案**：
    - **深拷貝 (Deep Copy)**：在 `Voice.play(patch, ...)` 內部執行 `this.patch = JSON.parse(JSON.stringify(patch))`。這確保了每個發聲聲部 (Voice) 擁有的都是一份獨立的參數快照。
    - **獨立計時器**：透過 `Object.create` 隔離 `WaveCodeAPI` 的實例，確保各軌道的 `this._playbackTime` 互不干擾。

### 2. 音量單位與增益補償清理
- **Bug 根源**：`compiler.js` 為了「方便」預先將 100% 轉為 1.0，但 `factory.js` 的 `Volume` 組件設計為接受 0-500 的百分比並在內部 `/100`。結果導致音量被除算兩次 (10000 倍縮小)。
- **修正**：
    - Compiler 僅透傳數值。
    - `factory.js` 統一處理：`node.gain.setTargetAtTime(val / 100, ...)`。
    - 移除了調試期為了「聽得到聲音」而在 Oscillator/ADSR 額外加入的 4.0x 增益，回歸 1.0 nominal 基準。

### 3. 高性能積木搜尋 (Enhanced Indexing)
- **索引策略**：
    - **Static Index**：從 `Blockly.Blocks[type].messageX` 抓取。
    - **Dynamic Index (New)**：`workspace.newBlock(type)` 後呼叫 `field.getText()`。這能抓到：
        1. 下拉選單的選項文字。
        2. 動態生成的 Label。
        3. 透過 `replaceMessageReferences` 翻譯後的內容。
- **影子積木支援**：`BlockSearcher` 快取了 Toolbox 的原始 JSON。當使用者搜尋到 `wc_play_note` 時，Flyout 顯示的是帶有 `C4`、`1拍`、`100力度` 的完整積木，而非空殼。

### 4. UI 時序 Bug：開檔即 Dirty
- **原因**：`Blockly.Xml.domToWorkspace` 是同步執行的，但它觸發的事件（尤其是與 Mutator 或 Field 渲染相關的）有時會延遲。如果在 `domToWorkspace` 後立即 `setDirty(false)`，隨後的延遲事件會立刻將其設回 `true`。
- **修正**：在 `MDIManager` 加入 `setTimeout(..., 100)` 確保所有後續事件消化完畢後，才進行最終的 `setDirty(false)` 與 `isClearing = false` 切換。
