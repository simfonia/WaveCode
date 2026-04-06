# WaveCode 專案結構 (File Structure)

## 根目錄
- `src-tauri/`: Tauri 後端 (Rust)
    - `src/lib.rs`: Tauri 指令、檔案 IO 與本地路徑解析
    - `src/engine.rs`: [已轉型] 資源管理器 (負責載入音訊檔至前端)
    - `resources/`: 應用程式資源 (範例與音訊庫)
        - `docs/`: **[更新] 多語系輔助說明文件 (新增 master_zh-hant.html, 優化 effects_zh-hant.html)**
- `ui/`: 前端程式碼 (Vite + JavaScript)
    - `src/main.js`: 前端主進入點 (整合 DSL 即時語法高亮)
    - `src/blocks/`: 積木定義
        - `audio_instruments.js`: **[重大更新] 拆分 wc_effect_ 獨立效果器, 新增 wc_master 總線積木**
    - `src/generators/`: **[重大更新] 轉型為「音訊 DSL」產生器模式**
        - `javascript/audio_instruments.js`: 產生結構化 DSL 語法 (Instrument, MasterOut)
        - `javascript/audio_performance.js`: 產生演奏 DSL 指令 (Perform, play_note)
    - `src/modules/`: 功能模組
        - `audio/`: Web Audio API 核心引擎
            - `manager.js`: **[更新] 支援動態主鏈 rebuildMasterChain, 移除強制 Limiter**
            - `factory.js`: **[更新] 修正 distortion (WaveShaper) 與 compressor 邏輯**
        - `compiler.js`: **[更新] 支援掃描全域主輸出配置 (scanMaster)**
        - `keyboard_controller.js`: **[更新] 加入 MIDI -> 音名 -> 頻率 詳細日誌輸出**
        - `ui_utils.js`: **[更新] 將 wc_master 加入 Orphan Block 白名單**
    - `src/style.css`: **[新增] Code DSL 語法高亮配色樣式**

---
*最後更新：2026-04-06 (Effect Block Splitting, Master Bus System, Audio DSL Transformation)*
