# WaveCode 專案結構 (File Structure)

## 根目錄
- `src-tauri/`: Tauri 後端 (Rust)
    - `src/main.rs`: 程式進入點
    - `src/lib.rs`: Tauri 指令與狀態管理
    - `src/engine.rs`: **核心音訊引擎 (fundsp 實作)**
    - `Cargo.toml`: Rust 依賴管理 (fundsp, cpal)
- `ui/`: 前端程式碼 (Vite + JavaScript)
    - `src/main.js`: 前端主進入點，協調各模組
    - `src/style.css`: IDE 樣式定義
    - `src/blocks/`: Blockly 積木定義
        - `audio.js`: **整合式音訊積木定義**
    - `src/generators/`: Blockly 程式碼產生器
        - `javascript/audio.js`: **整合式音訊產生器**
    - `src/modules/`: 功能模組
        - `api.js`: **API 層與腳本版本控制**
        - `ui_utils.js`: **NaN 防護盾與插件初始化**
        - `compiler.js`: **鏈式邏輯分析編譯器**
    - `src/lang/`: i18n 語系檔 (zh-hant.js, en.js)
    - `public/`: 靜態資源與第三方庫 (Blockly, 插件)
- `resources/`: 應用程式資源
    - `examples/`: 內建積木範例檔 (.wave)
- `docs/`: 系統規格與開發文件
    - `system_spec.html`: **系統規格說明書**
- `log/`: 開發日誌與任務清單
    - `todo.md`: 任務清單
    - `handover.md`: 任務交接紀錄
    - `details.md`: 技術實戰細節

---
*最後更新：2026-03-09 (Pure Rust Refactor)*
