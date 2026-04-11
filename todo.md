# WaveCode 任務清單 (Todo List)

## [當前目標] 轉生計畫：Web Audio API 混合架構
(目前專注於錄音功能與文檔補完)

## [已完成]
- [x] **[C] Rust 後端角色轉型 (Rust Backend Transition)**
    - [x] 強化「取樣資源伺服器」：優化大量 Sample 檔案的載入與並行解碼效率。
- [x] **[E] 系統與 UI 強化**
    - [x] 實作 MDI 多文件分頁管理系統。
    - [x] 實作全域搜尋引擎 2.0 (支援影子積木與中文)。
    - [x] 實作跨分頁積木複製貼上功能 (Ctrl+C/V)。
- [x] **[A] 音訊引擎標準化 (2026-04-11)**
    - [x] 修復 Sampler 與 ADSR 音量基準不對等問題。
    - [x] 實作 5ms 安全淡出 (De-clicking) 消除爆音。
    - [x] 實作 Look-ahead (150ms) 預排程引擎，解決多軌漂移。
    - [x] 修復取樣器音量控制 Bypass 問題。
- [x] **[S] 演奏系統升級**
    - [x] 萬用音序器 (支援音名、和弦、不分大小寫、連音)。
    - [x] 支援自定義拍號分母 (Time Signature)。
    - [x] 實作精密小節對位系統 (_contextStartTime)。
    - [x] 旋律譜支援力度標註 (:120)。
- [x] **[D] 文件與效能**
    - [x] 補完 `sequencer`, `melody`, `effects`, `master` 說明文件。
    - [x] 示波器 30fps 渲染節流優化。

## [未來規畫]
- [ ] 實作錄音功能 (將 Web Audio 流匯出為 WAV)。
- [ ] 支援多採樣點對應 (Multi-sampling Mapping)。
- [ ] 實作空間效果器 (Reverb)。
