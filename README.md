# WaveCode IDE

WaveCode 是一個專為高中音訊編程教育設計的獨立 IDE。它結合了 Blockly 的視覺化開發體驗與 Rust 原生 DSP 引擎的高效能，旨在提供低延遲、安全且直觀的音樂編程環境。

## 🚀 核心技術
- **後端引擎**：Rust + [fundsp](https://github.com/SamiPerttu/fundsp) (Functional DSP)
- **應用框架**：Tauri v2
- **視覺編程**：Google Blockly
- **音訊驅動**：cpal (Cross-Platform Audio Library)

## ✨ 主要特色
- **Pure Rust DSP**：100% 原生 Rust 實作，確保系統穩定性與高效能。
- **腦與身體分離架構**：前端負責積木邏輯與版本管理，後端負責實時音訊渲染。
- **NaN 防護盾**：內建針對 Blockly 座標系統的防護，確保 IDE 介面流暢不噴錯。
- **腳本版本控制**：支援非同步演奏指令的即時中斷與覆蓋，杜絕聲音重疊衝突。

## 🛠️ 開發環境
1. 安裝 Rust (Stable)
2. 安裝 Node.js
3. 執行 `npm install` (於 `ui/` 資料夾)
4. 執行 `npm run tauri dev` (於根目錄)

---
*WaveCode - 讓音樂代碼化，讓創作視覺化。*
