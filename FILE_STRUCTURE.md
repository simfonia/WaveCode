# WaveCode 專案結構 (File Structure)

## 根目錄
- `src-tauri/`: Tauri 後端 (Rust)
    - `src/main.rs`: 程式進入點
    - `src/lib.rs`: **Tauri 指令、檔案 IO 與 open_url 本地路徑解析**
    - `src/engine.rs`: **核心音訊引擎 (fundsp 實作 + FFT)**
    - `src/utils.rs`: **資源與快取路徑偵測 (支援開發與生產環境)**
    - `Cargo.toml`: Rust 依賴管理 (**fundsp, cpal, hound, rustfft, rayon**)
    - `resources/`: **應用程式資源 (統一存放於此處，支援 Tauri v2 打包)**
        - `examples/`: 內建積木範例檔 (.wave)
        - `samples/`: 多取樣音色庫 (WAV/MP3)
        - `docs/`: **中英文 HTML 輔助說明文件 (WaveCode 規格 + 深色風格)**
            - `launchpad/developer_manual.html`: MIDI 控制器整合說明
- `ui/`: 前端程式碼 (Vite + JavaScript)
    - `index.html`: **雙欄即時分析儀介面 (Waveform + Spectrum)**
    - `src/main.js`: 前端主進入點，實作更新系統與設定選單
    - `src/style.css`: **IDE 樣式定義，包含 MDI 分頁、側邊面板縮放與雙欄視覺化佈局**
    - `src/blocks/`: Blockly 積木定義 (模組化)
    - `src/generators/javascript/`: Blockly 程式碼產生器 (模組化)
    - `src/modules/`: 功能模組
        - `mdi_manager.js`: **MDI 多文件分頁管理員 (含 SELECTED 事件修復與自動切換分頁)**
        - `toolbar_manager.js`: **工具列、音量控制與範例選單管理員**
        - `updater.js`: **更新檢查模組**
        - `api.js`: API 層、腳本版本控制與異步觸發
        - `keyboard_controller.js`: PC 鍵盤演奏模組 (Start/End 視覺觸發)
        - `ui_utils.js`: **側邊面板縮放、Log 注入與 switchSmartTab 分頁切換**
        - `compiler.js`: 遞迴鏈式邏輯分析編譯器
        - `visualizer.js`: **ADSR 視覺化 (Glow/Hold)、即時分析儀 (示波器 + FFT)**
        - `toolbox.js`: 獨立工具箱定義
    - `src/lang/`: i18n 語系檔 (zh-hant.js, en.js)
- `log/`: 開發日誌與任務清單
    - `todo.md`: 任務清單
    - `handover.md`: 任務交接紀錄
    - `details.md`: 技術實戰細節
    - `work/`: 每日工作日誌

---
*最後更新：2026-04-04 (Resource Consolidation, Help System Overhaul, MDI Stability & Right Panel Layout Optimization)*
