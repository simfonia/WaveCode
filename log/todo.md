# WaveCode 任務清單 (Todo List)

## [當前目標] 轉生計畫：Web Audio API 混合架構
- [ ] **[A] 前端音訊引擎 (Web Audio Engine)**
    - [ ] 建立 `ui/src/modules/audio_engine.js`。
    - [ ] 實作多發聲數管理 (Voice Manager)，支援 32+ 同時發聲。
    - [ ] 實作基礎組件：Oscillator, Sampler, ADSR Envelope, Filter, Gain。
    - [ ] 實作加法合成器 (Additive Synth) 邏輯。
    - [ ] 整合 `AnalyserNode` 並重構示波器 UI (直接從 Web Audio 獲取數據)。
- [ ] **[B] 聯邦編譯器更新 (Compiler Refactor)**
    - [ ] 修改 `ui/src/modules/compiler.js`：將 Patch 資料傳遞給前端 `AudioEngine` 而非 Rust。
    - [ ] 確保 `trigger_note` 與 `release_note` 事件在前端直接分流。
- [ ] **[C] Rust 後端角色轉型 (Rust Backend Transition)**
    - [ ] 清理 `src-tauri/src/engine.rs`：移除 `cpal` 與 `fundsp` 相關運算。
    - [ ] 強化「取樣資源伺服器」：讓 Rust 負責高效讀取音訊檔並轉為 Float32 傳回前端。
- [ ] **[D] 效能與功能驗證**
    - [ ] 驗證和弦演奏穩定性 (無振動、低延遲)。
    - [ ] 驗證示波器視覺聽覺同步。

## [已完成]
- [x] 統一積木前綴為 `wc_`。
- [x] 工具箱分類與核心積木修復。
- [x] 實作加法合成器積木 (Mutation 與 UI)。
- [x] IDE 設定選單與 Scroll Options 持久化。
- [x] 跨平台路徑適配與資源掛載。

## [未來規畫]
- [ ] 實作空間效果器 (Reverb, Delay)。
- [ ] 支援多採樣點對應 (Multi-sampling Mapping)。
- [ ] 錄音功能 (將 Web Audio 流匯出為 WAV)。
