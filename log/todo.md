# WaveCode 任務清單 (Todo List)

## 核心願景
打造一個獨立、低延遲、適合高中教育的音訊編程 IDE。

---

## MVP 階段 (Minimum Viable Product)
**目標**：跑出一個獨立視窗，內含 Blockly，點擊積木能讓電腦發出正弦波，並看到簡易波形。

- [ ] **M-1. 環境初始化**
    - [ ] 建立 Tauri 專案框架 (`cargo tauri init`)。
    - [ ] 設定前端 `package.json` 載入 Blockly。
- [ ] **M-2. 音訊引擎啟動 (Rust + libpd)**
    - [ ] 在 Rust 中整合 `libpd-rs` 或連結 `libpd` C 庫。
    - [ ] 設定音訊輸出流 (cpal 或 rodio)。
    - [ ] 建立一個基礎的 `engine.pd` (正弦波測試)。
- [ ] **M-3. 指令通訊橋樑**
    - [ ] 實作 Tauri Command：`send_message_to_pd`。
    - [ ] Blockly 產生簡單的頻率修改指令。
- [ ] **M-4. MVP 介面佈局**
    - [ ] 左側：Blockly 編輯區。
    - [ ] 右側：預留即時波形顯示區。
    - [ ] 實作第一個積木：`播放正弦波 (頻率)`。

---

## 進階開發階段
- [ ] **階段一：音訊功能對齊**
    - [ ] 實作波形疊加 (加法合成) 功能。
    - [ ] 導入 ADSR 包絡線。
    - [ ] 支援 Sampler 載入外部音訊檔。
- [ ] **階段二：即時視覺化**
    - [ ] 實作 60FPS 的流暢示波器 (Oscilloscope)。
    - [ ] 實作頻譜分析儀 (FFT)。
- [ ] **階段三：互動與外部通訊**
    - [ ] 整合 MIDI 裝置存取。
    - [ ] 整合 Serial (Arduino) 通訊。
- [ ] **階段四：程式邏輯支援**
    - [ ] 嵌入 Lua 解釋器以支援 Blockly 的 if/for/變數邏輯。
