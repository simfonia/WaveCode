# WaveCode 專案結構 (File Structure)

## 根目錄
- `src-tauri/`: Tauri 後端 (Rust)
    - `src/main.rs`: 程式進入點
    - `src/lib.rs`: Tauri 指令與狀態管理
    - `src/engine.rs`: **核心音訊引擎 (fundsp 實作)**
    - `src/utils.rs`: **路徑管理與資源解析 (對齊 #nyx 穩定架構)**
    - `Cargo.toml`: Rust 依賴管理 (**fundsp, cpal, hound, puremp3, rayon**)
- `ui/`: 前端程式碼 (Vite + JavaScript)
    - `src/main.js`: 前端主進入點，實作更新系統與設定選單
    - `src/style.css`: IDE 樣式定義，包含 MDI 分頁與側邊面板縮放
    - `src/blocks/`: Blockly 積木定義 (模組化)
    - `src/generators/javascript/`: Blockly 程式碼產生器 (模組化)
    - `src/modules/`: 功能模組
        - `mdi_manager.js`: **多文件分頁管理員 (MDI)**
        - `toolbar_manager.js`: **工具列與選單管理員**
        - `updater.js`: **更新檢查模組**
        - `api.js`: API 層、腳本版本控制與異步觸發
        - `keyboard_controller.js`: PC 鍵盤演奏模組 (鋼琴佈局)
        - `ui_utils.js`: **側邊面板 (Stage) 縮放與 Log 注入**
        - `compiler.js`: 遞迴鏈式邏輯分析編譯器
        - `visualizer.js`: ADSR 視覺化 (Glow)、示波器 (Clip 警告)
        - `toolbox.js`: 獨立工具箱定義
    - `src/lang/`: i18n 語系檔 (zh-hant.js, en.js)
- `resources/`: 應用程式資源
    - `examples/`: 內建積木範例檔 (.wave)
    - `samples/`: 多取樣音色庫 (WAV/MP3)
    - `docs/`: **積木 HTML 輔助說明文件 (對齊 #nyx Help 系統)**
- `log/`: 開發日誌與任務清單
    - `todo.md`: 任務清單
    - `handover.md`: 任務交接紀錄
    - `details.md`: 技術實戰細節

---
*最後更新：2026-04-03 (UI Alignment & Path Refactor)*
