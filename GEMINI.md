# WaveCode 專案指南 (GEMINI.md)

## 專案概述
WaveCode 是一個基於 Tauri + Rust + fundsp 的獨立音訊編程 IDE。它結合了 Blockly 的視覺化邏輯與 Rust 原生 DSP 引擎的高效能。

## ⚠️ 核心技術規範：fundsp 引擎
**本專案完全棄用 libpd，改用 100% Pure Rust 的 fundsp 庫。**

### 1. 音訊引擎架構 (src-tauri/src/engine.rs)
- **基礎單元**：使用 `Box<dyn AudioUnit>` 封裝 DSP 鏈。
- **無鎖通訊**：透過 `Shared` 變數在主執行緒與音訊執行緒間傳遞數值 (如 `freq`, `vol`)。
- **執行緒安全**：音訊回調中嚴禁分配記憶體或阻塞，所有運算須在 `AudioUnit` 內部完成。

### 2. 前端通訊協議 (Tauri Commands)
- `send_float(receiver, value)`：通用控制指令。
    - 若 `receiver` 包含 `"freq"` -> 設定頻率。
    - 若 `receiver` 包含 `"vol"` -> 設定音量（大於 0 時自動啟動引擎）。
- `stop_audio()`：重置音量為 0 並暫停 DSP 運算。
- `update_patch(commands)`：由編譯器發出的初始參數集。

### 3. 前端腳本管理 (ui/src/modules/api.js)
- **版本控制 (`_execId`)**：每次點擊 Run 或 Stop 時 ID 遞增。
- **安樂死機制**：非同步任務 (如 `sleep`) 會在醒來後檢查 ID，若不符則立即拋出 `Script cancelled` 以終止舊腳本執行。

## 前端開發規範
- **NaN 防護盾**：`UIUtils.injectNaNShield()` 會攔截無效的 SVG 屬性寫入，防止 Minimap 報錯。
- **模組化**：
    - `api.js`: 腳本執行與通訊。
    - `ui_utils.js`: UI 輔助與插件初始化。
    - `compiler.js`: 鏈式邏輯分析。
- **積木整合**：所有音訊相關積木統一定義於 `ui/src/blocks/audio.js`。

---
*最後更新日期：2026-03-09*
