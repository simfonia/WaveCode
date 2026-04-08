# WaveCode 專案結構 (File Structure)

## 根目錄
- `src-tauri/`: Tauri 後端 (Rust)
    - `src/lib.rs`: **[更新] 實作序列埠核心指令 (Open/Close/Scan)**
    - `src/engine.rs`: [已轉型] 資源管理器 (負責載入音訊檔至前端)
    - `resources/`: 應用程式資源
        - `examples/`: **[更新] 子目錄結構支援, 新增 Serial_Interactions 專題**
        - `docs/`: [更新] 輔助說明文件 (master, effects, melody)
- `ui/`: 前端程式碼 (Vite + JavaScript)
    - `src/main.js`: 前端主進入點 (整合 DSL 即時語法高亮與轉譯邏輯)
    - `src/blocks/`: 積木定義
        - `audio_instruments.js`: 拆分 wc_effect_ 獨立效果器, 新增 wc_master 總線積木
        - `audio_performance.js`: **[新增] 序列埠初始化與 TTP229 解析積木**
    - `src/generators/`: 轉型為「音訊 DSL」產生器模式
    - `src/modules/`: 功能模組
        - `audio/`: Web Audio API 核心引擎
            - `manager.js`: 支援動態主鏈 rebuildMasterChain, 移除強制 Limiter
        - `api.js`: **[重大更新] 支援精確邏輯排程、旋律解析與序列埠全域監聽**
        - `ui_utils.js`: [更新] 補全 Orphan Block 白名單 (含序列埠事件)
    - `src/style.css`: 加入 Code DSL 語法高亮樣式

---
*最後更新：2026-04-07 (Serial Communication, Multi-touch Logic, Logic Scheduling)*
