# WaveCode 專案指南 (GEMINI.md)

## 專案概述
WaveCode 是一個基於 Tauri + Rust + libpd 的獨立音訊編程 IDE。它結合了 Blockly 的易用性與原生程式的高效能。

## 行為規範 (嚴嚴格執行)
- **使用正體中文**對話。
- **低延遲優先**：在實作 Rust 後端時，必須確保音訊執行緒 (Audio Callback) 的即時性，嚴禁在回調中執行會阻塞或分配記憶體的操作。
- **指令通訊模式**：前端 Blockly 不產生 Java/C++ 代碼進行編譯，而是產生**指令訊息 (Messages)** 或**腳本 (Lua/JS)** 傳送給後端引擎執行。
- **系統規格書同步**：異動架構或通訊協定時，必須更新 `docs/system_spec.md`。

## 關鍵目錄說明
- `src-tauri/`: Rust 後端與 Tauri 配置。
    - `src-tauri/src/engine/`: libpd 整合與音訊處理邏輯。
- `ui/`: 前端網頁代碼。
    - `ui/blocks/`: Blockly 積木定義。
    - `ui/generators/`: Blockly 產生器 (產出指令流)。
- `log/`: 開發日誌與任務清單。

## 開發慣例
- **Tauri Commands**：前端與後端的溝通必須定義清楚的 API 介面。
- **Pd Patches**：核心音訊演算法定義在 `.pd` 檔案中，由 Rust 載入。
