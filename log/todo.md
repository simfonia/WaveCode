# WaveCode 任務清單 (Todo List)

## [當前目標] 轉生計畫：Web Audio API 混合架構
(目前專注於錄音功能與文檔補完)

## [已完成]
- [x] **[C] Rust 後端角色轉型 (Rust Backend Transition)**
    - [x] 強化「取樣資源伺服器」：優化大量 Sample 檔案的載入與並行解碼效率 (Worker 化)。
- [x] **[E] 系統與 UI 強化**
    - [x] 針對高解析度螢幕優化 UI 配置 (對齊 #nyx 規範)。
    - [x] 徹底修復範例選單中的「幽靈項目/重複項目」問題。
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
    - [x] 實作多發聲數管理 (Voice Manager)，支援 32+ 同時發聲。
    - [x] 實作基礎組件：Oscillator, ADSR Envelope, Filter, Gain。
    - [x] 實作加法合成器 (Additive Synth) 邏輯。
    - [x] 整合 `AnalyserNode` 並重構示波器 UI。
    - [x] 實作 **釋放突跳修復 (Sustain Jump Fix)**。
    - [x] 實作效果器積木大拆分 (Filter, Delay, BitCrush, Distortion, Compressor)。
- [x] **[B] 演奏系統與 Master 鏈 (#nyx 對齊)**
    - [x] 重構 `playMelody` 解析器，完整支援連結線、附點、三連音。
    - [x] **[強化] 演奏同步機制**: 引入 `_playbackTime` 線性排程，解決音符擠壓問題。
    - [x] **[強化] ADSR 視覺化同步**: 實作定時動畫與安樂死檢查。
    - [x] **[補全] 和弦系統**: 實作 `defineChord` 與 `playChord` API。
    - [x] 實作 `wc_master` 積木與動態 Master Bus 重建。
    - [x] **[移植] 核心演奏積木移植 (#nyx 強化版)**:
        - 實作 `wc_loop` (並行循環音軌)。
        - 實作 `wc_count_in` (具備 Click 與時間位移同步的預備拍)。
        - 實作 `wc_wait_musical` (自動對齊 BPM 的拍子/小節等待)。
        - 實作 `wc_rhythm_v2` (支援變拍號與解析度的多軌序列器)。
        - 實作 `wc_release_note` (精確音符釋放控制)。
- [x] **[D] 安全性與穩定性防線**
    - [x] 實作 **同步無窮迴圈鎖死守衛 (Loop Guard)**。
    - [x] 強化安樂死機制 (Euthanasia)。
    - [x] **[核心規範] 確立「禁止盲目覆寫」鐵律**。
- [x] **[E] 文件與 DSL 轉型**
    - [x] **[重大異動] 指令鏈轉型為「音訊 DSL」**: 實作「底層跑 JS，上層看 DSL」模式與語法高亮。
    - [x] **[更新] 輔助說明文件系統**: 更新 `effects`, `master`, `melody` 說明文件。

## [未來規畫]
- [ ] 實作空間效果器 (Reverb)。
- [ ] 支援多採樣點對應 (Multi-sampling Mapping)。
- [ ] 錄音功能 (將 Web Audio 流匯出為 WAV)。
