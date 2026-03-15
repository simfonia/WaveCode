# WaveCode 專案結構 (File Structure)

## 根目錄
- `src-tauri/`: Tauri 後端 (Rust)
    - `src/main.rs`: 程式進入點
    - `src/lib.rs`: Tauri 指令與狀態管理
    - `src/engine.rs`: **核心音訊引擎 (fundsp 實作)**
    - `Cargo.toml`: Rust 依賴管理 (**fundsp, cpal, hound, puremp3, rayon**)
- `ui/`: 前端程式碼 (Vite + JavaScript)
    - `src/main.js`: 前端主進入點，實作更新系統與設定選單
    - `src/style.css`: IDE 樣式定義，包含旋轉與彈跳動畫
    - `src/blocks/`: Blockly 積木定義 (模組化)
        - `audio_instruments.js`: 樂器定義、OSC 與 **Sampler (取樣器)**
        - `audio_performance.js`: 演奏指令 (同步/異步)
        - `audio_train.js`: 音訊電路 (火車模式)
        - `text.js`: 文字處理積木 (wc_ 前綴)
    - `src/generators/javascript/`: Blockly 程式碼產生器 (模組化)
    - `src/modules/`: 功能模組
        - `api.js`: API 層、腳本版本控制與異步觸發
        - `keyboard_controller.js`: **PC 鍵盤演奏模組 (鋼琴佈局)**
        - `ui_utils.js`: NaN 防護盾與插件初始化
        - `compiler.js`: 遞迴鏈式邏輯分析編譯器 (支援取樣器 ID 解析)
        - `visualizer.js`: ADSR 視覺化 (Glow)、示波器 (Clip 警告)
        - `toolbox.js`: 獨立工具箱定義 (對齊 #processing 分類)
    - `src/lang/`: i18n 語系檔 (zh-hant.js, en.js)
- `resources/`: 應用程式資源
    - `examples/`: 內建積木範例檔 (.wave)
    - `samples/`: **多取樣音色庫 (WAV/MP3)**
- `docs/`: 系統規格與開發文件
    - `system_spec.html`: **系統規格說明書**
- `log/`: 開發日誌與任務清單
    - `todo.md`: 任務清單
    - `handover.md`: 任務交接紀錄
    - `details.md`: 技術實戰細節

---
*最後更新：2026-03-14 (Sampler v2 & Parallel Loading)*
