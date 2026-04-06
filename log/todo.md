# WaveCode 任務清單 (Todo List)

## [當前目標] 轉生計畫：Web Audio API 混合架構
- [ ] **[C] Rust 後端角色轉型 (Rust Backend Transition)**
    - [ ] 強化「取樣資源伺服器」：優化大量 Sample 檔案的載入與並行解碼效率 (Worker 化)。
- [ ] **[E] 系統與 UI 強化**
    - [ ] 針對高解析度螢幕優化 UI 配置 (對齊 #nyx 規範)。
    - [ ] 驗證與優化 Master Chain 在快速切換/重置工作區時的資源釋放。
- [ ] **[F] 搜尋系統最終修復**
    - [ ] 徹底解決中文搜尋失效問題 (目前已實作 IME 優化與 NFC 正規化，仍待驗證環境影響)。

## [已完成]
- [x] **[A] 前端音訊引擎 (Web Audio Engine)**
    - [x] 實作多發聲數管理 (Voice Manager)，支援 32+ 同時發聲。
    - [x] 實作基礎組件：Oscillator, ADSR Envelope, Filter, Gain (基於 `Voice.js`)。
    - [x] 實作加法合成器 (Additive Synth) 邏輯。
    - [x] 整合 `AnalyserNode` 並重構示波器 UI (直接從 Web Audio 獲取數據)。
    - [x] 實作 **釋放突跳修復 (Sustain Jump Fix)**：分層起始值策略。
    - [x] **[新增] 背景預載機制**: 程式啟動即解碼取樣檔案，優化 UX。
    - [x] **[新增] 數值安全檢查**: 防止 `NaN/Infinity` 傳入 Web Audio 參數導致報錯。
    - [x] **[新增] 效果器積木大拆分**: 拆分為 Filter, Delay, BitCrush, Distortion, Compressor，解決 Minimap 同步報錯。
    - [x] **[新增] 修正 Distortion & Compressor 邏輯**: 對齊 Web Audio 參數名並優化 Waveshaper 曲線。
- [x] **[B] 演奏系統與 Master 鏈 (#nyx 對齊)**
    - [x] 重構 `playMelody` 解析器，完整支援連結線、附點、三連音。
    - [x] 實作 ADSR 視覺化聯動 (單音與和弦同步觸發)。
    - [x] `wc_note` 拆分為音名與八度選單。
    - [x] 支援鍵盤左右方向鍵切換工作區樂器。
    - [x] **[新增] 主輸出控制系統**: 實作 `wc_master` 積木與動態 Master Bus 重建，支援全域效果鏈。
    - [x] **[新增] 鍵盤演奏日誌強化**: 顯示 MIDI、音名與頻率詳情。
- [x] **[C] 搜尋系統優化**
    - [x] 實作 IME (組字) 監聽優化。
    - [x] 實作全文索引與 Unicode NFC 正規化。
- [x] **[D] 安全性與穩定性防線**
    - [x] 實作 **同步無窮迴圈鎖死守衛 (Loop Guard)**。
    - [x] 強化安樂死機制 (Euthanasia)。
    - [x] 驗證和弦演奏穩定性與示波器同步。
- [x] **[E] 文件與 DSL 轉型**
    - [x] **[重大異動] 指令鏈轉型為「音訊 DSL」**: 產生結構化描述語法並實作即時語法高亮。
    - [x] **[更新] 輔助說明文件系統**: 更新 `effects` 並新增 `master` 詳盡技術說明。
- [x] 統一積木前綴為 `wc_`。
- [x] 工具箱分類與核心積木修復。
- [x] 實作加法合成器積木 (Mutation 與 UI)。
- [x] IDE 設定選單與 Scroll Options 持久化。
- [x] 跨平台路徑適配與資源掛載。

## [未來規畫]
- [ ] 實作空間效果器 (Reverb)。
- [ ] 支援多採樣點對應 (Multi-sampling Mapping)。
- [ ] 錄音功能 (將 Web Audio 流匯出為 WAV)。
