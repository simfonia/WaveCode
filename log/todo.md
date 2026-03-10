# WaveCode 任務清單 (Todo List)

## 核心願景
打造一個獨立、低延遲、100% Rust 原生、適合高中教育的音訊編程 IDE。

---

## [進行中]
- [ ] **階段一：音訊引擎進化 (fundsp 深化)**
    - [ ] 實作 ADSR 包絡線，解決聲音啟閉生硬爆音的問題。
    - [ ] 支援多種波形切換：Sine, Saw, Square, Triangle。
    - [ ] 實作複音引擎 (Polyphony)，支援同時播放多個音符。
    - [ ] **帽子積木**：實作「定義樂器」邏輯，對齊 Processing 創作風格。
- [ ] **階段二：功能模組擴充**
    - [ ] 實作基本取樣器 (Sampler)，支援讀取 WAV 檔案。
    - [ ] 加入空間效果器：Delay, Reverb。
    - [ ] 加入動態效果器：Soft Limiter (防止爆音)。
- [ ] **階段三：視覺化與 UX**
    - [ ] 實作 60FPS 即時示波器 (Oscilloscope)。
    - [ ] 實作 FFT 頻譜分析儀。
    - [ ] 優化 Blockly 插件載入速度。

---

## [已完成]
- [x] **M-1. 引擎架構轉型 (Pure Rust)**
    - [x] 棄用 libpd，全面遷移至 fundsp 引擎。
    - [x] 實作無鎖 Shared 變數通訊機制。
- [x] **M-2. 前端模組化重整**
    - [x] 實作 `WaveCodeAPI` 版本控制系統 (`_execId`)。
    - [x] 實作 `UIUtils` NaN 防護盾，解決 Minimap 噴錯問題。
    - [x] 整合積木與產生器，簡化 `main.js`。
- [x] **M-3. 核心功能穩定化**
    - [x] 實作「樂器定義」與「發聲事件」分離邏輯。
    - [x] 補回語系切換、範例、更新等核心按鈕功能。
- [x] **M-4. 文件對齊**
    - [x] 更新 `GEMINI.md`, `FILE_STRUCTURE.md`, `README.md`, `system_spec.html`。

---
*最後更新：2026-03-09*
