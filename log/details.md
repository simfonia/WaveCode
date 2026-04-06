# WaveCode 技術細節紀錄 (Details)

## 2026-03-08 ~ 2026-04-04 (略)

## 2026-04-05 (Web Audio 穩定性、同步守衛與產生器修復)

### 1. 徹底根治「釋放突跳 (Sustain Jump)」
- **問題**：在 Web Audio 中，若使用 `gain.exponentialRampToValueAtTime`，必須先使用 `setValueAtTime` 設定起始點。若在「預約未來釋放」時讀取 `gain.value` (當前值)，會因為讀到 0 (音符尚未開始) 或舊值而導致釋放瞬間音量跳變。
- **解決方案：分層起始值策略**：
    - **即時釋放 (Manual/Real-time)**：使用 `Math.max(0.0001, this.envNode.gain.value)`。這確保了手動彈奏時能從當前聽到的位置開始 Release。
    - **預約釋放 (Scheduled/Sequencer)**：根據 `startTime` 與 `adsr` 參數進行階段估算。若 `startTime` 超過 `Attack + Decay` 區間，則起始值設為 `Sustain` 值；否則設為 `1.0`。這解決了快速序列演奏時的爆音問題。

### 2. 同步無窮迴圈鎖死守衛 (Loop Guard)
- **原理**：JavaScript 是單執行緒，同步的 `while(true) {}` 會鎖死整個 UI。
- **實作**：
    - 在 `WaveCodeAPI` 加入 `checkLoop(id)` 方法，維護一個 `_loopCounters` Map。
    - 在 `ToolbarManager` 產生程式碼時，注入 `Blockly.JavaScript.INFINITE_LOOP_TRAP = 'WaveCode.checkLoop(_id);\n';`。
    - **歸零機制**：每當執行 `await sleep` 時，代表執行權已交還給 UI，此時將該腳本的計數器歸零。
    - **觸發機制**：若計數器超過 10,000 次未歸零，代表發生了同步卡死，立即拋出 `Error` 中斷執行。

### 3. Blockly 產生器環境相容性 (V10+ Fix)
- **問題**：在現代 Blockly 中，`this.valueToCode` 需要正確的 `this` 綁定。手動呼叫 `Blockly.JavaScript.forBlock['...'](block)` 會因為遺失 Context 而崩潰。
- **解決**：
    - 統一使用 `const generator = (window.javascript && window.javascript.javascriptGenerator) || Blockly.JavaScript;` 取得實例。
    - 呼叫 `generator.blockToCode(block)`，讓 Blockly 內部自動處理 `this` 綁定與優先序陣列處理。
    - 確保在產生前呼叫 `generator.init(workspace)` 以初始化變數資料庫。

### 4. 精確排程與 Voice 物件綁定
- **變更**：`WaveCodeAPI.playNote` 不再透過頻率搜尋來 release。
- **優點**：`AudioManager.triggerNote` 現在會回傳該聲部的 `Voice` 物件，`playNote` 直接對該物件呼叫 `release(time)`。這保證了即使在同頻率、同 ID 的重疊演奏下，每個音符的 Release 都能精確對應到自己的起始排程，不會發生「誤殺」鄰近音符的情況。
