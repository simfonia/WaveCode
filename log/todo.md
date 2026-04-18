# WaveCode

WaveCode 是一個專為高中音訊編程教育設計的獨立 IDE。它結合了 Blockly 的視覺化開發體驗與 **Web Audio API** 的強大實時合成能力，旨在提供低延遲、安全且直觀的音樂編程環境。

## 🚀 核心技術 (Hybrid Architecture)
- **音訊引擎**：Web Audio API (JavaScript / C++) - 負責實時合成與多聲部排程。
- **系統外殼**：Tauri v2 (Rust) - 負責高效檔案 IO、並行資源解碼與序列埠通訊。
- **視覺編程**：Google Blockly。
- **通訊協議**：Tauri Invoke (二進位快速通道) - 實現前端與系統的原生級連動。

# WaveCode 任務清單 (Todo List)

## [已完成]
- [x] **[R] 錄音與匯出系統 (Recording & Export) - 2026-04-12**
    - [x] 實作 `Recorder.js` 獨立錄音模組，採用 OGG/Opus 編碼確保跨平台播放相容性。
    - [x] 實作 **智慧靜音偵測 (Silence Polling)**：透過 `getActiveVoiceCount` 自動偵測播放結束並結算。
    - [x] 實作 **動態錄音 UI**：錄音時自動隱藏入口按鈕，切換為「統一停止鍵 + 計時器」模式。
    - [x] 實作 **錄音連動機制**：支援「即時隨按隨錄」與「連動自動執行」雙模式。
    - [x] 修正 Tauri FS 權限：解決二進位音訊資料寫入被拒的問題。
- [x] **[C] Rust 後端角色轉型 (Rust Backend Transition)**
    - [x] 強化「取樣資源伺服器」：優化大量 Sample 檔案的載入與並行解碼效率 (Worker 化)。
- [x] **[E] 系統與 UI 強化**
    - [x] 針對高解析度螢幕優化 UI 配置 (對齊 #nyx 規範)。
    - [x] 徹底修復範例選單中的「幽靈項目/重複項目」問題。
    - [x] 更新工具列圖示：存檔按鈕改為下載樣式 (`download_24dp_FE2F89`)。
- [x] **[F] 搜尋系統最終修復**
    - [x] 徹底解決中文搜尋失效問題 (Search 2.0)。
- [x] **[F] 序列埠通訊與互動系統 (Serial Interaction)**
    - [x] 整合 Rust `serialport` 套件，實作 Open/Close/Scan 指令。
    - [x] 實作前端 `wc_serial_init` 積木與 COM 埠動態掃描。
    - [x] 實作 `wc_serial_check_ttp` 積木，具備 16-bit 邊緣偵測邏輯。
    - [x] 實作全域 `serial-data` 監聽器與 `WaveCodeAPI.handleSerialData`。
    - [x] 建立 ex_15 序列埠 Drum Pad 專題範例。
    - [x] 更新 `arduino.txt` 為 16-bit 全狀態輸出模式。
- [x] **[A] 前端音訊引擎 (Web Audio Engine)**
    - [x] 實作多發聲數管理 (Voice Manager)，支援 32+ 同時發聲.
    - [x] 實作基礎組件：Oscillator, ADSR Envelope, Filter, Gain.
    - [x] 實作加法合成器 (Additive Synth) 邏輯.
    - [x] 整合 `AnalyserNode` 並重構示波器 UI.
    - [x] 實作 **釋放突跳修復 (Sustain Jump Fix)**.
    - [x] 實作效果器積木大拆分 (Filter, Delay, BitCrush, Distortion, Compressor, Reverb).
- [x] **[B] 演奏系統與 Master 鏈 (#nyx 對齊)**
    - [x] 重構 `playMelody` 解析器，完整支援連結線、附點、三連音.
    - [x] **[強化] 演奏同步機制**: 引入 `_playbackTime` 線性排程，解決音符擠壓問題.
    - [x] **[強化] ADSR 視覺化同步**: 實作定時動畫與安樂死檢查.
    - [x] **[補全] 和弦系統**: 實作 `defineChord` 與 `playChord` API.
    - [x] 實作 `wc_master` 積木與動態 Master Bus 重建.
    - [x] **[移植] 核心演奏積木移植 (#nyx 強化版)**:
        - 實作 `wc_loop` (並行循環音軌).
        - 實作 `wc_count_in` (具備 Click 與時間位移同步的預備拍).
        - 實作 `wc_wait_musical` (自動對齊 BPM 的拍子/小節等待).
        - 實作 `wc_rhythm_v2` (支援變拍號與解析度的多軌序列器).
        - 實作 `wc_release_note` (精確音符釋放控制).
- [x] **[D] 安全性與穩定性防線**
    - [x] 實作 **同步無窮迴圈鎖死守衛 (Loop Guard)**.
    - [x] 強化安樂死機制 (Euthanasia).
    - [x] **[核心規範] 確立「禁止盲目覆寫」鐵律**.
- [x] **[E] 文件與 DSL 轉型**
    - [x] **[重大異動] 指令鏈轉型為「音訊 DSL」**: 實作「底層跑 JS，上層看 DSL」模式與語法高亮.
    - [x] **[更新] 輔助說明文件系統**: 更新 `effects`, `master`, `melody` 說明文件.
- [x] **[G] 通用多採樣映射系統 (Multi-sampling Mapping) - 2026-04-13**
- [x] **[G] 取樣系統深度優化 (Sample System Optimization) - 2026-04-13**
    - [x] 實作智慧分類機制 (旋律類 vs 打擊類)。
    - [x] 解決 ID 底線歧義問題，改用 `::` 作為分隔符號。
    - [x] 實作打擊類積木兩層連動選單 (資料夾 > 檔案)。
    - [x] 完成全量官方範例 (.wave) 遷移與測試。
    - [x] 更新 HTML 說明文件與幫助系統連結。
- [x] 實作空間效果器 (Reverb).
- [x] **[H] 工業級 MIDI 系統升級 (#nyx 標準) - 2026-04-15**
    - [x] 實作 **全時自動連線**：MIDI 在啟動時初始化，不依賴程式執行。
    - [x] 實作 **雙向通訊**：支援 MIDI Inputs 接收與 Outputs 發送。
    - [x] 實作 **狀態追蹤**：`_pressedMidiKeys` 全時追蹤物理按鍵狀態。
    - [x] 實作 **IDE 視覺回饋**：工具列 MIDI 圖示連線狀態與活動閃爍 (100ms 縮放強光)。
    - [x] 實作 **動態裝置選單**：`wc_midi_output_sync` 擴充支援硬體熱插拔即時刷新。
    - [x] 補齊 i18n 標籤：完成 `zh-hant.js` 與 `en.js` 的所有新積木標籤。
- [x] **[Dev] 開發者工具實作 - 2026-04-18**
    - [x] 實作 `BlockExporter.js`：支援全量積木 SVG/PNG 批次匯出，用於說明文件整理。

## [待辦]
- [ ] 目前進度除錯，依指示進行。
- [x] 為每個積木匯出svg/png檔，以建立說明文件。
- [ ] 說明文件補完，中英雙語化。
- [ ] i18n
- [ ] 架構重整、參數ini檔、模組化
- [ ] 程式碼總清理


## [未來規畫，未必要，等指示再進行]
- [ ] **[Web] WaveCode Web 版 (GitHub Pages)**:
    - [ ] 實作 `NativeAPI` 適配層，支援 Tauri 與 Web 環境自動切換。
    - [ ] 資源載入 HTTP 化：將音訊樣本改由 Fetch 載入。
    - [ ] 硬體通訊 Mock/WebAPI：使用 Web Serial 與 Web MIDI。
- [ ] UI 視覺化控制組件 (旋鈕/曲線)。
- [ ] 支援更多音訊匯出格式 (如 MP3/OGG)。
- [ ] 實作取樣預聽功能 (在選單中預覽聲音)。
- [ ] MIDI 檔案匯入。